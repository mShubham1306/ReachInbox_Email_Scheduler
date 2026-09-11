import crypto from 'crypto';
import config from '../config';

const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function generateAuthToken(userId: string): string {
  const payload = `${userId}:${Date.now()}`;
  const signature = crypto
    .createHmac('sha256', config.sessionSecret)
    .update(payload)
    .digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

export function verifyAuthToken(token: string): string | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const parts = raw.split(':');
    if (parts.length !== 3) return null;

    const [userId, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return null;

    // Check expiration
    if (Date.now() - timestamp > TOKEN_EXPIRY_MS) return null;

    const expectedSignature = crypto
      .createHmac('sha256', config.sessionSecret)
      .update(`${userId}:${timestampStr}`)
      .digest('hex');

    if (
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return userId;
    }
    return null;
  } catch {
    return null;
  }
}
