// ─────────────────────────────────────────────────────────────────────────────
// aiIntegration.service.js — with MOCK MODE added at the top
// Copy this block and paste it right after your imports.
// Toggle MOCK_MODE = true while partner is offline, false when she's online.
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { unlink } from 'fs/promises';
import { MeetingLog } from '../../models/meetingLog.model.js';
import { Task } from '../../models/task.model.js';
import { Meeting } from '../../models/meeting.model.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'https://repave-caddy-padlock.ngrok-free.dev';
const NGROK_HEADERS  = { 'ngrok-skip-browser-warning': 'true' };

// ─────────────────────────────────────────────────────────────────────────────
// 🧪 MOCK MODE — flip this to false the moment your partner's server is online
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_MODE = true;

const getMockAIResponse = (attendees = []) => {
    // Simulates the EXACT JSON structure your partner's Flask service returns.
    // Covers Format B (flat array) — which is what her current service sends.
    const first  = attendees[0] || null;
    const second = attendees[1] || null;

    return {
        // Matches: aiData.transcription?.text
        transcription: {
            text: `[MOCK] John: We need to fix the login bug — it's blocking all users.
Sara: I'll handle that today, it's urgent.
John: Great. Also the API docs need updating before end of week.
Mike: I can take that. I'll also review the DB schema.
John: Perfect. Unit tests for the payment module too — Friday deadline.
Sara: On it. See everyone Thursday.`
        },
        // Matches: aiData.summary_en
        summary_en: `The team aligned on sprint priorities. Sara will fix the critical login bug immediately and deliver unit tests for the payment module by Friday. Mike will update API documentation and review the database schema for upcoming features. Next sync is Thursday.`,

        // Matches: aiData.action_items — Format B (flat array)
        action_items: [
            {
                task_en:       'Fix critical login bug',
                task_ar:       '',
                assignee:      first?.name  || 'Unassigned',
                assignee_email: first?.email || '',
                priority:      'high',
                deadline:      new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
                task_en:       'Write unit tests for payment module',
                task_ar:       '',
                assignee:      first?.name  || 'Unassigned',
                assignee_email: first?.email || '',
                priority:      'high',
                deadline:      new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
                task_en:       'Update API documentation',
                task_ar:       '',
                assignee:      second?.name  || 'Unassigned',
                assignee_email: second?.email || '',
                priority:      'medium',
                deadline:      new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
                task_en:       'Review database schema for new features',
                task_ar:       '',
                assignee:      second?.name  || 'Unassigned',
                assignee_email: second?.email || '',
                priority:      'medium',
                deadline:      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
        ]
    };
};

// ── Poll for result ───────────────────────────────────────────────────────────

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

// ── Main ──────────────────────────────────────────────────────────────────────

const processAudioWithAI = async (meetingId, audioFilePath, attendees = []) => {
    await MeetingLog.findOneAndUpdate(
        { meetingId },
        { ai_status: 'processing' }
    );

    try {
        let aiData;

        // ── MOCK PATH ─────────────────────────────────────────────────────────
        if (MOCK_MODE) {
            console.log(`[AI] 🧪 MOCK MODE — skipping real Flask call for meeting ${meetingId}`);
            await new Promise(resolve => setTimeout(resolve, 1500)); // simulate latency
            aiData = getMockAIResponse(attendees);
            console.log(`[AI] 🧪 Mock data generated. action_items: ${aiData.action_items.length}`);

        // ── REAL PATH ─────────────────────────────────────────────────────────
        } else {
            console.log(`[AI] Sending audio to Flask service for meeting ${meetingId}...`);
            console.log(`[AI] Endpoint: ${AI_SERVICE_URL}/api/process`);

            const form = new FormData();
            form.append('audio_file', fs.createReadStream(audioFilePath));
            form.append('language', 'en');
            form.append('enable_translation', 'false');

            const submitResponse = await axios.post(
                `${AI_SERVICE_URL}/api/process`,
                form,
                { headers: { ...form.getHeaders(), ...NGROK_HEADERS }, timeout: 600000 }
            );

            const submitData = submitResponse.data;
            console.log(`[AI] Submit response:`, JSON.stringify(submitData, null, 2));

            // Guard: HTML response = ngrok error page, not JSON
            if (typeof submitData !== 'object' || submitData === null) {
                throw new Error('AI service returned non-JSON. Is ngrok running?');
            }

            if (submitData.transcription?.text || submitData.summary_en || submitData.summary) {
                aiData = submitData;
            } else if (submitData.job_id) {
                console.log(`[AI] Job queued: ${submitData.job_id}. Polling...`);
                aiData = await pollForResult(submitData.job_id);
            } else {
                throw new Error('Unexpected AI response: ' + JSON.stringify(submitData));
            }
        }

        console.log(`[AI] Transcript length: ${aiData.transcription?.text?.length || 0} chars`);

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

        // Cleanup temp audio file
        try {
            await unlink(audioFilePath);
            console.log('[AI] Temp audio file cleaned up.');
        } catch (cleanupErr) {
            console.warn('[AI] Could not delete temp file:', cleanupErr.message);
        }

        console.log(`[AI] ✅ Done. Inserted ${insertedTasks.length} tasks.`);
        return { transcript: mapped.transcript, summary: mapped.summaryParagraph, insertedTasks };

    } catch (err) {
        await MeetingLog.findOneAndUpdate(
            { meetingId },
            { ai_status: 'failed', ai_error: err.message }
        );
        console.error('[AI] ❌ Processing failed:', err.message);
        throw err;
    }
};

// ── Map AI response → internal format ────────────────────────────────────────

const mapAIResponse = (aiData, attendees = []) => {
    const transcript = aiData.transcription?.text || '';
    console.log(`[AI Mapping] Transcript: ${transcript.length} chars`);

    const summaryParagraph = aiData.summary_en || aiData.summary || '';

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

    if (Array.isArray(actionItems)) {
        console.log(`[AI Mapping] Format: flat array (${actionItems.length} items)`);
        for (const item of actionItems) {
            const personName  = item.assignee || item.speaker || 'Unknown';
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
            console.log(`[AI Mapping] Task: "${item.task_en || item.task}" → ${matchedUser?.name || 'unassigned'}`);
        }
    } else {
        console.log(`[AI Mapping] Format: keyed object. Keys:`, Object.keys(actionItems));
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
                console.log(`[AI Mapping] Task: "${item.task_en || item.task}" → ${matchedUser?.name || 'unassigned'}`);
            }
        }
    }

    console.log(`[AI Mapping] Total tasks mapped: ${tasks.length}`);
    return { transcript, summaryText, summaryParagraph, tasks };
};

// ── Insert tasks ──────────────────────────────────────────────────────────────

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
            updatedExtracted.push({ ...item, inserted: true, taskId: task._id });
            console.log(`[Tasks] ✅ Created: "${item.title}"`);
        } catch (err) {
            console.error(`[Tasks] ❌ Failed: "${item.title}"`, err.message);
            updatedExtracted.push({ ...item, inserted: false });
        }
    }

    await MeetingLog.findOneAndUpdate({ meetingId }, { extracted_tasks: updatedExtracted });
    console.log(`[Tasks] ${insertedTasks.length}/${tasks.length} tasks inserted.`);
    return insertedTasks;
};

// ── Retry ─────────────────────────────────────────────────────────────────────

const retryAIProcessing = async (meetingId, audioFilePath, attendees) => {
    console.log(`[AI] Retrying meeting ${meetingId}...`);
    await MeetingLog.findOneAndUpdate({ meetingId }, { ai_status: 'pending', ai_error: null });
    return await processAudioWithAI(meetingId, audioFilePath, attendees);
};

export { processAudioWithAI, insertExtractedTasks, retryAIProcessing };