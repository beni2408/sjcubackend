import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  logo: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  socialLinks: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    youtube: { type: String, default: '' },
    twitter: { type: String, default: '' },
  },
  footerText: { type: String, default: '© St. John\'s Carol Union. All rights reserved.' },
  galleryShuffled: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
