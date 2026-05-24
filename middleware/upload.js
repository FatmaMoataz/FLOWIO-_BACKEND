import multer from 'multer';
import path from 'path';
import { allowedMimeTypes } from '../models/fileAttachment.model.js';

// ── Storage config ─────────────────────────────────────────────────────────────
// Files saved to /uploads folder in project root.
// Filename: timestamp + original name to avoid collisions.

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // make sure this folder exists in your project root
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        cb(null, uniqueName);
    }
});

// ── File filter ────────────────────────────────────────────────────────────────

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true); // accept
    } else {
        cb(new Error(`File type '${file.mimetype}' is not allowed.`), false); // reject
    }
};

// ── Multer instance ────────────────────────────────────────────────────────────

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max per file
    }
});

export default upload;