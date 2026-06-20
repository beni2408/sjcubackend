import express from 'express';
import { getProductions, getProduction, createProduction, updateProduction, deleteProduction, reorderProductions, fetchYoutubeThumbnail, syncYoutubeThumbnail, fetchYoutubeDescription, toggleHidden } from '../controllers/productionController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/fetch-youtube-thumb', protect, adminOnly, fetchYoutubeThumbnail);
router.post('/fetch-youtube-description', protect, adminOnly, fetchYoutubeDescription);
router.patch('/:id/toggle-hidden', protect, adminOnly, toggleHidden);
router.post('/:id/sync-thumbnail', protect, adminOnly, syncYoutubeThumbnail);
router.get('/', getProductions);
router.get('/:id', getProduction);
router.put('/reorder', protect, adminOnly, reorderProductions);
router.post('/', protect, adminOnly, upload.single('thumbnail'), createProduction);
router.put('/:id', protect, adminOnly, upload.single('thumbnail'), updateProduction);
router.delete('/:id', protect, adminOnly, deleteProduction);

export default router;
