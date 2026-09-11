import { getElasticsearchClient } from '../integrations/elasticsearch/client';
import logger from '../utils/logger';

export const EMAIL_INDEX = 'reachinbox_emails';

export interface EmailDocument {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: string;
  sentAt?: string;
  senderId: string;
  campaignId: string;
  errorMessage?: string;
}

export interface SearchFilters {
  status?: string;
  senderId?: string;
  campaignId?: string;
  from?: string;
  to?: string;
}

export class SearchIndexService {
  async ensureIndex(): Promise<void> {
    const client = getElasticsearchClient();
    try {
      const exists = await client.indices.exists({ index: EMAIL_INDEX });
      if (!exists) {
        await client.indices.create({
          index: EMAIL_INDEX,
          mappings: {
            properties: {
              id: { type: 'keyword' },
              recipient: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              subject: { type: 'text' },
              body: { type: 'text' },
              status: { type: 'keyword' },
              scheduledAt: { type: 'date' },
              sentAt: { type: 'date' },
              senderId: { type: 'keyword' },
              campaignId: { type: 'keyword' },
              errorMessage: { type: 'text' },
            },
          },
        });
        logger.info({ index: EMAIL_INDEX }, 'Elasticsearch index created');
      }
    } catch (error) {
      logger.warn({ error }, 'Could not ensure Elasticsearch index — ES may be unavailable');
    }
  }

  async indexEmail(doc: EmailDocument): Promise<void> {
    try {
      await getElasticsearchClient().index({
        index: EMAIL_INDEX,
        id: doc.id,
        document: doc,
        refresh: 'wait_for', // ensure immediately searchable (dev only)
      });
    } catch (error) {
      // ES failure must NEVER block email delivery — DB is source of truth
      logger.warn({ error, emailId: doc.id }, 'Elasticsearch indexing failed — continuing');
    }
  }

  async updateEmailStatus(emailId: string, updates: Partial<EmailDocument>): Promise<void> {
    try {
      await getElasticsearchClient().update({
        index: EMAIL_INDEX,
        id: emailId,
        doc: updates,
      });
    } catch (error) {
      logger.warn({ error, emailId }, 'Elasticsearch update failed — continuing');
    }
  }

  async search(
    query: string,
    filters: SearchFilters = {},
    from = 0,
    size = 20,
  ): Promise<{ hits: EmailDocument[]; total: number }> {
    const client = getElasticsearchClient();
    try {
      const must: object[] = [];
      const filter: object[] = [];

      if (query && query.trim()) {
        must.push({
          multi_match: {
            query: query.trim(),
            fields: ['recipient^3', 'subject^2', 'body'],
            fuzziness: 'AUTO',
          },
        });
      } else {
        must.push({ match_all: {} });
      }

      if (filters.status) filter.push({ term: { status: filters.status } });
      if (filters.senderId) filter.push({ term: { senderId: filters.senderId } });
      if (filters.campaignId) filter.push({ term: { campaignId: filters.campaignId } });
      if (filters.from || filters.to) {
        filter.push({ range: { scheduledAt: { gte: filters.from, lte: filters.to } } });
      }

      const response = await client.search<EmailDocument>({
        index: EMAIL_INDEX,
        from,
        size,
        sort: [{ scheduledAt: { order: 'desc' } }],
        query: { bool: { must, filter } },
      });

      const hits = response.hits.hits
        .map((h) => h._source)
        .filter((s): s is EmailDocument => s !== undefined);

      const total =
        typeof response.hits.total === 'number'
          ? response.hits.total
          : (response.hits.total?.value ?? 0);

      return { hits, total };
    } catch (error) {
      logger.warn({ error }, 'Elasticsearch search failed — returning empty results');
      return { hits: [], total: 0 };
    }
  }
}

export const searchIndexService = new SearchIndexService();
