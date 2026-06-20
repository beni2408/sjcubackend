import express from 'express';
import { getEvents, getEvent, createEvent, updateEvent, deleteEvent, reorderEvents } from '../controllers/eventController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEvent);
router.put('/reorder', protect, adminOnly, reorderEvents);
router.post('/', protect, adminOnly, upload.single('bannerImage'), createEvent);
router.put('/:id', protect, adminOnly, upload.single('bannerImage'), updateEvent);
router.delete('/:id', protect, adminOnly, deleteEvent);

export default router;
