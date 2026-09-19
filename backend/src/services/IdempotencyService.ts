import { PrismaClient, Email, EmailStatus } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export class IdempotencyService {
  /**
   * Attempt to claim an email for processing using a DB-level state machine.
   *
   * State transitions:
   *   SCHEDULED → PROCESSING  (worker claims it)
   *   RATE_LIMITED → PROCESSING  (rescheduled job is being retried)
   *   PROCESSING → (already locked by another worker — skip)
   *   SENT → (already done — skip, this is a duplicate job execution)
   *   FAILED → (terminal — skip unless explicitly retried)
   *
   * Uses SELECT ... FOR UPDATE NOWAIT so two concurrent workers never both
   * process the same email — one wins the lock, the other gets an error and skips.
   */
  async claimForProcessing(emailId: string): Promise<Email | null> {
    try {
      return await prisma.$transaction(async (tx) => {
        const emails = await tx.$queryRaw<Email[]>`
          SELECT * FROM "Email" WHERE id = ${emailId}::uuid FOR UPDATE NOWAIT
        `;

        if (!emails || emails.length === 0) {
          logger.warn({ emailId }, 'Email not found during idempotency check');
          return null;
        }

        const email = emails[0];

        // Already sent — this is a duplicate BullMQ execution (e.g., retry after crash)
        if (email.status === EmailStatus.SENT) {
          logger.info({ emailId }, 'Email already SENT — skipping duplicate job execution');
          return null;
        }

        // Another worker claimed it — check if the lease has expired (stale job from crashed worker)
        if (email.status === EmailStatus.PROCESSING) {
          const LEASE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes lease
          const isStale =
            email.processingStartedAt &&
            Date.now() - new Date(email.processingStartedAt).getTime() > LEASE_TIMEOUT_MS;

          if (!isStale) {
            logger.warn({ emailId }, 'Email already PROCESSING — active worker lease in progress');
            return null;
          }

          logger.warn(
            { emailId, processingStartedAt: email.processingStartedAt },
            'Detected stale PROCESSING lease (>5 min) from crashed worker — recovering job',
          );
        }

        // Terminal failure — do not retry automatically
        if (email.status === EmailStatus.FAILED) {
          logger.warn({ emailId }, 'Email is FAILED — skipping (manual retry needed)');
          return null;
        }

        // Claim the email: SCHEDULED, RATE_LIMITED, or Stale PROCESSING → PROCESSING
        const now = new Date();
        const updated = await tx.email.update({
          where: { id: emailId },
          data: {
            status: EmailStatus.PROCESSING,
            attempts: { increment: 1 },
            processingStartedAt: now,
            lastAttemptAt: now,
          },
        });

        logger.debug({ emailId, previousStatus: email.status }, 'Email claimed for processing');
        return updated;
      });
    } catch (error: unknown) {
      // PostgreSQL raises 55P03 when FOR UPDATE NOWAIT cannot acquire the lock
      const pgErr = error as { code?: string; meta?: { code?: string } };
      if (pgErr?.code === '55P03' || pgErr?.meta?.code === '55P03') {
        logger.info({ emailId }, 'Email row locked by another worker — skipping');
        return null;
      }
      throw error;
    }
  }

  async markSent(emailId: string, messageId?: string): Promise<void> {
    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: EmailStatus.SENT,
        sentAt: new Date(),
        processingStartedAt: null,
        messageId: messageId ?? null,
        errorMessage: null,
      },
    });
    logger.info({ emailId, messageId }, 'Email marked SENT');
  }

  async markFailed(emailId: string, errorMessage: string): Promise<void> {
    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: EmailStatus.FAILED,
        processingStartedAt: null,
        errorMessage,
      },
    });
    logger.error({ emailId, errorMessage }, 'Email marked FAILED');
  }

  async markRateLimited(emailId: string, nextWindowAt: Date): Promise<void> {
    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: EmailStatus.RATE_LIMITED,
        scheduledAt: nextWindowAt,
        processingStartedAt: null,
      },
    });
    logger.info({ emailId, nextWindowAt }, 'Email marked RATE_LIMITED, rescheduled');
  }

  async markScheduled(emailId: string, scheduledAt: Date, bullJobId?: string): Promise<void> {
    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: EmailStatus.SCHEDULED,
        scheduledAt,
        bullJobId: bullJobId ?? undefined,
        processingStartedAt: null,
        errorMessage: null,
      },
    });
  }
}

export const idempotencyService = new IdempotencyService();
