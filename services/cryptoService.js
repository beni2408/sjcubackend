import crypto from 'crypto';

const ALGO = 'aes-256-gcm';

function getKey() {
    const hex = process.env.ENCRYPTION_KEY;
    if (!hex || hex.length !== 64) throw new Error('ENCRYPTION_KEY must be 64 hex chars (32 bytes)');
    return Buffer.from(hex, 'hex');
}

export function encrypt(text) {
    if (!text) return '';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(stored) {
    if (!stored) return '';
    const parts = stored.split(':');
    if (parts.length !== 3) return '';
    const [ivHex, authTagHex, encryptedHex] = parts;
    try {
        const iv        = Buffer.from(ivHex, 'hex');
        const authTag   = Buffer.from(authTagHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');
        const decipher  = crypto.createDecipheriv(ALGO, getKey(), iv);
        decipher.setAuthTag(authTag);
        return decipher.update(encrypted) + decipher.final('utf8');
    } catch {
        return '';
    }
}

// Returns a masked preview: first 6 chars + ••••• + last 4 chars
export function mask(decrypted) {
    if (!decrypted) return '';
    if (decrypted.length <= 10) return '••••••••••';
    return decrypted.slice(0, 6) + '•••••••••' + decrypted.slice(-4);
}
