import Member from '../models/Member.js';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../services/cloudinaryService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

// "Ponsekar Gnanadurai" → "ponsekar-gnanadurai"
function toSlug(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function uniqueSlug(base, excludeId = null) {
  let slug = toSlug(base);
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await Member.findOne(query);
    if (!exists) return candidate;
    suffix++;
  }
}

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
    if (typeof data.seo === 'string') data.seo = JSON.parse(data.seo);

    // Auto-generate slug from name if not provided
    data.slug = await uniqueSlug(data.slug?.trim() || data.name);

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
    if (typeof data.seo === 'string') data.seo = JSON.parse(data.seo);

    // Re-slug only if slug field was explicitly changed
    if (data.slug !== undefined) {
      const base = data.slug?.trim() || member.slug || data.name;
      data.slug = await uniqueSlug(base, member._id);
    }

    const updated = await Member.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    sendSuccess(res, { member: updated }, 'Member updated successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const reorderMembers = async (req, res) => {
  try {
    const { order } = req.body;
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
