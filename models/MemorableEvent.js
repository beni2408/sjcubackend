import mongoose from 'mongoose';

const memorableEventSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  date: { type: Date },
  venue: { type: String, trim: true, default: '' },
  coverImage: { type: String, default: '' },
  gallery: [{
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
  }],
  youtubeLink: { type: String, trim: true, default: '' },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('MemorableEvent', memorableEventSchema);
