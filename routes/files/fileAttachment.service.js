const { FileAttachment } = require('../../models/fileAttachment.model');

// ── Shared populate config ─────────────────────────────────────────────────────
const FILE_POPULATE = [
    { path: 'uploaded_by', select: 'name email' }
];

// ── Upload / Create record ─────────────────────────────────────────────────────

const createFileAttachmentService = async (data) => {
    const file = await FileAttachment.create(data);
    return await file.populate(FILE_POPULATE);
};

// ── Get all files for an entity ────────────────────────────────────────────────

const getFilesByEntityService = async (entity_type, entity_id) => {
    return await FileAttachment.find({ entity_type, entity_id })
        .populate(FILE_POPULATE)
        .sort({ createdAt: -1 });
};

// ── Get single file ────────────────────────────────────────────────────────────

const getFileByIdService = async (id) => {
    return await FileAttachment.findById(id).populate(FILE_POPULATE);
};

// ── Delete file record ─────────────────────────────────────────────────────────

const deleteFileService = async (id) => {
    return await FileAttachment.findByIdAndDelete(id);
};

module.exports = {
    createFileAttachmentService,
    getFilesByEntityService,
    getFileByIdService,
    deleteFileService
};