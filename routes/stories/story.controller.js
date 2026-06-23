import { Story } from '../../models/story.model.js';
import { Subtask } from '../../models/subtask.model.js';
import { validateStory, validateStoryUpdate } from '../../models/story.model.js';
import { logActivity } from '../activityLogs/activityLog.service.js';

// ── Get Stories by Project ─────────────────────────────────────────────────
export const getStoriesByProject = async (req, res) => {
  const { projectId } = req.params;

  if (!projectId || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
    return res.status(400).json({ success: false, message: 'Invalid projectId format.' });
  }

  try {
    const stories = await Story.find({ projectId })
      .populate('epicId', 'name status')
      .populate('assignee', 'name email')
      .sort({ order: 1, createdAt: -1 });

    return res.status(200).json({ success: true, data: stories });
  } catch (err) {
    console.error('[getStoriesByProject]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get Stories by Epic ────────────────────────────────────────────────────
export const getStoriesByEpic = async (req, res) => {
  const { epicId } = req.params;

  if (!epicId || !/^[0-9a-fA-F]{24}$/.test(epicId)) {
    return res.status(400).json({ success: false, message: 'Invalid epicId format.' });
  }

  try {
    const stories = await Story.find({ epicId })
      .populate('assignee', 'name email')
      .sort({ order: 1, createdAt: -1 });

    return res.status(200).json({ success: true, data: stories });
  } catch (err) {
    console.error('[getStoriesByEpic]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get Story by ID (with subtasks populated) ──────────────────────────────
export const getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('epicId', 'name status')
      .populate('assignee', 'name email')
      .populate({
        path: 'subtasks',
        options: { sort: { createdAt: 1 } }
      });

    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found.' });
    }

    return res.status(200).json({ success: true, data: story });
  } catch (err) {
    console.error('[getStoryById]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── Delete Story (and its subtasks) ────────────────────────────────────────
export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findByIdAndDelete(req.params.id);
    
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found.' });
    }

    // Delete all subtasks associated with this story
    await Subtask.deleteMany({ storyId: req.params.id });

    return res.status(200).json({ 
      success: true, 
      message: 'Story and its subtasks deleted successfully.' 
    });
  } catch (err) {
    console.error('[deleteStory]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
// ── Create Story ───────────────────────────────────────────────────────────
export const createStory = async (req, res) => {
  const { error, value } = validateStory(req.body);
  if (error) {
    const messages = error.details.map(d => d.message);
    return res.status(400).json({ success: false, errors: messages });
  }

  try {
    const story = await Story.create(value);
    
    // ✅ Log activity if story is assigned to someone
    if (story.assignee && story.assignee.toString() !== req.user._id.toString()) {
      await logActivity({
        userId: story.assignee,
        performedBy: req.user._id,
        type: 'task',
        title: 'New Story Assigned',
        description: `${req.user.name} assigned you to "${story.title}".`,
        targetId: story._id,
        targetType: 'Task',
        actionType: 'view_details'
      });
    }
    
    return res.status(201).json({ success: true, data: story });
  } catch (err) {
    console.error('[createStory]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── Update Story ───────────────────────────────────────────────────────────
export const updateStory = async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, message: 'No data provided for update.' });
  }

  const { error, value } = validateStoryUpdate(req.body);
  if (error) {
    const messages = error.details.map(d => d.message);
    return res.status(400).json({ success: false, errors: messages });
  }

  try {
    const oldStory = await Story.findById(req.params.id);
    const story = await Story.findByIdAndUpdate(req.params.id, value, {
      new: true,
      runValidators: true
    });

    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found.' });
    }

    // ✅ Log activity when story status changes to "Done"
    if (value.status === 'Done' && oldStory.status !== 'Done') {
      await logActivity({
        userId: story.createdBy || req.user._id,
        performedBy: req.user._id,
        type: 'task',
        title: 'Task Completed',
        description: `${req.user.name} completed "${story.title}".`,
        targetId: story._id,
        targetType: 'Task',
        actionType: 'view_details'
      });
      
      // Also notify assignee if different
      if (story.assignee && story.assignee.toString() !== req.user._id.toString()) {
        await logActivity({
          userId: story.assignee,
          performedBy: req.user._id,
          type: 'task',
          title: 'Task Completed',
          description: `${req.user.name} completed "${story.title}".`,
          targetId: story._id,
          targetType: 'Task',
          actionType: 'view_details'
        });
      }
    }
    
    // ✅ Log activity when assignee changes
    if (value.assignee && value.assignee !== oldStory?.assignee?.toString()) {
      await logActivity({
        userId: value.assignee,
        performedBy: req.user._id,
        type: 'task',
        title: 'Story Assigned to You',
        description: `${req.user.name} assigned you to "${story.title}".`,
        targetId: story._id,
        targetType: 'Task',
        actionType: 'view_details'
      });
    }

    return res.status(200).json({ success: true, data: story });
  } catch (err) {
    console.error('[updateStory]', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};