import express from 'express';
import { getContacts, getContact, createContact, updateContact, deleteContact } from '../controllers/contactController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, adminOnly, getContacts);
router.get('/:id', protect, adminOnly, getContact);
router.post('/', protect, adminOnly, createContact);
router.put('/:id', protect, adminOnly, updateContact);
router.delete('/:id', protect, adminOnly, deleteContact);

export default router;
