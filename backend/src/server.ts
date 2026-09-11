import app from './app';
import config from './config';
import logger from './utils/logger';
import { searchIndexService } from './services/SearchIndexService';

async function bootstrap() {
  try {
    // Ensure Elasticsearch index exists on startup (non-blocking)
    searchIndexService.ensureIndex().catch((err) => {
      logger.warn({ err }, 'Elasticsearch index check on startup failed');
    });

    const server = app.listen(config.port, () => {
      logger.info(
        {
          port: config.port,
          env: config.nodeEnv,
          bullBoard: `http://localhost:${config.port}/admin/queues`,
        },
        `🚀 ReachInbox Server running on port ${config.port}`
      );
    });

    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Graceful server shutdown initiated');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error({ error }, 'Fatal error during server bootstrap');
    process.exit(1);
  }
}

bootstrap();
