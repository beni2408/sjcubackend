import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return sendError(res, 'Invalid email or password', 401);
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

export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return sendError(res, 'User with this email already exists', 400);

    const user = await User.create({ name, email, password, role: role || 'admin' });
    sendSuccess(res, { user }, 'Admin created successfully', 201);
  } catch (err) {
    sendError(res, err.message);
  }
};
