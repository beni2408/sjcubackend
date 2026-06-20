import Audition from '../models/Audition.js';
import AuditionApplication from '../models/AuditionApplication.js';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../services/cloudinaryService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getAuditions = async (req, res) => {
  try {
    const auditions = await Audition.find().sort({ order: 1, createdAt: -1 });
    sendSuccess(res, { auditions });
  } catch (err) { sendError(res, err.message); }
};

export const getAudition = async (req, res) => {
  try {
    const audition = await Audition.findById(req.params.id);
    if (!audition) return sendError(res, 'Audition not found', 404);
    sendSuccess(res, { audition });
  } catch (err) { sendError(res, err.message); }
};

export const createAudition = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/auditions');
      data.featureImage = result.secure_url;
    }
    const audition = await Audition.create(data);
    sendSuccess(res, { audition }, 'Audition created', 201);
  } catch (err) { sendError(res, err.message); }
};

export const updateAudition = async (req, res) => {
  try {
    const audition = await Audition.findById(req.params.id);
    if (!audition) return sendError(res, 'Audition not found', 404);
    const data = { ...req.body };
    if (req.file) {
      if (audition.featureImage) {
        const pid = getPublicIdFromUrl(audition.featureImage);
        if (pid) await deleteFromCloudinary(pid).catch(() => {});
      }
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/auditions');
      data.featureImage = result.secure_url;
    }
    const updated = await Audition.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    sendSuccess(res, { audition: updated }, 'Audition updated');
  } catch (err) { sendError(res, err.message); }
};

export const extendDeadline = async (req, res) => {
  try {
    const { applicationEnd } = req.body;
    const audition = await Audition.findByIdAndUpdate(
      req.params.id,
      { applicationEnd, status: 'Open' },
      { new: true }
    );
    if (!audition) return sendError(res, 'Audition not found', 404);
    sendSuccess(res, { audition }, 'Deadline extended');
  } catch (err) { sendError(res, err.message); }
};

export const reorderAuditions = async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return sendError(res, 'order must be an array', 400);
    await Promise.all(order.map(({ id, order: o }) => Audition.findByIdAndUpdate(id, { order: o })));
    sendSuccess(res, {}, 'Order updated');
  } catch (err) { sendError(res, err.message); }
};

export const deleteAudition = async (req, res) => {
  try {
    const audition = await Audition.findById(req.params.id);
    if (!audition) return sendError(res, 'Audition not found', 404);
    if (audition.featureImage) {
      const pid = getPublicIdFromUrl(audition.featureImage);
      if (pid) await deleteFromCloudinary(pid).catch(() => {});
    }
    await AuditionApplication.deleteMany({ audition: audition._id });
    await audition.deleteOne();
    sendSuccess(res, {}, 'Audition and all applications deleted');
  } catch (err) { sendError(res, err.message); }
};

export const getAuditionApplications = async (req, res) => {
  try {
    const applications = await AuditionApplication.find({ audition: req.params.id })
      .populate('audition', 'title auditionId')
      .sort({ createdAt: -1 });
    sendSuccess(res, { applications });
  } catch (err) { sendError(res, err.message); }
};

export const applyToAudition = async (req, res) => {
  try {
    const audition = await Audition.findById(req.params.id);
    if (!audition) return sendError(res, 'Audition not found', 404);
    if (audition.status === 'Closed') return sendError(res, 'Applications are closed for this audition', 400);

    const data = { ...req.body, audition: audition._id };
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/audition-applications');
      data.photo = result.secure_url;
    }
    const application = await AuditionApplication.create(data);
    sendSuccess(res, { application }, 'Application submitted successfully', 201);
  } catch (err) { sendError(res, err.message); }
};
