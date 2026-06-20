import express from 'express';
import { login, logout, getMe, createAdmin } from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/create-admin', createAdmin); // TEMP: unprotected for first admin setup

export default router;
