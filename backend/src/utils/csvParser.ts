import { parse } from 'csv-parse/sync';
import logger from './logger';

export interface ParseResult {
  valid: string[];
  invalid: string[];
  duplicatesRemoved: number;
  total: number;
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

function extractEmailsFromText(text: string): string[] {
  // Split by newlines, commas, semicolons, tabs, or spaces
  return text
    .replace(/\uFEFF/g, '') // Remove BOM
    .split(/[\r\n,;\t ]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

function extractEmailsFromCsv(buffer: Buffer): string[] {
  try {
    const records = parse(buffer, {
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as string[][];

    const emails: string[] = [];
    for (const row of records) {
      for (const cell of row) {
        const trimmed = cell.trim().toLowerCase();
        // Accept if it looks like an email or is in a column named "email"
        emails.push(trimmed);
      }
    }
    return emails;
  } catch (err) {
    logger.warn({ err }, 'CSV parse error, falling back to text extraction');
    return extractEmailsFromText(buffer.toString('utf-8'));
  }
}

export function parseEmailsFromBuffer(buffer: Buffer, mimetype: string): ParseResult {
  let rawEmails: string[];

  if (mimetype === 'text/csv' || mimetype === 'application/vnd.ms-excel') {
    rawEmails = extractEmailsFromCsv(buffer);
  } else {
    // Plain text
    rawEmails = extractEmailsFromText(buffer.toString('utf-8'));
  }

  const total = rawEmails.length;
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  let duplicatesRemoved = 0;

  for (const email of rawEmails) {
    if (!email) continue;
    if (seen.has(email)) {
      duplicatesRemoved++;
      continue;
    }
    seen.add(email);

    if (isValidEmail(email)) {
      valid.push(email);
    } else {
      // Only add to invalid if it looks like an attempted email (has @)
      if (email.includes('@')) {
        invalid.push(email);
      }
    }
  }

  logger.debug({ total, valid: valid.length, invalid: invalid.length, duplicatesRemoved }, 'CSV parsed');

  return { valid, invalid, duplicatesRemoved, total };
}
