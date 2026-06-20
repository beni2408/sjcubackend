import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  applicationId: { type: String, unique: true },
  audition:      { type: mongoose.Schema.Types.ObjectId, ref: 'Audition', required: true },
  name:          { type: String, required: true, trim: true },
  email:         { type: String, trim: true, lowercase: true, default: '' },
  mobile:        { type: String, required: true, trim: true },
  dob:           { type: Date, required: true },
  age:           { type: Number },
  fatherName:    { type: String, trim: true, default: '' },
  motherName:    { type: String, trim: true, default: '' },
  address:       { type: String, trim: true, default: '' },
  voiceType:     { type: String, trim: true, default: '' },
  photo:         { type: String, default: '' },
  status:        { type: String, enum: ['Pending', 'Shortlisted', 'Selected', 'Rejected'], default: 'Pending' },
}, { timestamps: true });

applicationSchema.pre('save', async function (next) {
  if (!this.applicationId) {
    const count = await mongoose.model('AuditionApplication').countDocuments();
    this.applicationId = `APP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
  if (this.dob) {
    this.age = Math.floor((Date.now() - new Date(this.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }
  next();
});

export default mongoose.model('AuditionApplication', applicationSchema);
