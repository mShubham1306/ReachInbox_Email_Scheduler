import { describe, it, expect } from 'vitest';
import { parseEmailsFromBuffer } from '../../src/utils/csvParser';

describe('CSV/TXT Email Parser', () => {
  it('should parse valid emails from a simple CSV buffer', () => {
    const csvContent = 'name,email\nJohn,john@example.com\nJane,jane@domain.co\nBob,notanemail@\n';
    const buffer = Buffer.from(csvContent, 'utf-8');
    const result = parseEmailsFromBuffer(buffer, 'text/csv');

    expect(result.valid).toContain('john@example.com');
    expect(result.valid).toContain('jane@domain.co');
    // "notanemail@" has @ so goes into invalid
    expect(result.invalid).toContain('notanemail@');
    expect(result.valid.length).toBe(2);
  });

  it('should deduplicate email addresses case-insensitively', () => {
    const content = 'Test@Example.com\ntest@example.com\nANOTHER@TEST.COM';
    const buffer = Buffer.from(content, 'utf-8');
    const result = parseEmailsFromBuffer(buffer, 'text/plain');

    expect(result.valid.length).toBe(2);
    expect(result.duplicatesRemoved).toBe(1);
    expect(result.valid).toEqual(['test@example.com', 'another@test.com']);
  });

  it('should handle commas, tabs and newlines in plain text', () => {
    const text = 'user1@reachinbox.ai, user2@reachinbox.ai\tuser3@reachinbox.ai\nuser4@reachinbox.ai';
    const buffer = Buffer.from(text, 'utf-8');
    const result = parseEmailsFromBuffer(buffer, 'text/plain');

    expect(result.valid.length).toBe(4);
    expect(result.valid).toEqual([
      'user1@reachinbox.ai',
      'user2@reachinbox.ai',
      'user3@reachinbox.ai',
      'user4@reachinbox.ai',
    ]);
  });

  it('should handle empty buffer gracefully', () => {
    const buffer = Buffer.from('', 'utf-8');
    const result = parseEmailsFromBuffer(buffer, 'text/plain');

    expect(result.valid.length).toBe(0);
    expect(result.total).toBe(0);
  });
});
