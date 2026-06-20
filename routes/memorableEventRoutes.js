import express from 'express';
import { getAll, getOne, createEvent, updateEvent, deleteEvent, reorderEvents, addGalleryImages, deleteGalleryImage, fetchYoutubeCover, fetchYoutubeDescription } from '../controllers/memorableEventController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { upload, uploadMultiple, uploadMixed } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/fetch-youtube-cover', protect, adminOnly, fetchYoutubeCover);
router.post('/fetch-youtube-description', protect, adminOnly, fetchYoutubeDescription);
router.get('/', getAll);
router.get('/:id', getOne);
router.put('/reorder', protect, adminOnly, reorderEvents);
router.post('/', protect, adminOnly, upload.single('coverImage'), createEvent);
router.put('/:id', protect, adminOnly, upload.single('coverImage'), updateEvent);
router.post('/:id/gallery', protect, adminOnly, uploadMixed, addGalleryImages);
router.delete('/:id/gallery-image', protect, adminOnly, deleteGalleryImage);
router.delete('/:id', protect, adminOnly, deleteEvent);

export default router;
