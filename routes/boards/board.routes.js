const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const boardController = require('./board.controller');

// All board routes require authentication
router.use(auth);

// ── Board ──────────────────────────────────────────────────────────────────────
// POST  /api/boards                          → create board for a project
// GET   /api/boards/project/:projectId       → get board + columns + tasks

router.post('/',                          boardController.createBoard);
router.get('/project/:projectId',         boardController.getBoardByProject);

// ── Columns ────────────────────────────────────────────────────────────────────
// POST   /api/boards/:boardId/columns                    → add column
// GET    /api/boards/:boardId/columns                    → get all columns
// PATCH  /api/boards/:boardId/columns/reorder            → drag reorder
// PUT    /api/boards/:boardId/columns/:columnId          → update column
// DELETE /api/boards/:boardId/columns/:columnId          → delete column

// ⚠️ /reorder MUST be registered before /:columnId
// otherwise Express matches "reorder" as a columnId param
router.post('/:boardId/columns',                      boardController.addColumn);
router.get('/:boardId/columns',                       boardController.getColumns);
router.patch('/:boardId/columns/reorder',             boardController.reorderColumns);
router.put('/:boardId/columns/:columnId',             boardController.updateColumn);
router.delete('/:boardId/columns/:columnId',          boardController.deleteColumn);

module.exports = router;