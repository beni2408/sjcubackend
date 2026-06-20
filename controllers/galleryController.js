import Gallery from '../models/Gallery.js';
import { uploadToCloudinary, uploadVideoToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../services/cloudinaryService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getGallery = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const items = await Gallery.find(filter).sort({ order: 1, createdAt: -1 });
    sendSuccess(res, { gallery: items });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const uploadGalleryImages = async (req, res) => {
  try {
    const { category, caption } = req.body;

    console.log('[gallery upload] files:', req.files?.length, '| body:', req.body);
    if (req.files) {
      req.files.forEach(f => console.log('  -', f.originalname, f.mimetype, f.size));
    }

    if (!req.files || req.files.length === 0) {
      return sendError(res, 'No images provided', 400);
    }

    const count = await Gallery.countDocuments();
    const uploadPromises = req.files.map((file, i) =>
      uploadToCloudinary(file.buffer, 'sjcu/gallery').then((result) =>
        Gallery.create({ type: 'image', image: result.secure_url, category, caption: caption || '', order: count + i })
      )
    );

    const items = await Promise.all(uploadPromises);
    sendSuccess(res, { gallery: items }, 'Images uploaded successfully', 201);
  } catch (err) {
    sendError(res, err.message);
  }
};

export const uploadGalleryVideo = async (req, res) => {
  try {
    const { category, caption } = req.body;

    if (!req.file) {
      return sendError(res, 'No video file provided', 400);
    }

    const result = await uploadVideoToCloudinary(req.file.buffer, 'sjcu/gallery-videos');
    const count = await Gallery.countDocuments();
    const item = await Gallery.create({
      type: 'video',
      videoUrl: result.secure_url,
      image: '',
      category,
      caption: caption || '',
      order: count,
    });

    sendSuccess(res, { item }, 'Video uploaded successfully', 201);
  } catch (err) {
    sendError(res, err.message);
  }
};

export const reorderGallery = async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return sendError(res, 'order must be an array', 400);
    await Promise.all(order.map(({ id, order: o }) => Gallery.findByIdAndUpdate(id, { order: o })));
    sendSuccess(res, {}, 'Order updated');
  } catch (err) {
    sendError(res, err.message);
  }
};

export const deleteGalleryItem = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) return sendError(res, 'Gallery item not found', 404);

    const publicId = getPublicIdFromUrl(item.type === 'video' ? item.videoUrl : item.image);
    if (publicId) {
      await deleteFromCloudinary(publicId, item.type === 'video' ? 'video' : 'image').catch(() => {});
    }

    await item.deleteOne();
    sendSuccess(res, {}, 'Gallery item deleted successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};
