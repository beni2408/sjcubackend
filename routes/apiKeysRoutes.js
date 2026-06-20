import express from 'express';
import { getKeys, updateKeys } from '../controllers/apiKeysController.js';
import { protect, superAdminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/',  protect, superAdminOnly, getKeys);
router.put('/',  protect, superAdminOnly, updateKeys);

export default router;
