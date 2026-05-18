import express from 'express';
import Epic from '../models/epic.js';
import { Task } from '../models/task.model.js';
import { validateCreateEpic } from '../validations/projectValidations.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// ── POST /api/epics — Create Epic ──────────────────────────────────────────────

router.post('/', auth, async (req, res) => {
  const { error, value } = validateCreateEpic(req.body);
  if (error) {
    const errors = error.details.map(d => d.message);
    return res.status(400).json({ success: false, errors });
  }
  try {
    const epic = await Epic.create(value);
    return res.status(201).json({ success: true, data: epic });
  } catch (err) {
    console.error('[POST /epics]', err);
    return res.status(500).json({ success: false, message: 'Server error. Could not create epic.' });
  }
});

// ── GET /api/epics — Get All Epics (with optional filters) ────────────────────
// ✅ FIX 2: Now filters by companyId and/or projectId from query params
// Usage: GET /api/epics?companyId=xxx
//        GET /api/epics?projectId=xxx
//        GET /api/epics?companyId=xxx&projectId=xxx

router.get('/', auth, async (req, res) => {
  try {
    const filter = {};

    if (req.query.companyId) {
      if (!/^[0-9a-fA-F]{24}$/.test(req.query.companyId)) {
        return res.status(400).json({ success: false, message: 'Invalid companyId format.' });
      }
      filter.companyId = req.query.companyId;
    }

    if (req.query.projectId) {
      if (!/^[0-9a-fA-F]{24}$/.test(req.query.projectId)) {
        return res.status(400).json({ success: false, message: 'Invalid projectId format.' });
      }
      filter.projectId = req.query.projectId;
    }

    const epics = await Epic.find(filter).sort('name');
    return res.status(200).json({ success: true, data: epics });
  } catch (err) {
    console.error('[GET /epics]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── GET /api/epics/:id/tasks — Get all tasks under an epic ────────────────────

router.get('/:id/tasks', auth, async (req, res) => {
  const epicId = req.params.id;

  if (!/^[0-9a-fA-F]{24}$/.test(epicId)) {
    return res.status(400).json({ success: false, message: 'Invalid epicId in URL.' });
  }

  try {
    const epic = await Epic.findById(epicId);
    if (!epic) {
      return res.status(404).json({ success: false, message: 'Epic not found.' });
    }

    const tasks = await Task.find({ epicId })
      .populate('assignedTo', 'name email specialization')
      .populate('projectId', 'name status')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      epic: { _id: epic._id, name: epic.name, status: epic.status },
      count: tasks.length,
      data: tasks,
    });
  } catch (err) {
    console.error('[GET /epics/:id/tasks]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;