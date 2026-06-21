import { Project } from '../../models/project.model.js';
import { Task } from '../../models/task.model.js';
import { ProjectMember } from '../../models/projectMember.model.js';

// ── Build structured context object for the Flask AI service ──────────────────
// This is the "memory" the chatbot needs to answer intelligently about
// a specific project — its details, current tasks, and team members.

const buildProjectContext = async (projectId) => {
    const project = await Project.findById(projectId).select(
        'name description status startDate endDate companyId'
    );

    if (!project) {
        throw new Error('Project not found — cannot build chat context.');
    }

    // Pull tasks + members in parallel — independent queries
    const [tasks, members] = await Promise.all([
        Task.find({ projectId, isArchived: { $ne: true } })
            .select('title status priority deadline assignedTo')
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 })
            .limit(50), // cap payload size sent to the AI

        ProjectMember.find({ projectId })
            .populate('userId', 'name email role specialization')
            .select('role_in_project userId')
    ]);

    // Shape the data into a clean, AI-friendly structure
    const context = {
        project: {
            id:          project._id,
            name:        project.name,
            description: project.description || '',
            status:      project.status,
            startDate:   project.startDate,
            endDate:     project.endDate
        },
        tasks: tasks.map(t => ({
            id:         t._id,
            title:      t.title,
            status:     t.status,
            priority:   t.priority,
            deadline:   t.deadline,
            assignedTo: t.assignedTo ? { name: t.assignedTo.name, email: t.assignedTo.email } : null
        })),
        team: members
            .filter(m => m.userId) // guard against orphaned refs
            .map(m => ({
                name:           m.userId.name,
                email:          m.userId.email,
                roleInProject:  m.role_in_project,
                specialization: m.userId.specialization
            })),
        stats: {
            totalTasks:     tasks.length,
            doneTasks:      tasks.filter(t => t.status === 'done').length,
            overdueTasks:   tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done').length
        }
    };

    return context;
};

export { buildProjectContext };