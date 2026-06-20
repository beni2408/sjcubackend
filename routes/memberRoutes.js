import express from 'express';
import { getMembers, getMember, getMemberBySlug, createMember, updateMember, deleteMember, reorderMembers } from '../controllers/memberController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/',              getMembers);
router.put('/reorder',       protect, adminOnly, reorderMembers);
router.get('/slug/:slug',    getMemberBySlug);
router.get('/:id',           getMember);
router.post('/',             protect, adminOnly, upload.single('photo'), createMember);
router.put('/:id',           protect, adminOnly, upload.single('photo'), updateMember);
router.delete('/:id',        protect, adminOnly, deleteMember);

export default router;
