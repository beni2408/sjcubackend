import express from 'express';
import { getKeys, updateKeys } from '../controllers/apiKeysController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/',   protect, adminOnly, getKeys);
router.put('/',   protect, adminOnly, updateKeys);

export default router;
