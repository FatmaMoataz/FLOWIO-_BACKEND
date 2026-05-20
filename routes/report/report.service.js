const { Report } = require('../../models/report.model');

const createReportService = async (data) => {
  const report = await Report.create(data);
  return {
    success: true,
    message: 'Report created successfully',
    data: report
  };
};

const getAllReportsService = async (filters = {}) => {
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

const getReportByIdService = async (id) => {
  return await Report.findById(id)
    .populate('userId', 'username email')
    .populate('projectId', 'name status');
};

const updateReportService = async (id, data) => {
  return await Report.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });
};

const deleteReportService = async (id) => {
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

module.exports = {
  createReportService,
  getAllReportsService,
  getReportByIdService,
  updateReportService,
  deleteReportService
};
