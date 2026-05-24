import fs from 'fs'; // مكتبة Node.js الأساسية
import axios from 'axios'; // جاهزة ومحولة لـ ES6 عشان الـ Real Path
import FormData from 'form-data'; 

// إضافة امتداد .js للموديلات المحلية إجباري
import { MeetingLog } from '../../models/meetingLog.model.js';
import { Task } from '../../models/task.model.js';
import { Meeting } from '../../models/meeting.model.js';

// ─────────────────────────────────────────────────────────────────────────────
// 🧪 MOCK MODE — AI Python service not ready yet
// When your teammate finishes the Python service:
//   1. Set USE_MOCK_AI = false
//   2. Delete the getMockAIResponse function below
// ─────────────────────────────────────────────────────────────────────────────
const USE_MOCK_AI = true;

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ── Mock response — simulates exactly what Python AI would return ──────────────
const getMockAIResponse = (attendees = []) => {
    const firstAttendee  = attendees[0]?._id || null;
    const secondAttendee = attendees[1]?._id || null;

    return {
        transcript: `[MOCK TRANSCRIPT]
John: Good morning everyone. Let's go over the sprint tasks for this week.
Sara: Sure. I think we need to fix the login bug as soon as possible — it's blocking users.
John: Agreed. Sara, can you handle that? It's urgent.
Sara: Yes, I'll take care of it today.
John: Great. Also, we need to update the API documentation before end of week.
Mike: I can do that. I'll also review the database schema for the new features.
John: Perfect. Let's also make sure we write unit tests for the payment module.
Sara: I'll add that to my list too. Done by Friday.
John: Sounds good. Next meeting is Thursday.`,

        summary: `[MOCK SUMMARY]
The team discussed sprint priorities. Sara will fix the critical login bug urgently and write unit tests for the payment module by Friday. Mike will update API docs and review the database schema. Next meeting Thursday.`,

        tasks: [
            {
                title:       'Fix critical login bug',
                description: 'Login bug is blocking users — needs immediate attention.',
                assignedTo:  firstAttendee,
                priority:    'high',
                deadline:    new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // tomorrow
            },
            {
                title:       'Update API documentation',
                description: 'API docs must be updated before end of week.',
                assignedTo:  secondAttendee,
                priority:    'medium',
                deadline:    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
            },
            {
                title:       'Review database schema for new features',
                description: 'Schema review needed before implementation begins.',
                assignedTo:  secondAttendee,
                priority:    'medium',
                deadline:    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
            },
            {
                title:       'Write unit tests for payment module',
                description: 'Unit tests for payment module must be done by Friday.',
                assignedTo:  firstAttendee,
                priority:    'high',
                deadline:    new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) // 4 days
            }
        ]
    };
};

// ── Main function — called after meeting ends and audio is uploaded ─────────────
export const processAudioWithAI = async (meetingId, audioFilePath, attendees = []) => {
    // 1. Mark log as processing
    await MeetingLog.findOneAndUpdate(
        { meetingId },
        { ai_status: 'processing' }
    );

    try {
        let transcript, summary, tasks;

        if (USE_MOCK_AI) {
            // ── 🧪 MOCK PATH ───────────────────────────────────────────────────
            console.log(`[MOCK AI] Simulating processing for meeting ${meetingId}...`);
            // 2 second delay so you can test the 'processing' status in the log
            await new Promise(resolve => setTimeout(resolve, 2000));
            ({ transcript, summary, tasks } = getMockAIResponse(attendees));
            console.log(`[MOCK AI] Done. Generated ${tasks.length} mock tasks.`);

        } else {
            // ── 🤖 REAL PATH — جاهز تماماً للاستخدام عند تفعيل الـ Real AI ──────────
            const form = new FormData();
            form.append('audio',       fs.createReadStream(audioFilePath));
            form.append('meeting_id', meetingId.toString());
            form.append('attendees',  JSON.stringify(
                attendees.map(a => ({ id: a._id, name: a.name }))
            ));
            
            const response = await axios.post(
                `${AI_SERVICE_URL}/ai/process-meeting`,
                form,
                { headers: form.getHeaders(), timeout: 300000 }
            );
            ({ transcript, summary, tasks } = response.data);
        }

        // 2. Save transcript + summary to MeetingLog
        const log = await MeetingLog.findOneAndUpdate(
            { meetingId },
            {
                transcript,
                summary,
                ai_status:    'completed',
                processed_at: new Date()
            },
            { new: true }
        );

        // 3. Auto-insert extracted tasks into Tasks collection
        const insertedTasks = await insertExtractedTasks(meetingId, tasks, log);

        return { transcript, summary, insertedTasks };

    } catch (err) {
        await MeetingLog.findOneAndUpdate(
            { meetingId },
            { ai_status: 'failed', ai_error: err.message }
        );
        console.error('[processAudioWithAI] Error:', err.message);
        throw err;
    }
};

// ── Insert AI-extracted tasks into the Tasks collection ────────────────────────
export const insertExtractedTasks = async (meetingId, aiTasks = [], log) => {
    if (!aiTasks.length) return [];

    const meeting = await Meeting.findById(meetingId);

    const insertedTasks    = [];
    const updatedExtracted = [];

    for (const aiTask of aiTasks) {
        try {
            const task = await Task.create({
                title:       aiTask.title,
                description: aiTask.description || `Extracted from meeting: ${meeting.title}`,
                projectId:   meeting.projectId,
                assignedTo:  aiTask.assignedTo  || null,
                priority:    aiTask.priority    || 'medium',
                deadline:    aiTask.deadline    || null,
                status:      'todo'
            });

            insertedTasks.push(task);
            updatedExtracted.push({
                title:       aiTask.title,
                description: aiTask.description,
                assignedTo:  aiTask.assignedTo,
                priority:    aiTask.priority,
                deadline:    aiTask.deadline,
                inserted:    true,
                taskId:      task._id
            });
        } catch (err) {
            console.error('[insertExtractedTasks] Failed:', aiTask.title, err.message);
            updatedExtracted.push({ ...aiTask, inserted: false });
        }
    }

    // Save extracted tasks back to MeetingLog with taskId references
    await MeetingLog.findOneAndUpdate(
        { meetingId },
        { extracted_tasks: updatedExtracted }
    );

    return insertedTasks;
};

// ── Retry — call this if AI failed and you want to reprocess ──────────────────
export const retryAIProcessing = async (meetingId, audioFilePath, attendees) => {
    await MeetingLog.findOneAndUpdate(
        { meetingId },
        { ai_status: 'pending', ai_error: null }
    );
    return await processAudioWithAI(meetingId, audioFilePath, attendees);
};