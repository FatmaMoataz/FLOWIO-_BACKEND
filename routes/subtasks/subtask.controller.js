import { Subtask } from '../../models/subtask.model.js';
import { validateSubtask, validateSubtaskUpdate } from '../../models/subtask.model.js';

// ── Create Subtask ──────────────────────────────────────────────────────────────
export const createSubtask = async (req, res) => {
    const { error } = validateSubtask(req.body);
    if (error) {
        const messages = error.details.map(d => d.message);
        return res.status(400).json({ success: false, errors: messages });
    }

    try {
        const subtask = await Subtask.create(req.body);
        return res.status(201).json({ success: true, data: subtask });
    } catch (err) {
        console.error('[createSubtask]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get All Subtasks by Story ───────────────────────────────────────────────────
export const getAllSubtasksByStory = async (req, res) => {
    const { storyId } = req.params;

    if (!storyId || !/^[0-9a-fA-F]{24}$/.test(storyId)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid storyId format.' 
        });
    }

    try {
        const subtasks = await Subtask.find({ storyId })
            .populate('assignee', 'name email')
            .sort({ createdAt: 1 });
        
        return res.status(200).json({ 
            success: true, 
            data: subtasks,
            count: subtasks.length
        });
    } catch (err) {
        console.error('[getAllSubtasksByStory]', err);
        return res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
};

// ── Get All Subtasks by Task ────────────────────────────────────────────────────
export const getAllSubtasksByTask = async (req, res) => {
    const { taskId } = req.params;

    if (!taskId || !/^[0-9a-fA-F]{24}$/.test(taskId)) {
        return res.status(400).json({ success: false, message: 'Invalid taskId format.' });
    }

    try {
        const subtasks = await Subtask.find({ taskId })
            .populate('assignee', 'name email')
            .sort({ createdAt: 1 });
        
        return res.status(200).json({ 
            success: true, 
            data: subtasks 
        });
    } catch (err) {
        console.error('[getAllSubtasksByTask]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get Subtask by ID ───────────────────────────────────────────────────────────
export const getSubtaskById = async (req, res) => {
    try {
        const subtask = await Subtask.findById(req.params.id)
            .populate('assignee', 'name email');
        
        if (!subtask) {
            return res.status(404).json({ success: false, message: 'Subtask not found.' });
        }
        return res.status(200).json({ success: true, data: subtask });
    } catch (err) {
        console.error('[getSubtaskById]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Update Subtask ──────────────────────────────────────────────────────────────
export const updateSubtask = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, message: 'No data provided for update.' });
    }

    const { error } = validateSubtaskUpdate(req.body);
    if (error) {
        const messages = error.details.map(d => d.message);
        return res.status(400).json({ success: false, errors: messages });
    }

    try {
        const subtask = await Subtask.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        
        if (!subtask) {
            return res.status(404).json({ success: false, message: 'Subtask not found.' });
        }
        return res.status(200).json({ success: true, data: subtask });
    } catch (err) {
        console.error('[updateSubtask]', err);
        return res.status(400).json({ success: false, message: err.message });
    }
};

// ── Delete Subtask ──────────────────────────────────────────────────────────────
export const deleteSubtask = async (req, res) => {
    try {
        const subtask = await Subtask.findByIdAndDelete(req.params.id);
        
        if (!subtask) {
            return res.status(404).json({ success: false, message: 'Subtask not found.' });
        }
        return res.status(200).json({ 
            success: true, 
            message: 'Subtask deleted successfully.' 
        });
    } catch (err) {
        console.error('[deleteSubtask]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};