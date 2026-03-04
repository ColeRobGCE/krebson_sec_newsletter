import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import {
  loadSentArticles,
  saveSentArticles,
  filterNewArticles,
  createSentRecord,
} from '../dedup.js';
import type { FeedArticle, SentArticleRecord } from '../types.js';

const makeTempPath = () => path.join(os.tmpdir(), `dedup-test-${Date.now()}.json`);

describe('loadSentArticles', () => {
  it('returns empty array when file does not exist', async () => {
    const result = await loadSentArticles('/nonexistent/path/file.json');
    expect(result).toEqual([]);
  });

  it('returns parsed array from valid JSON file', async () => {
    const filePath = makeTempPath();
    const records: SentArticleRecord[] = [
      { guid: 'https://krebsonsecurity.com/?p=1', title: 'Article 1', sentAt: '2026-01-01T00:00:00.000Z' },
    ];
    await fs.writeFile(filePath, JSON.stringify(records));
    const result = await loadSentArticles(filePath);
    expect(result).toEqual(records);
    await fs.unlink(filePath);
  });

  it('returns empty array and does not throw when JSON is corrupted', async () => {
    const filePath = makeTempPath();
    await fs.writeFile(filePath, 'INVALID_JSON{{{');
    const result = await loadSentArticles(filePath);
    expect(result).toEqual([]);
    await fs.unlink(filePath);
  });
});

describe('saveSentArticles', () => {
  it('writes valid JSON array to file', async () => {
    const filePath = makeTempPath();
    const records: SentArticleRecord[] = [
      { guid: 'https://krebsonsecurity.com/?p=2', title: 'Article 2', sentAt: '2026-02-01T00:00:00.000Z' },
    ];
    await saveSentArticles(filePath, records);
    const content = await fs.readFile(filePath, 'utf-8');
    expect(JSON.parse(content)).toEqual(records);
    await fs.unlink(filePath);
  });
});

describe('filterNewArticles', () => {
  const articles: FeedArticle[] = [
    { guid: 'guid-1', title: 'Article 1', link: '', description: '', categories: [], pubDate: '', author: '' },
    { guid: 'guid-2', title: 'Article 2', link: '', description: '', categories: [], pubDate: '', author: '' },
    { guid: 'guid-3', title: 'Article 3', link: '', description: '', categories: [], pubDate: '', author: '' },
  ];

  it('returns all articles when sentRecords is empty', () => {
    expect(filterNewArticles(articles, [])).toHaveLength(3);
  });

  it('returns only articles whose GUIDs are NOT in sentRecords', () => {
    const sentRecords: SentArticleRecord[] = [
      { guid: 'guid-1', title: 'Article 1', sentAt: '2026-01-01T00:00:00.000Z' },
    ];
    const result = filterNewArticles(articles, sentRecords);
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.guid)).toEqual(['guid-2', 'guid-3']);
  });

  it('returns empty array when all articles have already been sent', () => {
    const sentRecords: SentArticleRecord[] = articles.map((a) => ({
      guid: a.guid,
      title: a.title,
      sentAt: '2026-01-01T00:00:00.000Z',
    }));
    expect(filterNewArticles(articles, sentRecords)).toHaveLength(0);
  });
});

describe('createSentRecord', () => {
  it('creates a SentArticleRecord with current ISO timestamp', () => {
    const article: FeedArticle = {
      guid: 'https://krebsonsecurity.com/?p=73057',
      title: 'Test Article',
      link: '', description: '', categories: [], pubDate: '', author: '',
    };
    const before = new Date().toISOString();
    const record = createSentRecord(article);
    const after = new Date().toISOString();
    expect(record.guid).toBe(article.guid);
    expect(record.title).toBe(article.title);
    expect(record.sentAt >= before).toBe(true);
    expect(record.sentAt <= after).toBe(true);
  });
});
