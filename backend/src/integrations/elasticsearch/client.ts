import { Client } from '@elastic/elasticsearch';
import config from '../../config';
import logger from '../../utils/logger';

let client: Client | null = null;

export function getElasticsearchClient(): Client {
  if (!client) {
    client = new Client({ node: config.elasticsearchUrl });
    logger.info({ url: config.elasticsearchUrl }, 'Elasticsearch client initialized');
  }
  return client;
}

export async function pingElasticsearch(): Promise<boolean> {
  try {
    await getElasticsearchClient().ping();
    return true;
  } catch {
    return false;
  }
}
