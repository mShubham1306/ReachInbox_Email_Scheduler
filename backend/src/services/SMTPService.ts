import nodemailer from 'nodemailer';
import config from '../config';
import logger from '../utils/logger';

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  fromLabel?: string;
  smtpUser?: string;
  smtpPassword?: string;
  smtpHost?: string;
  smtpPort?: number;
}

export interface SendEmailResult {
  messageId: string;
  previewUrl?: string;
}

export class SMTPService {
  private createTransporter(opts: Partial<SendEmailOptions>) {
    const isGmail = 
      (opts.smtpHost && opts.smtpHost.toLowerCase().includes('gmail')) || 
      (opts.smtpUser && opts.smtpUser.toLowerCase().includes('gmail'));
    const isPort465 = opts.smtpPort === 465;

    const user = opts.smtpUser || config.ethereal.user;
    const pass = opts.smtpPassword || config.ethereal.password;

    if (!user || !pass) {
      throw new Error(
        'SMTP credentials not found. Please provide valid SMTP credentials or configure ETHEREAL_USER and ETHEREAL_PASSWORD.',
      );
    }

    if (isGmail) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
      });
    }

    return nodemailer.createTransport({
      host: opts.smtpHost || config.ethereal.host,
      port: opts.smtpPort || (isPort465 ? 465 : config.ethereal.port),
      secure: isPort465,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: config.isProduction ? true : false,
      },
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const transporter = this.createTransporter(options);
    const fromAddress = options.smtpUser || config.ethereal.user || 'noreply@reachinbox.dev';

    const info = await transporter.sendMail({
      from: `"${options.fromLabel || 'ReachInbox'}" <${fromAddress}>`,
      to: options.to,
      subject: options.subject,
      html: `<div style="font-family:sans-serif">${options.body}</div>`,
      text: options.body,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) as string | false;

    logger.info(
      { messageId: info.messageId, to: options.to, previewUrl: previewUrl || undefined },
      'Email sent via SMTP',
    );

    return {
      messageId: info.messageId,
      previewUrl: previewUrl || undefined,
    };
  }

  async verifyConnection(opts: Partial<SendEmailOptions>): Promise<boolean> {
    try {
      const transporter = this.createTransporter(opts);
      await transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}

export const smtpService = new SMTPService();
