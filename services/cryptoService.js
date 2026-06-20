import crypto from 'crypto';

const ALGO = 'aes-256-gcm';

function getKey() {
  const raw = process.env.ENCRYPTION_KEY || '';
  if (raw.length === 64) return Buffer.from(raw, 'hex');
  return crypto.scryptSync(raw || 'sjcu-fallback-key', 'sjcu-salt', 32);
}

export function encrypt(text) {
  const iv  = crypto.randomBytes(16);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv:        iv.toString('hex'),
    tag:       tag.toString('hex'),
    ciphertext: encrypted.toString('hex'),
  };
}

export function decrypt({ iv, tag, ciphertext }) {
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(ciphertext, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}
