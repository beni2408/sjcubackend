import mongoose from 'mongoose';

const auditionApplicationSchema = new mongoose.Schema({
  audition: { type: mongoose.Schema.Types.ObjectId, ref: 'Audition', required: true, index: true },
  applicationId: { type: String, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  age: { type: Number, required: true },
  dob: { type: Date, required: true },
  fatherName: { type: String, required: true, trim: true },
  motherName: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  photo: { type: String, required: true },
  termsAccepted: { type: Boolean, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Shortlisted', 'Rejected', 'Selected'],
    default: 'Pending',
  },
}, { timestamps: true });

// Auto-generate a human-readable Application ID, e.g. SJCU-APP-2026-00001
auditionApplicationSchema.pre('save', async function (next) {
  if (this.isNew && !this.applicationId) {
    const year = new Date().getFullYear();
    const prefix = `SJCU-APP-${year}-`;
    const count = await this.constructor.countDocuments({ applicationId: new RegExp(`^${prefix}`) });
    this.applicationId = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('AuditionApplication', auditionApplicationSchema);
