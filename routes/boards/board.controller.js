const { Board, validateBoard, validateBoardUpdate } = require('../../models/board.model');
const { KanbanColumn, validateColumn, validateColumnUpdate, validateReorder } = require('../../models/kanbanColumn.model');

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ── POST /api/boards ───────────────────────────────────────────────────────────
// Create a board for a project (one per project enforced by unique index)

const createBoard = async (req, res) => {
  const { error } = validateBoard(req.body);
  if (error) return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });

  try {
    // Prevent duplicate board for same project
    const existing = await Board.findOne({ projectId: req.body.projectId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A board already exists for this project.' });
    }

    const board = await Board.create({
      name:      req.body.name,
      projectId: req.body.projectId,
      createdBy: req.user._id
    });

    return res.status(201).json({ success: true, data: board });
  } catch (err) {
    console.error('[createBoard]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/boards/project/:projectId ────────────────────────────────────────
// Get the board for a project with all columns and their tasks populated

const getBoardByProject = async (req, res) => {
  const { projectId } = req.params;

  if (!isValidObjectId(projectId)) {
    return res.status(400).json({ success: false, message: 'Invalid projectId.' });
  }

  try {
    const board = await Board.findOne({ projectId }).populate({
      path: 'columns',
      options: { sort: { order: 1 } },
      populate: {
        path: 'tasks',
        select: 'title status priority deadline assignedTo'
      }
    });

    if (!board) {
      return res.status(404).json({ success: false, message: 'No board found for this project.' });
    }

    return res.status(200).json({ success: true, data: board });
  } catch (err) {
    console.error('[getBoardByProject]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/boards/:boardId/columns ─────────────────────────────────────────
// Add a new column to a board

const addColumn = async (req, res) => {
  const { boardId } = req.params;

  if (!isValidObjectId(boardId)) {
    return res.status(400).json({ success: false, message: 'Invalid boardId.' });
  }

  const { error } = validateColumn(req.body);
  if (error) return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });

  try {
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ success: false, message: 'Board not found.' });

    const column = await KanbanColumn.create({
      name:    req.body.name,
      status:  req.body.status,
      order:   req.body.order,
      boardId: boardId
    });

    return res.status(201).json({ success: true, data: column });
  } catch (err) {
    console.error('[addColumn]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/boards/:boardId/columns ──────────────────────────────────────────
// Get all columns for a board sorted by order

const getColumns = async (req, res) => {
  const { boardId } = req.params;

  if (!isValidObjectId(boardId)) {
    return res.status(400).json({ success: false, message: 'Invalid boardId.' });
  }

  try {
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ success: false, message: 'Board not found.' });

    const columns = await KanbanColumn.find({ boardId })
      .populate('tasks', 'title status priority deadline assignedTo')
      .sort({ order: 1 });

    return res.status(200).json({ success: true, data: columns });
  } catch (err) {
    console.error('[getColumns]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/boards/:boardId/columns/:columnId ────────────────────────────────
// Update a column (name, status, or order)

const updateColumn = async (req, res) => {
  const { boardId, columnId } = req.params;

  if (!isValidObjectId(boardId) || !isValidObjectId(columnId)) {
    return res.status(400).json({ success: false, message: 'Invalid boardId or columnId.' });
  }

  const { error } = validateColumnUpdate(req.body);
  if (error) return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });

  try {
    const column = await KanbanColumn.findOneAndUpdate(
      { _id: columnId, boardId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!column) return res.status(404).json({ success: false, message: 'Column not found.' });

    return res.status(200).json({ success: true, data: column });
  } catch (err) {
    console.error('[updateColumn]', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/boards/:boardId/columns/:columnId ─────────────────────────────
// Delete a column from a board

const deleteColumn = async (req, res) => {
  const { boardId, columnId } = req.params;

  if (!isValidObjectId(boardId) || !isValidObjectId(columnId)) {
    return res.status(400).json({ success: false, message: 'Invalid boardId or columnId.' });
  }

  try {
    const column = await KanbanColumn.findOneAndDelete({ _id: columnId, boardId });
    if (!column) return res.status(404).json({ success: false, message: 'Column not found.' });

    return res.status(200).json({ success: true, message: 'Column deleted successfully.' });
  } catch (err) {
    console.error('[deleteColumn]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/boards/:boardId/columns/reorder ────────────────────────────────
// Drag-and-drop reorder — accepts array of { columnId, order }

const reorderColumns = async (req, res) => {
  const { boardId } = req.params;

  if (!isValidObjectId(boardId)) {
    return res.status(400).json({ success: false, message: 'Invalid boardId.' });
  }

  const { error } = validateReorder(req.body);
  if (error) return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });

  try {
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ success: false, message: 'Board not found.' });

    // Update each column's order in parallel
    const updates = req.body.columns.map(({ columnId, order }) =>
      KanbanColumn.findOneAndUpdate(
        { _id: columnId, boardId },
        { order },
        { new: true }
      )
    );

    const updated = await Promise.all(updates);

    return res.status(200).json({
      success: true,
      message: 'Columns reordered successfully.',
      data: updated.filter(Boolean).sort((a, b) => a.order - b.order)
    });
  } catch (err) {
    console.error('[reorderColumns]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createBoard,
  getBoardByProject,
  addColumn,
  getColumns,
  updateColumn,
  deleteColumn,
  reorderColumns
};