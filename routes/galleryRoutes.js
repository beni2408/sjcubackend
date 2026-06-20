import express from 'express';
import { getGallery, uploadGalleryImages, uploadGalleryVideo, reorderGallery, deleteGalleryItem } from '../controllers/galleryController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { uploadMultiple, uploadSingleVideo } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', getGallery);
router.post('/', protect, adminOnly, uploadMultiple, uploadGalleryImages);
router.post('/video', protect, adminOnly, uploadSingleVideo, uploadGalleryVideo);
router.patch('/reorder', protect, adminOnly, reorderGallery);
router.delete('/:id', protect, adminOnly, deleteGalleryItem);

export default router;
