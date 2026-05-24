// إضافة امتداد .js للملفات المحلية والـ validations إجباري
import reportService from './report.service.js';
import {
  createReportSchema,
  updateReportSchema,
  idParamSchema,
  allowedReportTypes
} from '../../validations/reportValidation.js';

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ── CREATE REPORT ──────────────────────────────────────────────────────────────
export const createReport = async (req, res, next) => {
  const { error } = createReportSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const reportData = { ...req.body };

    if (!reportData.userId && req.user && req.user._id) {
      reportData.userId = req.user._id;
    }

    const result = await reportService.createReportService(reportData);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

// ── GET ALL REPORTS ────────────────────────────────────────────────────────────
export const getAllReports = async (req, res, next) => {
  const filters = {};

  if (req.query.projectId) {
    if (!isValidObjectId(req.query.projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid projectId format.' });
    }
    filters.projectId = req.query.projectId;
  }

  if (req.query.userId) {
    if (!isValidObjectId(req.query.userId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId format.' });
    }
    filters.userId = req.query.userId;
  }

  if (req.query.type) {
    if (!allowedReportTypes.includes(req.query.type)) {
      return res.status(400).json({ success: false, message: 'Invalid report type.' });
    }
    filters.type = req.query.type;
  }

  try {
    const result = await reportService.getAllReportsService(filters);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// ── GET REPORT BY ID ───────────────────────────────────────────────────────────
export const getReportById = async (req, res, next) => {
  const { error } = idParamSchema.validate({ id: req.params.id });
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const report = await reportService.getReportByIdService(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }
    res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

// ── UPDATE REPORT ──────────────────────────────────────────────────────────────
export const updateReport = async (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, message: 'No update data provided.' });
  }

  const { error } = updateReportSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const report = await reportService.updateReportService(req.params.id, req.body);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }
    res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

// ── DELETE REPORT ──────────────────────────────────────────────────────────────
export const deleteReport = async (req, res, next) => {
  const { error } = idParamSchema.validate({ id: req.params.id });
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const result = await reportService.deleteReportService(req.params.id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};