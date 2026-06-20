import mongoose from 'mongoose';

const auditionSchema = new mongoose.Schema({
  auditionId:       { type: String, unique: true },
  title:            { type: String, required: true, trim: true },
  description:      { type: String, trim: true, default: '' },
  date:             { type: Date, required: true },
  venue:            { type: String, trim: true, default: '' },
  applicationStart: { type: Date },
  applicationEnd:   { type: Date },
  minAge:           { type: Number, default: 5 },
  maxAge:           { type: Number, default: 60 },
  featureImage:     { type: String, default: '' },
  order:            { type: Number, default: 0 },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Dynamically computed — never stale
auditionSchema.virtual('isOpen').get(function () {
  if (!this.applicationEnd) return true;
  return new Date() <= new Date(this.applicationEnd);
});

auditionSchema.virtual('status').get(function () {
  return this.isOpen ? 'Open' : 'Closed';
});

auditionSchema.pre('save', async function (next) {
  if (!this.auditionId) {
    const count = await mongoose.model('Audition').countDocuments();
    this.auditionId = `SJCU-AUD-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

export default mongoose.model('Audition', auditionSchema);
