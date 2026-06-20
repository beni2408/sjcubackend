import Settings from '../models/Settings.js';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../services/cloudinaryService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    sendSuccess(res, { settings });
  } catch (err) {
    sendError(res, err.message);
  }
};

export const updateSettings = async (req, res) => {
  try {
    const data = { ...req.body };

    if (typeof data.socialLinks === 'string') {
      data.socialLinks = JSON.parse(data.socialLinks);
    }

    let settings = await Settings.findOne();

    if (req.file) {
      if (settings?.logo) {
        const publicId = getPublicIdFromUrl(settings.logo);
        if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
      }
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/settings');
      data.logo = result.secure_url;
    }

    if (!settings) {
      settings = await Settings.create(data);
    } else {
      settings = await Settings.findOneAndUpdate({}, data, { new: true, runValidators: true, upsert: true });
    }

    sendSuccess(res, { settings }, 'Settings updated successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};
