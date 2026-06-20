import mongoose from 'mongoose';

const apiKeysSchema = new mongoose.Schema({
    cloudinaryCloudName: { type: String, default: '' },
    cloudinaryApiKey:    { type: String, default: '' },
    cloudinaryApiSecret: { type: String, default: '' },
    emailUser:           { type: String, default: '' },
    emailPassword:       { type: String, default: '' },
    youtubeApiKey:       { type: String, default: '' },
    groqApiKey:          { type: String, default: '' },
    updatedBy:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

export default mongoose.model('ApiKeys', apiKeysSchema);
