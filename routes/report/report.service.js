// إضافة امتداد .js للموديل المحلي إجباري
import { Report } from '../../models/report.model.js';

export const createReportService = async (data) => {
  const report = await Report.create(data);
  return {
    success: true,
    message: 'Report created successfully',
    data: report
  };
};

export const getAllReportsService = async (filters = {}) => {
  const reports = await Report.find(filters)
    .sort({ createdAt: -1 })
    .populate('userId', 'username email')
    .populate('projectId', 'name status');

  return {
    success: true,
    results: reports.length,
    data: reports
  };
};

export const getReportByIdService = async (id) => {
  return await Report.findById(id)
    .populate('userId', 'username email')
    .populate('projectId', 'name status');
};

export const updateReportService = async (id, data) => {
  return await Report.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });
};

export const deleteReportService = async (id) => {
  const report = await Report.findByIdAndDelete(id);
  if (!report) {
    return {
      success: false,
      message: 'Report not found.'
    };
  }
  return {
    success: true,
    message: 'Report deleted successfully.'
  };
};

export default {
  createReportService,
  getAllReportsService,
  getReportByIdService,
  updateReportService,
  deleteReportService
};