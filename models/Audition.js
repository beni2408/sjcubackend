import mongoose from 'mongoose';

const auditionSchema = new mongoose.Schema({
  auditionId: { type: String, unique: true, index: true },
  title: { type: String, required: true, trim: true },
  featureImage: { type: String, default: '' },
  description: { type: String, trim: true, default: '' },
  date: { type: Date, required: true },
  venue: { type: String, required: true, trim: true },
  applicationStart: { type: Date, required: true },
  applicationEnd: { type: Date, required: true },
  minAge: { type: Number, default: 0 },
  maxAge: { type: Number, default: 100 },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  order: { type: Number, default: 0 },
}, { timestamps: true });

// Auto-generate a human-readable Audition ID on creation, e.g. SJCU-AUD-2026-001
auditionSchema.pre('save', async function (next) {
  if (this.isNew && !this.auditionId) {
    const year = new Date().getFullYear();
    const prefix = `SJCU-AUD-${year}-`;
    const count = await this.constructor.countDocuments({ auditionId: new RegExp(`^${prefix}`) });
    this.auditionId = `${prefix}${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

export default mongoose.model('Audition', auditionSchema);
