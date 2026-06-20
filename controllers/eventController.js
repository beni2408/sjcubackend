import Event from '../models/Event.js';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../services/cloudinaryService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getEvents = async (req, res) => {
  try {
    const { upcoming, featured } = req.query;
    const filter = {};
    if (upcoming === 'true') filter.date = { $gte: new Date() };
    if (featured === 'true') filter.featured = true;

    const events = await Event.find(filter).sort({ order: 1, date: 1 });
    sendSuccess(res, { events });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return sendError(res, 'Event not found', 404);
    sendSuccess(res, { event });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const createEvent = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/events');
      data.bannerImage = result.secure_url;
    }

    const event = await Event.create(data);
    sendSuccess(res, { event }, 'Event created successfully', 201);
  } catch (err) {
    sendError(res, err.message);
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return sendError(res, 'Event not found', 404);

    const data = { ...req.body };

    if (req.file) {
      if (event.bannerImage) {
        const publicId = getPublicIdFromUrl(event.bannerImage);
        if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
      }
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/events');
      data.bannerImage = result.secure_url;
    }

    const updated = await Event.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    sendSuccess(res, { event: updated }, 'Event updated successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const reorderEvents = async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return sendError(res, 'order must be an array', 400);
    await Promise.all(order.map(({ id, order: o }) => Event.findByIdAndUpdate(id, { order: o })));
    sendSuccess(res, {}, 'Order updated');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return sendError(res, 'Event not found', 404);

    if (event.bannerImage) {
      const publicId = getPublicIdFromUrl(event.bannerImage);
      if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
    }

    await event.deleteOne();
    sendSuccess(res, {}, 'Event deleted successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};
