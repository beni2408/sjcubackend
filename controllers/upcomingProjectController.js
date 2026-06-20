import UpcomingProject, { STAGE_KEYS_LIST } from '../models/UpcomingProject.js';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../services/cloudinaryService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

// GET /api/upcoming
export const getAll = async (req, res) => {
  try {
    const projects = await UpcomingProject.find().sort({ order: 1, createdAt: -1 });
    sendSuccess(res, { projects });
  } catch (err) {
    sendError(res, err.message);
  }
};

// GET /api/upcoming/:id
export const getOne = async (req, res) => {
  try {
    const project = await UpcomingProject.findById(req.params.id);
    if (!project) return sendError(res, 'Project not found', 404);
    sendSuccess(res, { project });
  } catch (err) {
    sendError(res, err.message);
  }
};

// POST /api/upcoming
export const createProject = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/upcoming');
      data.featureImage = result.secure_url;
    }

    const project = await UpcomingProject.create(data);
    sendSuccess(res, { project }, 'Project created successfully', 201);
  } catch (err) {
    sendError(res, err.message);
  }
};

// PUT /api/upcoming/:id
export const updateProject = async (req, res) => {
  try {
    const project = await UpcomingProject.findById(req.params.id);
    if (!project) return sendError(res, 'Project not found', 404);

    const data = { ...req.body };

    if (req.file) {
      if (project.featureImage) {
        const publicId = getPublicIdFromUrl(project.featureImage);
        if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
      }
      const result = await uploadToCloudinary(req.file.buffer, 'sjcu/upcoming');
      data.featureImage = result.secure_url;
    }

    const updated = await UpcomingProject.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    sendSuccess(res, { project: updated }, 'Project updated successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};

// PATCH /api/upcoming/:id/stage
export const updateStage = async (req, res) => {
  try {
    const project = await UpcomingProject.findById(req.params.id);
    if (!project) return sendError(res, 'Project not found', 404);

    const { stageKey, description, completedAt } = req.body;

    if (!STAGE_KEYS_LIST.includes(stageKey)) {
      return sendError(res, `Invalid stageKey. Must be one of: ${STAGE_KEYS_LIST.join(', ')}`, 400);
    }

    // Upload each stage image
    const newImageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'sjcu/upcoming/stages');
        newImageUrls.push(result.secure_url);
      }
    }

    // Update the stage sub-document
    if (description !== undefined) project[stageKey].description = description;
    if (newImageUrls.length > 0) project[stageKey].images.push(...newImageUrls);
    if (completedAt) project[stageKey].completedAt = new Date(completedAt);
    project.currentStage = stageKey;

    await project.save();
    sendSuccess(res, { project }, 'Stage updated successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};

// DELETE /api/upcoming/:id/stage-image
export const deleteStageImage = async (req, res) => {
  try {
    const project = await UpcomingProject.findById(req.params.id);
    if (!project) return sendError(res, 'Project not found', 404);

    const { stageKey, imageUrl } = req.body;

    if (!STAGE_KEYS_LIST.includes(stageKey)) {
      return sendError(res, `Invalid stageKey`, 400);
    }

    const publicId = getPublicIdFromUrl(imageUrl);
    if (publicId) await deleteFromCloudinary(publicId).catch(() => {});

    project[stageKey].images = project[stageKey].images.filter((img) => img !== imageUrl);
    await project.save();

    sendSuccess(res, { project }, 'Stage image deleted');
  } catch (err) {
    sendError(res, err.message);
  }
};

// DELETE /api/upcoming/:id
export const deleteProject = async (req, res) => {
  try {
    const project = await UpcomingProject.findById(req.params.id);
    if (!project) return sendError(res, 'Project not found', 404);

    // Delete feature image
    if (project.featureImage) {
      const publicId = getPublicIdFromUrl(project.featureImage);
      if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
    }

    // Delete all stage images
    for (const stageKey of STAGE_KEYS_LIST) {
      const stageImages = project[stageKey]?.images || [];
      for (const imgUrl of stageImages) {
        const publicId = getPublicIdFromUrl(imgUrl);
        if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
      }
    }

    await project.deleteOne();
    sendSuccess(res, {}, 'Project deleted successfully');
  } catch (err) {
    sendError(res, err.message);
  }
};

// PUT /api/upcoming/reorder
export const reorderProjects = async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return sendError(res, 'order must be an array', 400);
    await Promise.all(order.map(({ id, order: o }) => UpcomingProject.findByIdAndUpdate(id, { order: o })));
    sendSuccess(res, {}, 'Order updated');
  } catch (err) {
    sendError(res, err.message);
  }
};
