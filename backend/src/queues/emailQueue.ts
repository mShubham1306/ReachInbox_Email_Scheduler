import { Queue, QueueEvents } from 'bullmq';
import { createRedisClient, getRedisClient } from '../utils/redis';
import { JobData } from '../types';
import logger from '../utils/logger';

const QUEUE_NAME = 'email-send';

// Create a dedicated connection for the queue (BullMQ requires separate connections)
const queueConnection = createRedisClient();

export const emailQueue = new Queue<JobData>(QUEUE_NAME, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 },
  },
});

// Reuse the shared singleton instead of spawning a third connection
export const emailQueueEvents = new QueueEvents(QUEUE_NAME, {
  connection: getRedisClient(),
});

emailQueueEvents.on('error', () => {
  // Gracefully handled when Redis is not active
});

emailQueue.on('error', () => {
  // Gracefully handled when Redis is not active
});

/**
 * Add a delayed email job to the queue.
 * The jobId equals emailId by default to enforce BullMQ-level idempotency.
 * Pass a custom jobId override for rescheduled jobs (so BullMQ accepts a new entry
 * even though the same emailId may have had a previous job).
 */
export async function addEmailJob(
  emailId: string,
  scheduledAt: Date,
  meta: { campaignId: string; senderId: string },
  jobIdOverride?: string,
) {
  const delay = Math.max(0, scheduledAt.getTime() - Date.now());

  const job = await emailQueue.add(
    'send-email',
    {
      emailId,
      campaignId: meta.campaignId,
      senderId: meta.senderId,
    },
    {
      jobId: jobIdOverride ?? emailId, // BullMQ-level idempotency
      delay,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    },
  );

  logger.debug({ jobId: job.id, emailId, delay, scheduledAt }, 'Email job enqueued');
  return job;
}

export { QUEUE_NAME };
