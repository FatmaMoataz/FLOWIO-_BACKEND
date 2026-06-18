import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { unlink } from 'fs/promises';
import { MeetingLog } from '../../models/meetingLog.model.js';
import { Task } from '../../models/task.model.js';
import { Meeting } from '../../models/meeting.model.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'https://repave-caddy-padlock.ngrok-free.dev';

const NGROK_HEADERS = { 'ngrok-skip-browser-warning': 'true' };

// ── Poll for result until ready ────────────────────────────────────────────────

const pollForResult = async (jobId, maxWaitMs = 600000) => {
    const pollInterval = 5000;
    const maxAttempts  = maxWaitMs / pollInterval;
    let   attempts     = 0;

    console.log(`[AI] Polling for job ${jobId}...`);

    while (attempts < maxAttempts) {
        attempts++;

        try {
            const response = await axios.get(
                `${AI_SERVICE_URL}/api/results/${jobId}`,
                { headers: NGROK_HEADERS, timeout: 10000 }
            );

            const data = response.data;
            console.log(`[AI] Poll attempt ${attempts} — status: ${data.status || 'unknown'}`);

            if (data.transcription?.text || data.summary_en || data.summary) {
                console.log(`[AI] Job ${jobId} completed after ${attempts} polls.`);
                return data;
            }

            if (data.status === 'queued' || data.status === 'processing') {
                await new Promise(resolve => setTimeout(resolve, pollInterval));
                continue;
            }

            return data;

        } catch (err) {
            if (err.response?.status === 404) {
                console.log(`[AI] Job ${jobId} not ready yet (attempt ${attempts})`);
                await new Promise(resolve => setTimeout(resolve, pollInterval));
                continue;
            }
            throw err;
        }
    }

    throw new Error(`AI job ${jobId} timed out after ${maxWaitMs / 1000}s`);
};

// ── Main function ──────────────────────────────────────────────────────────────

const processAudioWithAI = async (meetingId, audioFilePath, attendees = []) => {
    await MeetingLog.findOneAndUpdate(
        { meetingId },
        { ai_status: 'processing' }
    );

    try {
        console.log(`[AI] Sending audio to Flask service for meeting ${meetingId}...`);

        const form = new FormData();
        form.append('audio_file', fs.createReadStream(audioFilePath));
        form.append('language', 'en');
        form.append('enable_translation', 'false');

        console.log(`[AI] Endpoint: ${AI_SERVICE_URL}/api/process`);

        const submitResponse = await axios.post(
            `${AI_SERVICE_URL}/api/process`,
            form,
            {
                headers: { ...form.getHeaders(), ...NGROK_HEADERS },
                timeout: 600000
            }
        );

        const submitData = submitResponse.data;
        console.log(`[AI] Submitted. Response:`, JSON.stringify(submitData, null, 2));

        let aiData;

        if (submitData.transcription?.text || submitData.summary_en || submitData.summary) {
            console.log(`[AI] Got synchronous result directly.`);
            aiData = submitData;
        } else if (submitData.job_id) {
            console.log(`[AI] Job queued with ID: ${submitData.job_id}. Starting polling...`);
            aiData = await pollForResult(submitData.job_id);
        } else {
            throw new Error('Unexpected response from AI service: ' + JSON.stringify(submitData));
        }

        console.log(`[AI] Final result received. Transcript: ${aiData.transcription?.text?.length || 0} chars`);

        const mapped = mapAIResponse(aiData, attendees);

        await MeetingLog.findOneAndUpdate(
            { meetingId },
            {
                transcript:       mapped.transcript,
                summaryText:      mapped.summaryText,
                summaryParagraph: mapped.summaryParagraph,
                ai_status:        'completed',
                processed_at:     new Date()
            }
        );

        const insertedTasks = await insertExtractedTasks(meetingId, mapped.tasks);

        // ✅ FIX 2 — Clean up temp audio file after processing
        try {
            await unlink(audioFilePath);
            console.log('[AI] Temp audio file cleaned up.');
        } catch (cleanupErr) {
            console.warn('[AI] Could not delete temp file:', cleanupErr.message);
        }

        console.log(`[AI] Done. Inserted ${insertedTasks.length} tasks.`);
        return { transcript: mapped.transcript, summary: mapped.summaryParagraph, insertedTasks };

    } catch (err) {
        await MeetingLog.findOneAndUpdate(
            { meetingId },
            { ai_status: 'failed', ai_error: err.message }
        );
        console.error('[AI] Processing failed:', err.message);
        throw err;
    }
};

// ── Map her response → our format ─────────────────────────────────────────────

const mapAIResponse = (aiData, attendees = []) => {
    const transcript = aiData.transcription?.text || '';
    console.log(`[AI Mapping] Transcript: ${transcript.length} chars`);

    const summaryParagraph = aiData.summary_en || aiData.summary || '';

    // ✅ FIX 1 — Robust sentence splitting that handles all summary formats
    const summaryText = summaryParagraph.length > 0
        ? (summaryParagraph
            .match(/[^.!?]+[.!?]+/g)
            ?.map(s => s.trim())
            .filter(s => s.length > 10)
            ?? [summaryParagraph])
        : [];

    console.log(`[AI Mapping] Summary points: ${summaryText.length}`);

    const tasks = [];
    const actionItems = aiData.action_items || {};

    // ✅ FIX 1 — Handle BOTH response formats from her service:
    // Format A: { "Sarah": [{task, deadline...}] }  ← object keyed by name
    // Format B: [{assignee, task, deadline...}]      ← flat array
    if (Array.isArray(actionItems)) {
        // Format B — flat array
        console.log(`[AI Mapping] Action items format: flat array (${actionItems.length} items)`);
        for (const item of actionItems) {
            const personName = item.assignee || item.speaker || 'Unknown';
            const matchedUser = attendees.find(a =>
                a.email?.toLowerCase() === item.assignee_email?.toLowerCase() ||
                a.name?.toLowerCase()  === personName.toLowerCase()
            );
            tasks.push({
                title:       item.task_en || item.task || `Task for ${personName}`,
                description: item.task_ar ? `AR: ${item.task_ar}` : '',
                assignedTo:  matchedUser?._id || null,
                priority:    item.priority || 'medium',
                deadline:    item.deadline ? new Date(item.deadline) : null
            });
            console.log(`[AI Mapping] Task: "${item.task_en || item.task}" → assignee: ${matchedUser?.name || 'unassigned'}`);
        }
    } else {
        // Format A — object keyed by name
        console.log(`[AI Mapping] Action items format: keyed object. Keys:`, Object.keys(actionItems));
        for (const [personName, items] of Object.entries(actionItems)) {
            if (!Array.isArray(items)) continue;
            for (const item of items) {
                const matchedUser = attendees.find(a =>
                    a.email?.toLowerCase() === item.assignee_email?.toLowerCase() ||
                    a.name?.toLowerCase()  === personName.toLowerCase()
                );
                tasks.push({
                    title:       item.task_en || item.task || `Task for ${personName}`,
                    description: item.task_ar ? `AR: ${item.task_ar}` : '',
                    assignedTo:  matchedUser?._id || null,
                    priority:    item.priority || 'medium',
                    deadline:    item.deadline ? new Date(item.deadline) : null
                });
                console.log(`[AI Mapping] Task: "${item.task_en || item.task}" → assignee: ${matchedUser?.name || 'unassigned'}`);
            }
        }
    }

    console.log(`[AI Mapping] Total tasks: ${tasks.length}`);
    return { transcript, summaryText, summaryParagraph, tasks };
};

// ── Insert tasks into Tasks collection ────────────────────────────────────────

const insertExtractedTasks = async (meetingId, tasks = []) => {
    if (!tasks.length) {
        console.log(`[Tasks] No tasks to insert.`);
        return [];
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new Error('Meeting not found when inserting tasks.');

    const insertedTasks    = [];
    const updatedExtracted = [];

    for (const item of tasks) {
        try {
            const task = await Task.create({
                title:       item.title,
                description: item.description || `Extracted from meeting: ${meeting.title}`,
                projectId:   meeting.projectId,
                assignedTo:  item.assignedTo  || null,
                priority:    item.priority    || 'medium',
                deadline:    item.deadline    || null,
                status:      'todo'
            });

            insertedTasks.push(task);
            updatedExtracted.push({
                title:       item.title,
                description: item.description,
                assignedTo:  item.assignedTo,
                priority:    item.priority,
                deadline:    item.deadline,
                inserted:    true,
                taskId:      task._id
            });

            console.log(`[Tasks] ✅ Created: ${task._id} — "${item.title}"`);
        } catch (err) {
            console.error(`[Tasks] ❌ Failed: "${item.title}"`, err.message);
            updatedExtracted.push({ ...item, inserted: false });
        }
    }

    await MeetingLog.findOneAndUpdate(
        { meetingId },
        { extracted_tasks: updatedExtracted }
    );

    console.log(`[Tasks] ${insertedTasks.length}/${tasks.length} tasks inserted.`);
    return insertedTasks;
};

// ── Retry ──────────────────────────────────────────────────────────────────────

const retryAIProcessing = async (meetingId, audioFilePath, attendees) => {
    console.log(`[AI] Retrying meeting ${meetingId}...`);
    await MeetingLog.findOneAndUpdate(
        { meetingId },
        { ai_status: 'pending', ai_error: null }
    );
    return await processAudioWithAI(meetingId, audioFilePath, attendees);
};

export { processAudioWithAI, insertExtractedTasks, retryAIProcessing };