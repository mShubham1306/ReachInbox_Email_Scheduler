import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../../src/utils/encryption';

describe('AES-256-GCM Encryption Utility', () => {
  it('should encrypt and decrypt a plain text password accurately', () => {
    const rawPassword = 'my-super-secret-smtp-password-123!';
    const encrypted = encrypt(rawPassword);

    expect(encrypted).not.toBe(rawPassword);
    expect(encrypted.split(':')).toHaveLength(3); // iv:authTag:ciphertext

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(rawPassword);
  });

  it('should handle empty strings gracefully', () => {
    expect(encrypt('')).toBe('');
    expect(decrypt('')).toBe('');
  });

  it('should return unencrypted text if given legacy plaintext for backwards compatibility', () => {
    const legacyPassword = 'plain-old-password';
    expect(decrypt(legacyPassword)).toBe(legacyPassword);
  });
});
