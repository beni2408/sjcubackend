import Member from '../models/Member.js';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../services/cloudinaryService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getMembers = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category) filter.teamCategory = category;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { position: { $regex: search, $options: 'i' } },
    ];

    const members = await Member.find(filter).sort({ order: 1, createdAt: -1 });
    sendSuccess(res, { members });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const getMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return sendError(res, 'Member not found', 404);
    sendSuccess(res, { member });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const getMemberBySlug = async (req, res) => {
  try {
    const member = await Member.findOne({ slug: req.params.slug });
    if (!member) return sendError(res, 'Member not found', 404);
    sendSuccess(res, { member });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const createMember = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/members');
      data.photo = result.secure_url;
    }

    if (typeof data.socialLinks === 'string') data.socialLinks = JSON.parse(data.socialLinks);
    if (typeof data.teamCategory === 'string') data.teamCategory = JSON.parse(data.teamCategory);

    const member = await Member.create(data);
    sendSuccess(res, { member }, 'Member created successfully', 201);
  } catch (err) {
    sendError(res, err.message);
  }
};

export const updateMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return sendError(res, 'Member not found', 404);

    const data = { ...req.body };

    if (req.file) {
      if (member.photo) {
        const publicId = getPublicIdFromUrl(member.photo);
        if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
      }
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/members');
      data.photo = result.secure_url;
    }

    if (typeof data.socialLinks === 'string') data.socialLinks = JSON.parse(data.socialLinks);
    if (typeof data.teamCategory === 'string') data.teamCategory = JSON.parse(data.teamCategory);

    const updated = await Member.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    sendSuccess(res, { member: updated }, 'Member updated successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const reorderMembers = async (req, res) => {
  try {
    const { order } = req.body; // [{ id, order }]
    if (!Array.isArray(order)) return sendError(res, 'order must be an array', 400);
    await Promise.all(order.map(({ id, order: o }) => Member.findByIdAndUpdate(id, { order: o })));
    sendSuccess(res, {}, 'Order updated');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const deleteMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return sendError(res, 'Member not found', 404);

    if (member.photo) {
      const publicId = getPublicIdFromUrl(member.photo);
      if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
    }

    await member.deleteOne();
    sendSuccess(res, {}, 'Member deleted successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};
