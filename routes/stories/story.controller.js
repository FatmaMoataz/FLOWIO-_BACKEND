import { Story } from '../../models/story.model.js';
import { Subtask } from '../../models/subtask.model.js';
import { validateStory, validateStoryUpdate } from '../../models/story.model.js';

// ── Create Story ───────────────────────────────────────────────────────────
export const createStory = async (req, res) => {
  const { error, value } = validateStory(req.body);
  if (error) {
    const messages = error.details.map(d => d.message);
    return res.status(400).json({ success: false, errors: messages });
  }

  try {
    const story = await Story.create(value);
    return res.status(201).json({ success: true, data: story });
  } catch (err) {
    console.error('[createStory]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

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
    const story = await Story.findByIdAndUpdate(req.params.id, value, {
      new: true,
      runValidators: true
    });

    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found.' });
    }

    return res.status(200).json({ success: true, data: story });
  } catch (err) {
    console.error('[updateStory]', err);
    return res.status(400).json({ success: false, message: err.message });
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