import AuditionApplication from '../models/AuditionApplication.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getRecentApplications = async (req, res) => {
  try {
    const applications = await AuditionApplication.find()
      .populate('audition', 'title auditionId')
      .sort({ createdAt: -1 })
      .limit(20);
    sendSuccess(res, { applications });
  } catch (err) { sendError(res, err.message); }
};

export const getApplication = async (req, res) => {
  try {
    const application = await AuditionApplication.findById(req.params.id).populate('audition', 'title auditionId');
    if (!application) return sendError(res, 'Application not found', 404);
    sendSuccess(res, { application });
  } catch (err) { sendError(res, err.message); }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await AuditionApplication.findByIdAndUpdate(
      req.params.id, { status }, { new: true, runValidators: true }
    );
    if (!application) return sendError(res, 'Application not found', 404);
    sendSuccess(res, { application }, 'Status updated');
  } catch (err) { sendError(res, err.message); }
};

export const deleteApplication = async (req, res) => {
  try {
    const application = await AuditionApplication.findById(req.params.id);
    if (!application) return sendError(res, 'Application not found', 404);
    await application.deleteOne();
    sendSuccess(res, {}, 'Application deleted');
  } catch (err) { sendError(res, err.message); }
};
