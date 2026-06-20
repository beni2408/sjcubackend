import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  photo: { type: String, default: '' },
  position: { type: String, required: true, trim: true },
  teamCategory: {
    type: [String],
    enum: ['Leadership', 'Choir Member', 'Media Team'],
    default: ['Choir Member'],
  },
  description: { type: String, trim: true, default: '' },
  socialLinks: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    youtube: { type: String, default: '' },
  },
  gender: { type: String, enum: ['Male', 'Female'], default: 'Male' },
  order:  { type: Number, default: 0 },
  slug:   { type: String, unique: true, sparse: true, trim: true, lowercase: true },
  seo: {
    metaTitle:         { type: String, default: '' },
    metaDescription:   { type: String, default: '' },
    ogTitle:           { type: String, default: '' },
    ogDescription:     { type: String, default: '' },
    ogImage:           { type: String, default: '' },
    primaryKeywords:   { type: [String], default: [] },
    secondaryKeywords: { type: [String], default: [] },
  },
}, { timestamps: true });

export default mongoose.model('Member', memberSchema);
