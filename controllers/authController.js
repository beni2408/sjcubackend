import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../services/cloudinaryService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { sendAdminInvitation } from '../services/emailService.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendError(res, 'Email and password are required', 400);

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return sendError(res, 'Invalid email or password', 401);
    }

    if (user.status === 'pending') {
      return sendError(res, 'Please accept your invitation email before logging in', 403);
    }

    const token = signToken(user._id);
    sendSuccess(res, { token, user: user.toJSON() }, 'Login successful');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const logout = (req, res) => {
  sendSuccess(res, {}, 'Logged out successfully');
};

export const getMe = async (req, res) => {
  sendSuccess(res, { user: req.user });
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, dob, gender } = req.body;
    if (!name?.trim()) return sendError(res, 'Name is required', 400);
    if (!email?.trim()) return sendError(res, 'Email is required', 400);

    const conflict = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user._id } });
    if (conflict) return sendError(res, 'This email is already in use by another account', 400);

    const updates = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      dob: dob || null,
      gender: gender || '',
    };

    if (req.file) {
      if (req.user.avatar) {
        const oldId = getPublicIdFromUrl(req.user.avatar);
        if (oldId) await deleteFromCloudinary(oldId).catch(() => {});
      }
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/admin-avatars');
      updates.avatar = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    sendSuccess(res, { user }, 'Profile updated successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return sendError(res, 'Both current and new password are required', 400);
    if (newPassword.length < 6) return sendError(res, 'New password must be at least 6 characters', 400);

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return sendError(res, 'Current password is incorrect', 401);
    }

    user.password = newPassword;
    await user.save();
    sendSuccess(res, {}, 'Password changed successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email) return sendError(res, 'Name and email are required', 400);

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return sendError(res, 'User with this email already exists', 400);

    const assignedRole = role === 'super_admin' && req.user.role === 'super_admin' ? 'super_admin' : 'admin';

    // Generate a secure invite token (raw = sent in email, hashed = stored in DB)
    const rawToken   = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      role: assignedRole,
      status: 'pending',
      inviteToken:  hashedToken,
      inviteExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteUrl   = `${frontendUrl}/admin/accept-invite?token=${rawToken}`;

    await sendAdminInvitation({
      name,
      email: email.toLowerCase(),
      inviteUrl,
      invitedBy: req.user.name,
    });

    sendSuccess(res, { user }, 'Invitation sent successfully', 201);
  } catch (err) {
    sendError(res, err.message);
  }
};

export const resendInvite = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);
    if (user.status === 'active') return sendError(res, 'This admin has already accepted their invitation', 400);

    const rawToken    = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.inviteToken  = hashedToken;
    user.inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteUrl   = `${frontendUrl}/admin/accept-invite?token=${rawToken}`;

    await sendAdminInvitation({
      name:      user.name,
      email:     user.email,
      inviteUrl,
      invitedBy: req.user.name,
    });

    sendSuccess(res, {}, 'Invitation resent successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const acceptInvite = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return sendError(res, 'Token and password are required', 400);
    if (password.length < 6) return sendError(res, 'Password must be at least 6 characters', 400);

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      inviteToken:  hashedToken,
      inviteExpiry: { $gt: new Date() },
      status:       'pending',
    });

    if (!user) return sendError(res, 'Invitation link is invalid or has expired', 400);

    user.password     = password;
    user.status       = 'active';
    user.inviteToken  = undefined;
    user.inviteExpiry = undefined;
    await user.save();

    const jwtToken = signToken(user._id);
    sendSuccess(res, { token: jwtToken, user: user.toJSON() }, 'Invitation accepted! Welcome aboard.');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const listAdmins = async (req, res) => {
  try {
    const admins = await User.find({}).select('-password').sort({ createdAt: -1 });
    sendSuccess(res, { admins });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const updateAdminRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'super_admin'].includes(role)) return sendError(res, 'Invalid role', 400);
    if (req.params.id === req.user._id.toString()) return sendError(res, 'Cannot change your own role', 400);

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return sendError(res, 'User not found', 404);
    sendSuccess(res, { user }, 'Role updated successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) return sendError(res, 'Cannot delete your own account', 400);
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);
    sendSuccess(res, {}, 'Admin removed successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};
