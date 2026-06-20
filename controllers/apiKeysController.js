import ApiKeys from '../models/ApiKeys.js';
import { encrypt, decrypt, mask } from '../services/cryptoService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const FIELDS = [
    'cloudinaryCloudName',
    'cloudinaryApiKey',
    'cloudinaryApiSecret',
    'emailUser',
    'emailPassword',
    'youtubeApiKey',
    'groqApiKey',
];

// GET /api/keys — returns masked previews + isSet flag (never exposes raw values)
export const getKeys = async (req, res) => {
    try {
        const doc = await ApiKeys.findOne().lean();
        const result = {};
        for (const field of FIELDS) {
            const decrypted = doc ? decrypt(doc[field] || '') : '';
            result[field] = {
                isSet:   !!decrypted,
                preview: decrypted ? mask(decrypted) : '',
                updatedAt: doc?.updatedAt || null,
            };
        }
        res.json({ success: true, data: { keys: result, updatedBy: doc?.updatedBy || null } });
    } catch (err) {
        console.error('getKeys error:', err.message);
        sendError(res, 'Failed to load API keys', 500);
    }
};

// PUT /api/keys — encrypts and saves only non-empty submitted fields
export const updateKeys = async (req, res) => {
    try {
        const updates = {};
        for (const field of FIELDS) {
            const val = req.body[field];
            // Only update if a real new value was submitted (not empty, not a masked string)
            if (val && typeof val === 'string' && !val.includes('•')) {
                updates[field] = encrypt(val.trim());
            }
        }

        if (Object.keys(updates).length === 0) {
            return sendError(res, 'No new values provided', 400);
        }

        updates.updatedBy = req.user._id;

        const doc = await ApiKeys.findOneAndUpdate(
            {},
            { $set: updates },
            { upsert: true, new: true }
        );

        // Return updated masked previews
        const result = {};
        for (const field of FIELDS) {
            const decrypted = decrypt(doc[field] || '');
            result[field] = {
                isSet:   !!decrypted,
                preview: decrypted ? mask(decrypted) : '',
            };
        }

        console.log(`[API KEYS] Updated by ${req.user.email} — fields: ${Object.keys(updates).filter(k => k !== 'updatedBy').join(', ')}`);

        res.json({ success: true, message: 'API keys updated securely', data: { keys: result } });
    } catch (err) {
        console.error('updateKeys error:', err.message);
        sendError(res, 'Failed to update API keys', 500);
    }
};
