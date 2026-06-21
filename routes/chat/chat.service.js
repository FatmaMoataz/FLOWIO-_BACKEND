import axios from 'axios';
import { ChatSession } from '../../models/chatSession.model.js';
import { ChatMessage, chatRoleEnum } from '../../models/chatMessage.model.js';
import { buildProjectContext } from './chatContext.service.js';

// JAIS — persistent endpoint, safe to hardcode per teammate's note, but env var is cleaner
const CHAT_AI_SERVICE_URL = process.env.CHAT_AI_SERVICE_URL || 'https://repave-caddy-padlock.ngrok-free.dev';
// x-api-key no longer required for /api/chat — kept here in case she re-adds it later
const CHAT_AI_API_KEY = process.env.CHAT_AI_API_KEY || null;

const JAIS_HEADERS = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(CHAT_AI_API_KEY ? { 'x-api-key': CHAT_AI_API_KEY } : {})
};

// ─────────────────────────────────────────────────────────────────────────────
// 🧪 MOCK MODE — flip to false once /api/chat is confirmed working
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_MODE = true;

// ── DEPRECATED — only needed if JAIS ever reverts to flat-prompt /generate ────
// /api/chat accepts structured context directly, so this is no longer called.

const buildPromptFromContext = (userMessage, context) => {
    const { project, tasks, team, stats } = context;

    const taskSummary = tasks.length
        ? tasks.slice(0, 15).map(t =>
            `- "${t.title}" [${t.status}, ${t.priority} priority]${t.deadline ? `, due ${new Date(t.deadline).toLocaleDateString()}` : ''}${t.assignedTo ? `, assigned to ${t.assignedTo.name}` : ''}`
          ).join('\n')
        : 'No tasks yet.';

    const teamSummary = team.length
        ? team.map(m => `${m.name} (${m.roleInProject})`).join(', ')
        : 'No team members yet.';

    return `You are Flowio's AI project assistant. Answer the user's question using ONLY the context below. Be concise and helpful.

Project: ${project.name}
Description: ${project.description || 'N/A'}
Status: ${project.status}
Stats: ${stats.totalTasks} total tasks, ${stats.doneTasks} done, ${stats.overdueTasks} overdue

Team: ${teamSummary}

Tasks:
${taskSummary}

User question: ${userMessage}`;
};

const getMockAIReply = (message, context) => {
    const projectName = context.project.name;

    // Simple contextual mock — feels alive without calling the real service
    if (/task|todo|status/i.test(message)) {
        return `Hello! I'm here to assist you with the ${projectName} project. ` +
               `You currently have ${context.stats.totalTasks} tasks, ${context.stats.doneTasks} completed` +
               (context.stats.overdueTasks > 0 ? `, and ${context.stats.overdueTasks} overdue. Want me to list them?` : '. You\'re on track!');
    }

    if (/team|who|member/i.test(message)) {
        const names = context.team.map(t => t.name).join(', ') || 'no members yet';
        return `The ${projectName} team currently includes: ${names}.`;
    }

    return `Hello! I'm here to assist you with the ${projectName} project. Need help with your tasks?`;
};

// ── Simulates network + inference delay so frontend loading states can be tested ──
const mockDelay = (ms = 1200) => new Promise(resolve => setTimeout(resolve, ms));

// ── Get or create the session for this (user, project) pair ───────────────────

const getOrCreateSession = async (projectId, userId) => {
    let session = await ChatSession.findOne({ projectId, userId });
    if (!session) {
        session = await ChatSession.create({ projectId, userId });
    }
    return session;
};

// ── POST /api/chat/message — main orchestration ────────────────────────────────

const sendMessageService = async (projectId, userId, messageText) => {
    // 1. Build the project context — always fresh, never cached
    const context = await buildProjectContext(projectId);

    // 2. Get or create the chat session
    const session = await getOrCreateSession(projectId, userId);

    // 3. Persist the user's message immediately
    const userMessage = await ChatMessage.create({
        sessionId: session._id,
        projectId,
        userId,
        role:      chatRoleEnum.user,
        text:      messageText
    });

    let aiReplyText;
    let isError = false;

    try {
        if (MOCK_MODE) {
            console.log(`[Chat] 🧪 MOCK MODE — simulating reply for project "${context.project.name}"`);
            await mockDelay();
            aiReplyText = getMockAIReply(messageText, context);
        } else {
            console.log(`[Chat] Sending message to JAIS /api/v1/chat...`);

            const response = await axios.post(
                `${CHAT_AI_SERVICE_URL}/api/v1/chat`,
                {
                    message: messageText,
                    context: context // structured project context — JAIS accepts this directly now
                },
                {
                    headers: JAIS_HEADERS,
                    timeout: 60000
                }
            );

            // Guard: ngrok offline / missing skip-warning header returns HTML, not JSON
            if (typeof response.data !== 'object' || response.data === null) {
                throw new Error('JAIS returned non-JSON. Is the ngrok tunnel running?');
            }

            aiReplyText = response.data.response;
            if (!aiReplyText) {
                throw new Error('JAIS response missing "response" field: ' + JSON.stringify(response.data));
            }
        }
    } catch (err) {
        console.error('[Chat] AI call failed:', err.message);
        isError = true;
        aiReplyText = "Sorry, I'm having trouble connecting right now. Please try again in a moment.";
    }

    // 4. Persist the AI's response (even on failure, so the UI shows it)
    const assistantMessage = await ChatMessage.create({
        sessionId: session._id,
        projectId,
        userId,
        role:      chatRoleEnum.assistant,
        text:      aiReplyText,
        isError
    });

    // 5. Update session metadata
    await ChatSession.findByIdAndUpdate(session._id, {
        lastMessageAt: new Date(),
        $inc: { messageCount: 2 } // user message + assistant reply
    });

    return {
        sessionId: session._id,
        userMessage,
        assistantMessage
    };
};

// ── GET /api/chat/history/:projectId ───────────────────────────────────────────

const getHistoryService = async (projectId, userId) => {
    const session = await ChatSession.findOne({ projectId, userId });

    // No session yet = no history, not an error
    if (!session) {
        return { sessionId: null, messages: [] };
    }

    const messages = await ChatMessage.find({ sessionId: session._id })
        .sort({ createdAt: 1 })
        .select('role text createdAt isError');

    return { sessionId: session._id, messages };
};

// ── Health check — call this before relying on JAIS, or on server startup ─────

const checkJAISHealth = async () => {
    try {
        const response = await axios.get(`${CHAT_AI_SERVICE_URL}/health`, {
            headers: { 'ngrok-skip-browser-warning': 'true' },
            timeout: 5000
        });
        console.log(`[Chat] JAIS health check:`, response.data);
        return response.data;
    } catch (err) {
        console.warn(`[Chat] JAIS health check failed:`, err.message);
        return null;
    }
};

export { sendMessageService, getHistoryService, checkJAISHealth };