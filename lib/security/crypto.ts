import crypto from 'crypto';

/**
 * [SECURITY CORE] - Encrypted Storage Engine
 * Uses AES-256-GCM for field-level encryption.
 */

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.NEXTAUTH_SECRET || 'fallback_secret_32_chars_long_!!';
const IV_LENGTH = 12;

// Derivar una llave de 32 bytes de forma segura
const key = crypto.scryptSync(SECRET_KEY, 'salt-sentinel-2026', 32);

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // Formato: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(hash: string): string {
    const [ivHex, authTagHex, encryptedText] = hash.split(':');

    if (!ivHex || !authTagHex || !encryptedText) {
        // [FALLBACK] If not encrypted (legacy migration), return as is
        return hash;
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
