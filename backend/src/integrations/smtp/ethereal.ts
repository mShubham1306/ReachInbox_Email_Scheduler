import nodemailer from 'nodemailer';
import logger from '../../utils/logger';

export async function generateEtherealCredentials() {
  const account = await nodemailer.createTestAccount();
  logger.info(
    {
      user: account.user,
      pass: account.pass,
      host: account.smtp.host,
      port: account.smtp.port,
    },
    'Generated Ethereal test account — add these to your .env file',
  );
  console.log('\n=== Ethereal SMTP Credentials ===');
  console.log(`ETHEREAL_HOST=${account.smtp.host}`);
  console.log(`ETHEREAL_PORT=${account.smtp.port}`);
  console.log(`ETHEREAL_USER=${account.user}`);
  console.log(`ETHEREAL_PASSWORD=${account.pass}`);
  console.log('=================================\n');
  return account;
}
