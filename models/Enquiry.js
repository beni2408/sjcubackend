import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['Pending', 'Contacted', 'Completed'],
    default: 'Pending',
  },
}, { timestamps: true });

export default mongoose.model('Enquiry', enquirySchema);
