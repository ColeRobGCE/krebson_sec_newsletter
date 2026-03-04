import { FeedArticle, SentArticleRecord, NewsletterEmail, AppConfig } from '../types.js';

describe('TypeScript Types', () => {
  it('FeedArticle has all required fields', () => {
    const article: FeedArticle = {
      guid: 'https://krebsonsecurity.com/?p=73057',
      title: 'Test Article',
      link: 'https://krebsonsecurity.com/2026/02/test/',
      description: 'A test description excerpt',
      categories: ['Security', 'Fraud'],
      pubDate: 'Sat, 28 Feb 2026 12:01:57 +0000',
      author: 'BrianKrebs',
    };
    expect(article.guid).toBeDefined();
  });

  it('FeedArticle contentEncoded is optional', () => {
    const article: FeedArticle = {
      guid: 'https://krebsonsecurity.com/?p=73057',
      title: 'Test Article',
      link: 'https://krebsonsecurity.com/2026/02/test/',
      description: 'A test description',
      categories: [],
      pubDate: '2026-02-28',
      author: 'BrianKrebs',
      // contentEncoded intentionally omitted — should be optional
    };
    expect(article.contentEncoded).toBeUndefined();
  });

  it('SentArticleRecord has guid, title, sentAt', () => {
    const record: SentArticleRecord = {
      guid: 'https://krebsonsecurity.com/?p=73057',
      title: 'Test Article',
      sentAt: new Date().toISOString(),
    };
    expect(record.sentAt).toBeDefined();
  });

  it('NewsletterEmail has to, subject, html, text', () => {
    const email: NewsletterEmail = {
      to: ['cole.robinson@gce.com'],
      subject: 'Krebs on Security: Test Article',
      html: '<h1>Test</h1>',
      text: 'Test',
    };
    expect(email.to).toHaveLength(1);
  });

  it('AppConfig has all required config fields', () => {
    const config: AppConfig = {
      feedUrl: 'https://krebsonsecurity.com/feed/',
      recipients: ['cole.robinson@gce.com'],
      resendApiKey: 're_test_key',
      sentArticlesPath: './sent-articles.json',
    };
    expect(config.feedUrl).toBeDefined();
  });
});
