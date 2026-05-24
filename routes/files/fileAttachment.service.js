// إضافة امتداد .js للموديل المحلي إجباري
import { FileAttachment } from '../../models/fileAttachment.model.js';

// ── Shared populate config ─────────────────────────────────────────────────────
const FILE_POPULATE = [
    { path: 'uploaded_by', select: 'name email' }
];

// ── Upload / Create record ─────────────────────────────────────────────────────
export const createFileAttachmentService = async (data) => {
    const file = await FileAttachment.create(data);
    return await file.populate(FILE_POPULATE);
};

// ── Get all files for an entity ────────────────────────────────────────────────
export const getFilesByEntityService = async (entity_type, entity_id) => {
    return await FileAttachment.find({ entity_type, entity_id })
        .populate(FILE_POPULATE)
        .sort({ createdAt: -1 });
};

// ── Get single file ────────────────────────────────────────────────────────────
export const getFileByIdService = async (id) => {
    return await FileAttachment.findById(id).populate(FILE_POPULATE);
};

// ── Delete file record ─────────────────────────────────────────────────────────
export const deleteFileService = async (id) => {
    return await FileAttachment.findByIdAndDelete(id);
};