import Testimonial from '../models/Testimonial.js';
import User from '../models/User.js';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../services/cloudinaryService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { sendTestimonialAdminNotification, sendTestimonialReviewerConfirmation } from '../services/emailService.js';

// Public — only approved testimonials
export const getTestimonials = async (req, res) => {
  try {
    const { featured } = req.query;
    const filter = { status: 'approved' };
    if (featured === 'true') filter.featured = true;
    const testimonials = await Testimonial.find(filter).sort({ createdAt: -1 });
    sendSuccess(res, { testimonials });
  } catch (err) {
    sendError(res, err.message);
  }
};

// Admin — all testimonials, filterable by status
export const getAdminTestimonials = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const testimonials = await Testimonial.find(filter).sort({ createdAt: -1 });
    sendSuccess(res, { testimonials });
  } catch (err) {
    sendError(res, err.message);
  }
};

// Admin — count of pending testimonials
export const getPendingCount = async (req, res) => {
  try {
    const count = await Testimonial.countDocuments({ status: 'pending' });
    sendSuccess(res, { count });
  } catch (err) {
    sendError(res, err.message);
  }
};

// Public — user submission, saved as pending
export const submitTestimonial = async (req, res) => {
  try {
    const data = { ...req.body, status: 'pending' };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/testimonials');
      data.photo = result.secure_url;
    }

    const testimonial = await Testimonial.create(data);

    // Fire emails silently
    try {
      const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('email');
      const toEmails = admins.map((u) => u.email).filter(Boolean);
      await sendTestimonialAdminNotification(testimonial, toEmails);
    } catch {}

    try {
      await sendTestimonialReviewerConfirmation(testimonial);
    } catch {}

    sendSuccess(res, { testimonial }, 'Your review has been submitted and is pending approval.', 201);
  } catch (err) {
    sendError(res, err.message);
  }
};

// Admin — create testimonial directly as approved
export const createTestimonial = async (req, res) => {
  try {
    const data = { ...req.body, status: 'approved' };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/testimonials');
      data.photo = result.secure_url;
    }

    const testimonial = await Testimonial.create(data);
    sendSuccess(res, { testimonial }, 'Testimonial created successfully', 201);
  } catch (err) {
    sendError(res, err.message);
  }
};

export const updateTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return sendError(res, 'Testimonial not found', 404);

    const data = { ...req.body };

    if (req.file) {
      if (testimonial.photo) {
        const publicId = getPublicIdFromUrl(testimonial.photo);
        if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
      }
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/testimonials');
      data.photo = result.secure_url;
    }

    const updated = await Testimonial.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    sendSuccess(res, { testimonial: updated }, 'Testimonial updated successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};

// Admin — approve a pending testimonial
export const approveTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!testimonial) return sendError(res, 'Testimonial not found', 404);
    sendSuccess(res, { testimonial }, 'Testimonial approved and published');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return sendError(res, 'Testimonial not found', 404);

    if (testimonial.photo) {
      const publicId = getPublicIdFromUrl(testimonial.photo);
      if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
    }

    await testimonial.deleteOne();
    sendSuccess(res, {}, 'Testimonial deleted successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};
