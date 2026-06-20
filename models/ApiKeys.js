import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema({
  key:        { type: String, required: true, unique: true, trim: true },
  ciphertext: { type: String, required: true },
  iv:         { type: String, required: true },
  tag:        { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('ApiKey', apiKeySchema);
