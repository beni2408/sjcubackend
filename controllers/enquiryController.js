import Enquiry from '../models/Enquiry.js';
import { sendEnquiryNotification, sendEnquiryConfirmation } from '../services/emailService.js';
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

    sendEnquiryNotification(enquiry).catch(err => console.error('❌ Admin email failed:', err?.message));
    sendEnquiryConfirmation(enquiry).catch(err => console.error('❌ Confirmation email failed:', err?.message));

    sendSuccess(res, { enquiry }, 'Enquiry submitted successfully', 201);
  } catch (err) {
    sendError(res, err.message);
  }
};

export const updateEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!enquiry) return sendError(res, 'Enquiry not found', 404);
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
