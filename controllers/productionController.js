import Production from '../models/Production.js';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../services/cloudinaryService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const fetchYoutubeDescription = async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    if (!youtubeUrl) return sendError(res, 'youtubeUrl is required', 400);

    const match = youtubeUrl.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    if (!match) return sendError(res, 'Could not extract video ID from URL', 400);

    const videoId = match[1];
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return sendError(res, 'YouTube API key not configured on server', 500);

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

export const fetchYoutubeThumbnail = async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    if (!youtubeUrl) return sendError(res, 'youtubeUrl is required', 400);

    const match = youtubeUrl.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    if (!match) return sendError(res, 'Could not extract video ID from URL', 400);

    const videoId = match[1];
    // Try maxresdefault first, fall back to hqdefault
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
        // YouTube returns a 120×90 placeholder for missing maxresdefault — skip it
        if (buf.length > 5000) { imgBuffer = buf; break; }
      }
    }

    if (!imgBuffer) return sendError(res, 'Could not fetch YouTube thumbnail', 502);

    const result = await uploadToCloudinary(imgBuffer, 'sjcu/productions');
    sendSuccess(res, { thumbnailUrl: result.secure_url }, 'Thumbnail fetched and uploaded');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const syncYoutubeThumbnail = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id);
    if (!production) return sendError(res, 'Production not found', 404);
    if (!production.youtubeLink) return sendError(res, 'Production has no YouTube link', 400);

    const match = production.youtubeLink.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    if (!match) return sendError(res, 'Could not extract video ID from YouTube link', 400);

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

    // Upload new thumbnail first
    const result = await uploadToCloudinary(imgBuffer, 'sjcu/productions');

    // Delete old Cloudinary thumbnail only after the new one is safely uploaded
    if (production.thumbnail) {
      const publicId = getPublicIdFromUrl(production.thumbnail);
      if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
    }

    const updated = await Production.findByIdAndUpdate(
      req.params.id,
      { thumbnail: result.secure_url },
      { new: true }
    );
    sendSuccess(res, { production: updated }, 'Thumbnail synced from YouTube');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const getProductions = async (req, res) => {
  try {
    const { category, featured, admin } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;
    // hide hidden productions from public; admin sees all
    if (admin !== 'true') filter.hidden = { $ne: true };

    const productions = await Production.find(filter).sort({ order: 1, createdAt: -1 });
    sendSuccess(res, { productions });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const toggleHidden = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id);
    if (!production) return sendError(res, 'Production not found', 404);
    production.hidden = !production.hidden;
    await production.save();
    sendSuccess(res, { production }, production.hidden ? 'Production hidden' : 'Production visible');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const getProduction = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id);
    if (!production) return sendError(res, 'Production not found', 404);
    sendSuccess(res, { production });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const createProduction = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/productions');
      data.thumbnail = result.secure_url;
    } else if (data.thumbnailUrl) {
      data.thumbnail = data.thumbnailUrl;
    }
    delete data.thumbnailUrl;

    const production = await Production.create(data);
    sendSuccess(res, { production }, 'Production created successfully', 201);
  } catch (err) {
    sendError(res, err.message);
  }
};

export const updateProduction = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id);
    if (!production) return sendError(res, 'Production not found', 404);

    const data = { ...req.body };

    if (req.file) {
      if (production.thumbnail) {
        const publicId = getPublicIdFromUrl(production.thumbnail);
        if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
      }
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/productions');
      data.thumbnail = result.secure_url;
    } else if (data.thumbnailUrl) {
      data.thumbnail = data.thumbnailUrl;
    }
    delete data.thumbnailUrl;

    const updated = await Production.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    sendSuccess(res, { production: updated }, 'Production updated successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const reorderProductions = async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return sendError(res, 'order must be an array', 400);
    await Promise.all(order.map(({ id, order: o }) => Production.findByIdAndUpdate(id, { order: o })));
    sendSuccess(res, {}, 'Order updated');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const deleteProduction = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id);
    if (!production) return sendError(res, 'Production not found', 404);

    if (production.thumbnail) {
      const publicId = getPublicIdFromUrl(production.thumbnail);
      if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
    }

    await production.deleteOne();
    sendSuccess(res, {}, 'Production deleted successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};
