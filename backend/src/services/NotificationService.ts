import { PrismaClient } from '@prisma/client';
import { rateLimitService } from './RateLimitService';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export class NotificationService {
  /**
   * Send a Slack alert when a sender hits its hourly rate limit.
   * Uses Redis deduplication so only one message is sent per sender per hour.
   * Silently skips if Slack is not connected.
   */
  async sendRateLimitAlert(
    senderId: string,
    senderEmail: string,
    userId: string,
    limit: number,
  ): Promise<void> {
    // Deduplicate — only one Slack notification per sender per hour
    const alreadyNotified = await rateLimitService.isSlackNotified(senderId);
    if (alreadyNotified) {
      logger.debug({ senderId }, 'Slack notification already sent this hour — skipping');
      return;
    }

    // Check if user has an active Slack connection
    const slackConnection = await prisma.slackConnection.findFirst({
      where: { userId, connected: true },
    });

    if (!slackConnection) {
      logger.debug({ userId }, 'No active Slack connection — skipping notification');
      return;
    }

    try {
      const { WebClient } = await import('@slack/web-api');
      const slack = new WebClient(slackConnection.accessToken);

      const message =
        `⚠️ *Rate Limit Reached*\n\n` +
        `Sender *${senderEmail}* has reached its hourly email limit of *${limit}* emails.\n` +
        `Remaining emails have been automatically rescheduled to the next hour window.\n` +
        `_Time: ${new Date().toISOString()}_`;

      await slack.chat.postMessage({
        channel: '#general',
        text: message,
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: message },
          },
        ],
      });

      // Mark as notified to prevent spam for this sender/hour
      await rateLimitService.markSlackNotified(senderId);
      logger.info({ senderId, senderEmail }, 'Slack rate-limit alert sent');
    } catch (error) {
      // Notification failure must never block the worker
      logger.warn({ error, senderId }, 'Failed to send Slack notification — continuing');
    }
  }
}

export const notificationService = new NotificationService();
