import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { JobData } from '../../types';
import { idempotencyService } from '../../services/IdempotencyService';
import { rateLimitService } from '../../services/RateLimitService';
import { throttleService } from '../../services/ThrottleService';
import { smtpService } from '../../services/SMTPService';
import { searchIndexService } from '../../services/SearchIndexService';
import { notificationService } from '../../services/NotificationService';
import { addEmailJob } from '../../queues/emailQueue';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export async function processEmailJob(job: Job<JobData>): Promise<void> {
  const { emailId, campaignId, senderId } = job.data;
  const childLogger = logger.child({ jobId: job.id, emailId, campaignId, senderId, attempt: job.attemptsMade });

  childLogger.info('Processing email job');

  // ── Step 1: Idempotency check — claim the email via DB state machine ─────
  const email = await idempotencyService.claimForProcessing(emailId);
  if (!email) {
    // Already SENT, FAILED, or locked by another worker — safely skip
    childLogger.info('Email skipped by idempotency check');
    return;
  }

  try {
    // ── Step 2: Load campaign and sender details ──────────────────────────
    const [campaign, sender] = await Promise.all([
      prisma.campaign.findUnique({ where: { id: campaignId } }),
      prisma.sender.findUnique({ where: { id: senderId } }),
    ]);

    if (!campaign || !sender) {
      await idempotencyService.markFailed(emailId, 'Campaign or sender not found');
      return;
    }

    const effectiveLimit = campaign.hourlyLimit ?? sender.hourlyLimit;

    // ── Step 3: Distributed rate limit check ─────────────────────────────
    const rateLimitResult = await rateLimitService.checkAndIncrement(senderId, effectiveLimit);

    if (!rateLimitResult.allowed) {
      // Rate limited — reschedule to next hour window instead of dropping
      const nextWindowAt = rateLimitResult.nextWindowAt;

      childLogger.warn({ nextWindowAt }, 'Rate limit reached — rescheduling to next window');

      // Update DB status
      await idempotencyService.markRateLimited(emailId, nextWindowAt);

      // Re-enqueue using the imported queue directly (job.queue is protected in BullMQ v5)
      const newJob = await addEmailJob(
        emailId,
        nextWindowAt,
        { campaignId, senderId },
        `${emailId}-rl-${Date.now()}`, // unique jobId so BullMQ accepts the new delayed job
      );

      // Update DB with new job reference
      await idempotencyService.markScheduled(emailId, nextWindowAt, newJob.id ?? undefined);

      // Send Slack notification (deduplicated per sender/hour)
      await notificationService.sendRateLimitAlert(
        senderId,
        sender.email,
        campaign.userId,
        effectiveLimit,
      );

      return;
    }

    // ── Step 4: Throttle — enforce minimum delay between sends globally ───
    const allowedAt = await throttleService.acquireSendSlot(senderId);
    await throttleService.waitForSlot(allowedAt);

    // ── Step 5: Send the email via SMTP ───────────────────────────────────
    const result = await smtpService.sendEmail({
      to: email.recipient,
      subject: email.subject,
      body: email.body,
      fromLabel: 'ReachInbox',
      smtpUser: sender.smtpUser,
      smtpPassword: sender.smtpPassword,
      smtpHost: sender.smtpHost,
      smtpPort: sender.smtpPort,
    });

    // ── Step 6: Mark SENT in DB ───────────────────────────────────────────
    await idempotencyService.markSent(emailId, result.messageId);

    childLogger.info({ messageId: result.messageId, previewUrl: result.previewUrl }, 'Email sent');

    // ── Step 7: Index in Elasticsearch (non-blocking, graceful failure) ───
    await searchIndexService.indexEmail({
      id: emailId,
      recipient: email.recipient,
      subject: email.subject,
      body: email.body,
      status: 'SENT',
      scheduledAt: email.scheduledAt.toISOString(),
      sentAt: new Date().toISOString(),
      senderId,
      campaignId,
    });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    childLogger.error({ error: errMsg }, 'Email processing failed');

    // Only mark FAILED after all BullMQ retry attempts are exhausted
    if (job.attemptsMade >= (job.opts.attempts ?? 1) - 1) {
      await idempotencyService.markFailed(emailId, errMsg);
      // Index failure in Elasticsearch
      await searchIndexService.indexEmail({
        id: emailId,
        recipient: email?.recipient ?? '',
        subject: email?.subject ?? '',
        body: email?.body ?? '',
        status: 'FAILED',
        scheduledAt: email?.scheduledAt?.toISOString() ?? new Date().toISOString(),
        senderId,
        campaignId,
        errorMessage: errMsg,
      });
    } else {
      // Reset to SCHEDULED so the next BullMQ retry can re-claim it
      await idempotencyService.markScheduled(emailId, new Date());
    }

    // Re-throw so BullMQ can handle retry/backoff
    throw error;
  }
}
