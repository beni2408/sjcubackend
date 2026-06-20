import ApiKey from '../models/ApiKeys.js';
import { encrypt, decrypt } from '../services/cryptoService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const ALLOWED_KEYS = [
  'cloudinaryCloudName', 'cloudinaryApiKey', 'cloudinaryApiSecret',
  'emailUser', 'emailPassword',
  'youtubeApiKey',
  'groqApiKey',
  'resendApiKey',
];

function maskValue(val) {
  if (!val || val.length < 6) return '••••••';
  return val.slice(0, 4) + '••••' + val.slice(-2);
}

// GET /api/keys — returns masked status for each key
export const getKeys = async (req, res) => {
  try {
    const docs = await ApiKey.find({ key: { $in: ALLOWED_KEYS } });
    const keys = {};
    for (const name of ALLOWED_KEYS) {
      const doc = docs.find(d => d.key === name);
      if (doc) {
        const plain = decrypt(doc);
        keys[name] = { isSet: true, preview: maskValue(plain) };
      } else {
        keys[name] = { isSet: false, preview: '' };
      }
    }
    sendSuccess(res, { keys });
  } catch (err) {
    sendError(res, err.message);
  }
};

// PUT /api/keys — upsert one or more keys
export const updateKeys = async (req, res) => {
  try {
    const updates = req.body;
    for (const [name, value] of Object.entries(updates)) {
      if (!ALLOWED_KEYS.includes(name) || typeof value !== 'string' || !value.trim()) continue;
      const encrypted = encrypt(value.trim());
      await ApiKey.findOneAndUpdate(
        { key: name },
        { key: name, ...encrypted },
        { upsert: true, new: true }
      );
    }
    // Return fresh status
    const docs = await ApiKey.find({ key: { $in: ALLOWED_KEYS } });
    const keys = {};
    for (const name of ALLOWED_KEYS) {
      const doc = docs.find(d => d.key === name);
      if (doc) {
        const plain = decrypt(doc);
        keys[name] = { isSet: true, preview: maskValue(plain) };
      } else {
        keys[name] = { isSet: false, preview: '' };
      }
    }
    sendSuccess(res, { keys }, 'Keys saved securely');
  } catch (err) {
    sendError(res, err.message);
  }
};

// Internal helper — used by other services to get a decrypted key value
export const getDecryptedKey = async (name) => {
  try {
    const doc = await ApiKey.findOne({ key: name });
    if (!doc) return null;
    return decrypt(doc);
  } catch {
    return null;
  }
};
