import Audition from '../models/Audition.js';
import AuditionApplication from '../models/AuditionApplication.js';
import User from '../models/User.js';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../services/cloudinaryService.js';
import { sendAuditionApplicationNotification, sendApplicantConfirmation, sendApplicantStatusUpdate } from '../services/emailService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

// Public — applicant submits the audition application form.
// The photo is only ever uploaded to Cloudinary here, on final submit — never before.
export const submitApplication = async (req, res) => {
  try {
    const audition = await Audition.findById(req.params.id);
    if (!audition) return sendError(res, 'Audition not found', 404);

    const now = new Date();
    if (audition.status !== 'active' || now < audition.applicationStart || now > audition.applicationEnd) {
      return sendError(res, 'Applications are currently closed for this audition', 400);
    }

    const { name, mobile, age, dob, fatherName, motherName, email, termsAccepted } = req.body;

    if (!name?.trim() || !mobile?.trim() || !age || !dob || !fatherName?.trim() || !motherName?.trim()) {
      return sendError(res, 'Please fill in all required fields', 400);
    }
    if (termsAccepted !== 'true' && termsAccepted !== true) {
      return sendError(res, 'You must accept the Terms & Conditions to apply', 400);
    }
    if (!req.file) {
      return sendError(res, 'A passport size photo is required', 400);
    }

    const ageNum = Number(age);
    if (Number.isNaN(ageNum) || ageNum < audition.minAge || ageNum > audition.maxAge) {
      return sendError(res, `Age must be between ${audition.minAge} and ${audition.maxAge} for this audition`, 400);
    }

    const result = await uploadToCloudinary(req.file.buffer, 'sjcu/audition-applicants');

    const application = await AuditionApplication.create({
      audition: audition._id,
      name, mobile, age: ageNum, dob, fatherName, motherName,
      email: email || '',
      photo: result.secure_url,
      termsAccepted: true,
    });

    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('email');
    const adminEmails = admins.map((a) => a.email).filter(Boolean);
    if (adminEmails.length) {
      sendAuditionApplicationNotification(application, audition, adminEmails).catch(console.error);
    }
    sendApplicantConfirmation(application, audition).catch(console.error);

    sendSuccess(res, { application }, 'Application submitted successfully', 201);
  } catch (err) {
    sendError(res, err.message);
  }
};

// Admin — list applications for a given audition.
export const getApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { audition: req.params.id };
    if (status) filter.status = status;
    const applications = await AuditionApplication.find(filter).sort({ createdAt: -1 });
    sendSuccess(res, { applications });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const getApplication = async (req, res) => {
  try {
    const application = await AuditionApplication.findById(req.params.appId).populate('audition', 'title auditionId');
    if (!application) return sendError(res, 'Application not found', 404);
    sendSuccess(res, { application });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Pending', 'Shortlisted', 'Rejected', 'Selected'];
    if (!allowed.includes(status)) return sendError(res, 'Invalid status', 400);

    const application = await AuditionApplication.findByIdAndUpdate(
      req.params.appId, { status }, { new: true, runValidators: true }
    ).populate('audition', 'title auditionId date venue');
    if (!application) return sendError(res, 'Application not found', 404);

    if (application.audition) {
      sendApplicantStatusUpdate(application, application.audition, status).catch(console.error);
    }

    sendSuccess(res, { application }, 'Status updated successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const getRecentApplications = async (req, res) => {
  try {
    const applications = await AuditionApplication.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('audition', 'title auditionId _id');
    sendSuccess(res, { applications });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const application = await AuditionApplication.findById(req.params.appId);
    if (!application) return sendError(res, 'Application not found', 404);

    if (application.photo) {
      const publicId = getPublicIdFromUrl(application.photo);
      if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
    }

    await application.deleteOne();
    sendSuccess(res, {}, 'Application deleted successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};
