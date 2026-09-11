import '../config'; // ensure env is loaded first
import { Worker } from 'bullmq';
import { createRedisClient } from '../utils/redis';
import { QUEUE_NAME } from '../queues/emailQueue';
import { processEmailJob } from './processors/emailProcessor';
import { searchIndexService } from '../services/SearchIndexService';
import config from '../config';
import logger from '../utils/logger';

async function startWorker() {
  logger.info('Starting BullMQ email worker...');

  // Ensure Elasticsearch index exists before processing
  await searchIndexService.ensureIndex();

  const workerConnection = createRedisClient();

  const worker = new Worker(QUEUE_NAME, processEmailJob, {
    connection: workerConnection,
    concurrency: config.worker.concurrency,
    // Remove completed jobs after 500 are stored (keeps Redis lean)
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, emailId: job.data.emailId }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, emailId: job?.data?.emailId, err: err.message, attempts: job?.attemptsMade },
      'Job failed',
    );
  });

  worker.on('error', (err) => {
    logger.error({ err }, 'Worker error');
  });

  worker.on('stalled', (jobId) => {
    logger.warn({ jobId }, 'Job stalled — will be retried');
  });

  logger.info(
    {
      queue: QUEUE_NAME,
      concurrency: config.worker.concurrency,
      minDelayMs: config.worker.minEmailDelayMs,
    },
    '✅ Worker started successfully',
  );

  // Graceful shutdown
  async function shutdown(signal: string) {
    logger.info({ signal }, 'Shutting down worker...');
    await worker.close();
    await workerConnection.quit();
    logger.info('Worker shut down cleanly');
    process.exit(0);
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startWorker().catch((err) => {
  logger.error({ err }, 'Worker startup failed');
  process.exit(1);
});
