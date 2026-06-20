import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  time: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
  venue: { type: String, trim: true, default: '' },
  bannerImage: { type: String, default: '' },
  gallery: [{ type: String }],
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);
