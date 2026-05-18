const path = require('path');
const fs = require('fs');
const fileService = require('./fileAttachment.service');
const { validateFileAttachment } = require('../../models/fileAttachment.model');
const { logActivity } = require('../activityLogs/activityLog.service');

// ── Helper ─────────────────────────────────────────────────────────────────────
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ── Upload File ────────────────────────────────────────────────────────────────
// multer middleware (upload.single('file')) runs before this in the route.
// After multer runs, req.file contains the uploaded file info.

const uploadFile = async (req, res) => {
    // Multer didn't attach a file — wrong field name or no file sent
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded. Use field name: file' });
    }

    // Validate entity_type and entity_id from body
    const { error } = validateFileAttachment(req.body);
    if (error) {
        // Clean up the uploaded file since we're rejecting the request
        fs.unlink(req.file.path, () => {});
        const messages = error.details.map(d => d.message);
        return res.status(400).json({ success: false, errors: messages });
    }

    try {
        const fileData = {
            file_path:     req.file.path,
            original_name: req.file.originalname,
            mime_type:     req.file.mimetype,
            size_bytes:    req.file.size,
            entity_type:   req.body.entity_type,
            entity_id:     req.body.entity_id,
            uploaded_by:   req.user._id // injected from auth
        };

        const file = await fileService.createFileAttachmentService(fileData);

        // Log the activity
        await logActivity(
            req.user._id,
            req.body.entity_type,
            req.body.entity_id,
            'uploaded',
            `${req.user.name || 'User'} uploaded file '${req.file.originalname}'`
        );

        return res.status(201).json({ success: true, data: file });
    } catch (err) {
        console.error('[uploadFile]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Get All Files for an Entity ────────────────────────────────────────────────

const getFilesByEntity = async (req, res) => {
    const { entity_type, entity_id } = req.params;

    if (!isValidObjectId(entity_id)) {
        return res.status(400).json({ success: false, message: 'Invalid entity_id in URL.' });
    }

    try {
        const files = await fileService.getFilesByEntityService(entity_type, entity_id);
        return res.status(200).json({ success: true, data: files });
    } catch (err) {
        console.error('[getFilesByEntity]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Delete File ────────────────────────────────────────────────────────────────

const deleteFile = async (req, res) => {
    try {
        const file = await fileService.getFileByIdService(req.params.id);
        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found.' });
        }

        // Delete the physical file from disk
        fs.unlink(file.file_path, (err) => {
            if (err) console.error('[deleteFile] Could not delete physical file:', err.message);
        });

        // Delete the DB record
        await fileService.deleteFileService(req.params.id);

        return res.status(200).json({ success: true, message: 'File deleted successfully.' });
    } catch (err) {
        console.error('[deleteFile]', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { uploadFile, getFilesByEntity, deleteFile };