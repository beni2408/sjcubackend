import Contact from '../models/Contact.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    sendSuccess(res, { contacts });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const getContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return sendError(res, 'Contact not found', 404);
    sendSuccess(res, { contact });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const createContact = async (req, res) => {
  try {
    const { fullName, email, phone } = req.body;
    if (!fullName || !fullName.trim()) {
      return sendError(res, 'Full name is required', 400);
    }
    const contact = await Contact.create({ fullName, email, phone });
    sendSuccess(res, { contact }, 'Contact added successfully', 201);
  } catch (err) {
    sendError(res, err.message);
  }
};

export const updateContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!contact) return sendError(res, 'Contact not found', 404);
    sendSuccess(res, { contact }, 'Contact updated successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return sendError(res, 'Contact not found', 404);
    await contact.deleteOne();
    sendSuccess(res, {}, 'Contact deleted successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};
