import mongoose from 'mongoose';

const productionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  youtubeLink: { type: String, required: true, trim: true },
  thumbnail: { type: String, default: '' },
  description: { type: String, trim: true, default: '' },
  releaseDate: { type: Date },
  category: {
    type: String,
    enum: ['General Songs', 'Special Songs', 'Christmas Songs', 'Church Dedication Songs', 'Wedding Songs', 'Lent Days Song'],
    required: true,
  },
  featured: { type: Boolean, default: false },
  hidden: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Production', productionSchema);
