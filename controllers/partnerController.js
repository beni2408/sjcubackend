import Partner from '../models/Partner.js';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../services/cloudinaryService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getPartners = async (req, res) => {
  try {
    const partners = await Partner.find().sort({ order: 1, createdAt: -1 });
    sendSuccess(res, { partners });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const getPartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return sendError(res, 'Partner not found', 404);
    sendSuccess(res, { partner });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const createPartner = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/partners');
      data.logo = result.secure_url;
    }
    const partner = await Partner.create(data);
    sendSuccess(res, { partner }, 'Partner created successfully', 201);
  } catch (err) {
    sendError(res, err.message);
  }
};

export const updatePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return sendError(res, 'Partner not found', 404);

    const data = { ...req.body };
    if (req.file) {
      if (partner.logo) {
        const publicId = getPublicIdFromUrl(partner.logo);
        if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
      }
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/partners');
      data.logo = result.secure_url;
    }

    const updated = await Partner.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    sendSuccess(res, { partner: updated }, 'Partner updated successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const reorderPartners = async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return sendError(res, 'order must be an array', 400);
    await Promise.all(order.map(({ id, order: o }) => Partner.findByIdAndUpdate(id, { order: o })));
    sendSuccess(res, {}, 'Order updated');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const deletePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return sendError(res, 'Partner not found', 404);

    if (partner.logo) {
      const publicId = getPublicIdFromUrl(partner.logo);
      if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
    }

    await partner.deleteOne();
    sendSuccess(res, {}, 'Partner deleted successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};
