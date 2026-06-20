import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendError } from '../utils/apiResponse.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 'Not authorized, no token', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return sendError(res, 'Not authorized, user not found', 401);
    }

    next();
  } catch {
    return sendError(res, 'Not authorized, token invalid', 401);
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin' || req.user?.role === 'super_admin') {
    return next();
  }
  return sendError(res, 'Access denied - Admin only', 403);
};

export const superAdminOnly = (req, res, next) => {
  if (req.user?.role === 'super_admin') {
    return next();
  }
  return sendError(res, 'Access denied - Super Admin only', 403);
};
