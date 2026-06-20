import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['image', 'video'],
    default: 'image',
  },
  image: { type: String, default: '' },
  videoUrl: { type: String, trim: true, default: '' },
  category: {
    type: String,
    enum: ['Productions', 'Events', 'Choir Practice', 'Behind The Scenes', 'Team Moments'],
    required: true,
  },
  caption: { type: String, trim: true, default: '' },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Gallery', gallerySchema);
