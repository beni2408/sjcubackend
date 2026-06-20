import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  photo: { type: String, default: '' },
  designation: { type: String, trim: true, default: '' },
  message: { type: String, required: true, trim: true },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  featured: { type: Boolean, default: false },
  email:  { type: String, trim: true, default: '' },
  status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model('Testimonial', testimonialSchema);
