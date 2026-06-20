import Enquiry from '../models/Enquiry.js';
import User from '../models/User.js';
import { sendEnquiryNotification, sendEnquiryConfirmation, sendEnquiryStatusUpdate } from '../services/emailService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getEnquiries = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const enquiries = await Enquiry.find(filter).sort({ createdAt: -1 });
    sendSuccess(res, { enquiries });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const getEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return sendError(res, 'Enquiry not found', 404);
    sendSuccess(res, { enquiry });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const createEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.create(req.body);

    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('email');
    const adminEmails = admins.map((a) => a.email).filter(Boolean);
    sendEnquiryNotification(enquiry, adminEmails).catch(console.error);
    sendEnquiryConfirmation(enquiry).catch(console.error);

    sendSuccess(res, { enquiry }, 'Enquiry submitted successfully', 201);
  } catch (err) {
    sendError(res, err.message);
  }
};

export const updateEnquiry = async (req, res) => {
  try {
    const old = await Enquiry.findById(req.params.id);
    if (!old) return sendError(res, 'Enquiry not found', 404);

    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (req.body.status && req.body.status !== old.status) {
      sendEnquiryStatusUpdate(enquiry, req.body.status).catch(console.error);
    }

    sendSuccess(res, { enquiry }, 'Enquiry updated successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return sendError(res, 'Enquiry not found', 404);
    await enquiry.deleteOne();
    sendSuccess(res, {}, 'Enquiry deleted successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};
