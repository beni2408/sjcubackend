import Audition from '../models/Audition.js';
import AuditionApplication from '../models/AuditionApplication.js';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../services/cloudinaryService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

// Adds a computed `isOpen` flag so the frontend doesn't need to duplicate date-window logic.
const toClientAudition = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const now = new Date();
  obj.isOpen = obj.status === 'active'
    && now >= new Date(obj.applicationStart)
    && now <= new Date(obj.applicationEnd);
  return obj;
};

export const getAuditions = async (req, res) => {
  try {
    const auditions = await Audition.find().sort({ order: 1, createdAt: -1 });
    sendSuccess(res, { auditions: auditions.map(toClientAudition) });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const getAudition = async (req, res) => {
  try {
    const audition = await Audition.findById(req.params.id);
    if (!audition) return sendError(res, 'Audition not found', 404);
    sendSuccess(res, { audition: toClientAudition(audition) });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const createAudition = async (req, res) => {
  try {
    const data = { ...req.body };

    if (data.minAge !== undefined) data.minAge = Number(data.minAge);
    if (data.maxAge !== undefined) data.maxAge = Number(data.maxAge);

    if (data.minAge !== undefined && data.maxAge !== undefined && data.minAge > data.maxAge) {
      return sendError(res, 'Minimum age cannot be greater than maximum age', 400);
    }
    if (data.applicationStart && data.applicationEnd && new Date(data.applicationStart) > new Date(data.applicationEnd)) {
      return sendError(res, 'Application start date must be before the end date', 400);
    }

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/auditions');
      data.featureImage = result.secure_url;
    }

    const audition = await Audition.create(data);
    sendSuccess(res, { audition: toClientAudition(audition) }, 'Audition created successfully', 201);
  } catch (err) {
    sendError(res, err.message);
  }
};

export const updateAudition = async (req, res) => {
  try {
    const audition = await Audition.findById(req.params.id);
    if (!audition) return sendError(res, 'Audition not found', 404);

    const data = { ...req.body };
    if (data.minAge !== undefined) data.minAge = Number(data.minAge);
    if (data.maxAge !== undefined) data.maxAge = Number(data.maxAge);

    if (data.minAge !== undefined && data.maxAge !== undefined && data.minAge > data.maxAge) {
      return sendError(res, 'Minimum age cannot be greater than maximum age', 400);
    }
    if (data.applicationStart && data.applicationEnd && new Date(data.applicationStart) > new Date(data.applicationEnd)) {
      return sendError(res, 'Application start date must be before the end date', 400);
    }

    if (req.file) {
      if (audition.featureImage) {
        const publicId = getPublicIdFromUrl(audition.featureImage);
        if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
      }
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/auditions');
      data.featureImage = result.secure_url;
    }

    const updated = await Audition.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    sendSuccess(res, { audition: toClientAudition(updated) }, 'Audition updated successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};

// Dedicated endpoint for the common "extend the deadline" admin action.
export const extendDeadline = async (req, res) => {
  try {
    const { applicationEnd } = req.body;
    if (!applicationEnd) return sendError(res, 'A new application end date is required', 400);

    const audition = await Audition.findById(req.params.id);
    if (!audition) return sendError(res, 'Audition not found', 404);

    if (new Date(applicationEnd) < audition.applicationStart) {
      return sendError(res, 'Application end date must be after the start date', 400);
    }

    audition.applicationEnd = applicationEnd;
    await audition.save();
    sendSuccess(res, { audition: toClientAudition(audition) }, 'Deadline extended successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const reorderAuditions = async (req, res) => {
  try {
    const { order } = req.body; // [{ id, order }]
    if (!Array.isArray(order)) return sendError(res, 'order must be an array', 400);
    await Promise.all(order.map(({ id, order: o }) => Audition.findByIdAndUpdate(id, { order: o })));
    sendSuccess(res, {}, 'Order updated');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const deleteAudition = async (req, res) => {
  try {
    const audition = await Audition.findById(req.params.id);
    if (!audition) return sendError(res, 'Audition not found', 404);

    if (audition.featureImage) {
      const publicId = getPublicIdFromUrl(audition.featureImage);
      if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
    }

    await AuditionApplication.deleteMany({ audition: audition._id });
    await audition.deleteOne();
    sendSuccess(res, {}, 'Audition deleted successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};
