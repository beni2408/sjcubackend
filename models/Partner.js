import mongoose from 'mongoose';

const partnerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  logo: { type: String, default: '' },
  description: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  website: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Partner', partnerSchema);
