import { promises as fs } from 'fs';
import type { FeedArticle, SentArticleRecord } from './types.js';

export async function loadSentArticles(filePath: string): Promise<SentArticleRecord[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as SentArticleRecord[];
  } catch (err: unknown) {
    if (err instanceof SyntaxError) {
      console.warn(`Warning: Corrupted sent-articles file at ${filePath}. Starting fresh.`);
    }
    return [];
  }
}

export async function saveSentArticles(filePath: string, records: SentArticleRecord[]): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(records, null, 2), 'utf-8');
}

export function filterNewArticles(
  articles: FeedArticle[],
  sentRecords: SentArticleRecord[]
): FeedArticle[] {
  const sentGuids = new Set(sentRecords.map((r) => r.guid));
  return articles.filter((article) => !sentGuids.has(article.guid));
}

export function createSentRecord(article: FeedArticle): SentArticleRecord {
  return {
    guid: article.guid,
    title: article.title,
    sentAt: new Date().toISOString(),
  };
}
