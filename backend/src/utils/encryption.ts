import crypto from 'crypto';
import config from '../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 32-byte key from SESSION_SECRET or ENCRYPTION_KEY using SHA-256
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || config.sessionSecret || 'reachinbox-default-safe-secret-key-32b';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts sensitive string using AES-256-GCM.
 * Output format: "iv:authTag:ciphertext" in hex.
 */
export function encrypt(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM encrypted string.
 * Gracefully returns original text if unencrypted (e.g. legacy plain text).
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    // Not encrypted format; return as is for backwards compatibility
    return encryptedText;
  }

  try {
    const [ivHex, authTagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      return encryptedText;
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    // If decryption fails, fallback to original value
    return encryptedText;
  }
}
