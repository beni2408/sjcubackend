import mongoose from 'mongoose';

const STAGE_KEYS = ['discussion', 'pre_production', 'audio_recording', 'video_recording', 'post_production', 'released'];

const stageInfoSchema = new mongoose.Schema({
  description: { type: String, default: '' },
  images: [{ type: String }],
  completedAt: { type: Date },
}, { _id: false });

const upcomingProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  featureImage: { type: String, default: '' },
  description: { type: String, default: '' },
  currentStage: { type: String, enum: STAGE_KEYS, default: 'discussion' },
  discussion:      { type: stageInfoSchema, default: () => ({}) },
  pre_production:  { type: stageInfoSchema, default: () => ({}) },
  audio_recording: { type: stageInfoSchema, default: () => ({}) },
  video_recording: { type: stageInfoSchema, default: () => ({}) },
  post_production: { type: stageInfoSchema, default: () => ({}) },
  released:        { type: stageInfoSchema, default: () => ({}) },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export const STAGE_KEYS_LIST = STAGE_KEYS;
export default mongoose.model('UpcomingProject', upcomingProjectSchema);
