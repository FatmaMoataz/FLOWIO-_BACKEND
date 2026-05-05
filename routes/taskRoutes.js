const express = require('express');
const router = express.Router();
const Task = require('../models/task');
const KanbanColumn = require('../models/KanbanColumn');
const auth = require('../middleware/auth');
const { validateCreateTask } = require('../validations/projectValidations');
const { validateMoveTask, validateUpdateTask } = require('../validations/taskValidations');

// ── Shared populate config ────────────────────────────────────────────────────
// Centralised so POST, PATCH /move, and PUT all return the same shape.
const TASK_POPULATE = [
  { path: 'creator',  select: 'name email' },
  { path: 'assignee', select: 'name email' },
  { path: 'epicId',   select: 'name status' },
  { path: 'columnId', select: 'name status order' },
];

// ── POST / — Create task ──────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { error, value } = validateCreateTask(req.body);
  if (error) {
    return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });
  }

  try {
    const task = await Task.create({ ...value, creator: req.user._id });
    await task.populate(TASK_POPULATE);
    return res.status(201).json({ success: true, data: task });
  } catch (err) {
    console.error('[POST /tasks]', err);
    return res.status(500).json({ success: false, message: 'Could not create task.' });
  }
});

// ── PATCH /:id/move — Drag-and-drop column move ───────────────────────────────
/**
 * Dedicated move endpoint.
 *
 * Why a separate route instead of a generic PUT?
 * - Moving a task has a strict business rule: columnId and status must ALWAYS
 *   be updated atomically. A generic PUT allows partial updates that could
 *   desync them (e.g. columnId updated but status forgotten).
 * - It makes the frontend intention explicit and the server-side logic auditable.
 *
 * Flow:
 *  1. Validate { columnId, status } — both required.
 *  2. Confirm the target KanbanColumn actually exists in the DB.
 *  3. Guard: verify the requested status matches the column's own status field
 *     so the client can't move a task to "Done" column but claim status "To Do".
 *  4. Atomically update the task and return the fully-populated document.
 */
router.patch('/:id/move', auth, async (req, res) => {
  // 1. Joi validation
  const { error, value } = validateMoveTask(req.body);
  if (error) {
    return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });
  }

  const { columnId, status } = value;

  try {
    // 2. Confirm target column exists
    const targetColumn = await KanbanColumn.findById(columnId);
    if (!targetColumn) {
      return res.status(404).json({
        success: false,
        message: `KanbanColumn '${columnId}' not found.`,
      });
    }

    // 3. Guard: client-supplied status must match column's canonical status
    if (targetColumn.status !== status) {
      return res.status(400).json({
        success: false,
        message: `Status mismatch: column '${targetColumn.name}' maps to '${targetColumn.status}', not '${status}'.`,
      });
    }

    // 4. Atomic update
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: { columnId, status } },
      { new: true, runValidators: true }
    ).populate(TASK_POPULATE);

    if (!updatedTask) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    return res.status(200).json({ success: true, data: updatedTask });
  } catch (err) {
    console.error('[PATCH /tasks/:id/move]', err);
    return res.status(500).json({ success: false, message: 'Could not move task.' });
  }
});

// ── PUT /:id — General task update ────────────────────────────────────────────
/**
 * Handles broader edits: title, description, priority, due_date, assignee, etc.
 * If columnId is included, status MUST also be provided to prevent desync.
 */
router.put('/:id', auth, async (req, res) => {
  // 1. Joi validation
  const { error, value } = validateUpdateTask(req.body);
  if (error) {
    return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });
  }

  // 2. Enforce columnId <-> status coupling when columnId is part of the update
  if (value.columnId && !value.status) {
    return res.status(400).json({
      success: false,
      message: 'When updating columnId, status must also be provided to keep them in sync.',
    });
  }

  // 3. If columnId is provided, verify column exists and status matches
  if (value.columnId) {
    try {
      const targetColumn = await KanbanColumn.findById(value.columnId);
      if (!targetColumn) {
        return res.status(404).json({
          success: false,
          message: `KanbanColumn '${value.columnId}' not found.`,
        });
      }
      if (targetColumn.status !== value.status) {
        return res.status(400).json({
          success: false,
          message: `Status mismatch: column '${targetColumn.name}' maps to '${targetColumn.status}', not '${value.status}'.`,
        });
      }
    } catch (err) {
      console.error('[PUT /tasks/:id] Column lookup error:', err);
      return res.status(500).json({ success: false, message: 'Error verifying target column.' });
    }
  }

  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    ).populate(TASK_POPULATE);

    if (!updatedTask) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    return res.status(200).json({ success: true, data: updatedTask });
  } catch (err) {
    console.error('[PUT /tasks/:id]', err);
    return res.status(500).json({ success: false, message: 'Could not update task.' });
  }
});
// ── GET / — Fetch all tasks ──────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate(TASK_POPULATE)
      .sort('-createdAt');
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetching tasks failed.' });
  }
});

// ── DELETE /:id — Remove task ────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed.' });
  }
});

module.exports = router;