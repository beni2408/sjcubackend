import MemorableEvent from '../models/MemorableEvent.js';
import { uploadToCloudinary, uploadVideoToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../services/cloudinaryService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const fetchYoutubeCover = async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    if (!youtubeUrl) return sendError(res, 'youtubeUrl is required', 400);

    const match = youtubeUrl.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    if (!match) return sendError(res, 'Could not extract video ID from URL', 400);

    const videoId = match[1];
    const thumbUrls = [
      `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    ];

    let imgBuffer = null;
    for (const url of thumbUrls) {
      const response = await fetch(url);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buf = Buffer.from(arrayBuffer);
        if (buf.length > 5000) { imgBuffer = buf; break; }
      }
    }
    if (!imgBuffer) return sendError(res, 'Could not fetch YouTube thumbnail', 502);

    const result = await uploadToCloudinary(imgBuffer, 'sjcu/memorable');
    sendSuccess(res, { coverUrl: result.secure_url }, 'Cover fetched from YouTube');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const fetchYoutubeDescription = async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    if (!youtubeUrl) return sendError(res, 'youtubeUrl is required', 400);

    const match = youtubeUrl.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    if (!match) return sendError(res, 'Could not extract video ID from URL', 400);

    const videoId = match[1];
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return sendError(res, 'YouTube API key not configured', 500);

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${apiKey}`;
    const response = await fetch(apiUrl);
    if (!response.ok) return sendError(res, 'YouTube API request failed', 502);

    const data = await response.json();
    const item = data.items?.[0];
    if (!item) return sendError(res, 'Video not found on YouTube', 404);

    const { title, description } = item.snippet;
    sendSuccess(res, { title, description }, 'Description fetched from YouTube');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const getAll = async (req, res) => {
  try {
    const events = await MemorableEvent.find().sort({ order: 1, date: -1 });
    sendSuccess(res, { events });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const getOne = async (req, res) => {
  try {
    const event = await MemorableEvent.findById(req.params.id);
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
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/memorable');
      data.coverImage = result.secure_url;
    } else if (data.coverImageUrl) {
      data.coverImage = data.coverImageUrl;
    }
    delete data.coverImageUrl;
    const event = await MemorableEvent.create(data);
    sendSuccess(res, { event }, 'Event created', 201);
  } catch (err) {
    sendError(res, err.message);
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await MemorableEvent.findById(req.params.id);
    if (!event) return sendError(res, 'Event not found', 404);

    const data = { ...req.body };
    if (req.file) {
      if (event.coverImage) {
        const publicId = getPublicIdFromUrl(event.coverImage);
        if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
      }
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/memorable');
      data.coverImage = result.secure_url;
    } else if (data.coverImageUrl) {
      data.coverImage = data.coverImageUrl;
    }
    delete data.coverImageUrl;

    const updated = await MemorableEvent.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    sendSuccess(res, { event: updated }, 'Event updated');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const addGalleryImages = async (req, res) => {
  try {
    const event = await MemorableEvent.findById(req.params.id);
    if (!event) return sendError(res, 'Event not found', 404);
    if (!req.files || req.files.length === 0) return sendError(res, 'No files provided', 400);

    const uploaded = await Promise.all(
      req.files.map(async f => {
        const isVideo = f.mimetype.startsWith('video/');
        const result = isVideo
          ? await uploadVideoToCloudinary(f.buffer, 'sjcu/memorable/gallery')
          : await uploadToCloudinary(f.buffer, 'sjcu/memorable/gallery');
        return { url: result.secure_url, type: isVideo ? 'video' : 'image' };
      })
    );
    event.gallery.push(...uploaded);
    await event.save();
    sendSuccess(res, { event }, 'Gallery files added');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const deleteGalleryImage = async (req, res) => {
  try {
    const event = await MemorableEvent.findById(req.params.id);
    if (!event) return sendError(res, 'Event not found', 404);

    const { imageUrl } = req.body;
    const galleryItem = event.gallery.find(item =>
      (typeof item === 'string' ? item : item.url) === imageUrl
    );
    const resourceType = galleryItem && typeof galleryItem !== 'string' && galleryItem.type === 'video' ? 'video' : 'image';
    const publicId = getPublicIdFromUrl(imageUrl);
    if (publicId) await deleteFromCloudinary(publicId, resourceType).catch(() => {});

    event.gallery = event.gallery.filter(item =>
      (typeof item === 'string' ? item : item.url) !== imageUrl
    );
    await event.save();
    sendSuccess(res, { event }, 'File deleted');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const reorderEvents = async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return sendError(res, 'order must be an array', 400);
    await Promise.all(order.map(({ id, order: o }) => MemorableEvent.findByIdAndUpdate(id, { order: o })));
    sendSuccess(res, {}, 'Order updated');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await MemorableEvent.findById(req.params.id);
    if (!event) return sendError(res, 'Event not found', 404);

    const toDelete = [
      ...(event.coverImage ? [{ url: event.coverImage, type: 'image' }] : []),
      ...event.gallery.map(item =>
        typeof item === 'string' ? { url: item, type: 'image' } : { url: item.url, type: item.type }
      ),
    ].filter(item => item.url);
    await Promise.all(toDelete.map(({ url, type }) => {
      const id = getPublicIdFromUrl(url);
      return id ? deleteFromCloudinary(id, type).catch(() => {}) : Promise.resolve();
    }));

    await event.deleteOne();
    sendSuccess(res, {}, 'Event deleted');
  } catch (err) {
    sendError(res, err.message);
  }
};
