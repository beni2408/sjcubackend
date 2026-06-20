import express from 'express';
import multer from 'multer';
import { login, logout, getMe, createAdmin, updateProfile, changePassword, listAdmins, updateAdminRole, deleteAdmin, resendInvite, acceptInvite } from '../controllers/authController.js';
import { protect, superAdminOnly } from '../middleware/authMiddleware.js';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post('/login',         login);
router.post('/accept-invite', acceptInvite);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.put('/change-password', protect, changePassword);

// Super admin only — admin management
router.get('/admins',              protect, superAdminOnly, listAdmins);
router.post('/admins',             protect, superAdminOnly, createAdmin);
router.put('/admins/:id/role',           protect, superAdminOnly, updateAdminRole);
router.post('/admins/:id/resend-invite', protect, superAdminOnly, resendInvite);
router.delete('/admins/:id',             protect, superAdminOnly, deleteAdmin);

export default router;
