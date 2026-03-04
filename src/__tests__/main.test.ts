jest.mock('../feed-parser.js');
jest.mock('../dedup.js');
jest.mock('../email-formatter.js');
jest.mock('../email-sender.js');

import { run, loadConfig } from '../main.js';
import { fetchFeed } from '../feed-parser.js';
import { loadSentArticles, filterNewArticles, saveSentArticles, createSentRecord } from '../dedup.js';
import { formatNewsletter } from '../email-formatter.js';
import { sendNewsletter } from '../email-sender.js';
import type { FeedArticle, SentArticleRecord, NewsletterEmail, AppConfig } from '../types.js';

const mockFetchFeed = fetchFeed as jest.MockedFunction<typeof fetchFeed>;
const mockLoadSentArticles = loadSentArticles as jest.MockedFunction<typeof loadSentArticles>;
const mockFilterNewArticles = filterNewArticles as jest.MockedFunction<typeof filterNewArticles>;
const mockSaveSentArticles = saveSentArticles as jest.MockedFunction<typeof saveSentArticles>;
const mockCreateSentRecord = createSentRecord as jest.MockedFunction<typeof createSentRecord>;
const mockFormatNewsletter = formatNewsletter as jest.MockedFunction<typeof formatNewsletter>;
const mockSendNewsletter = sendNewsletter as jest.MockedFunction<typeof sendNewsletter>;

const testConfig: AppConfig = {
  feedUrl: 'https://krebsonsecurity.com/feed/',
  recipients: ['cole.robinson@gce.com'],
  resendApiKey: 're_test_key',
  sentArticlesPath: './sent-articles.json',
};

const article: FeedArticle = {
  guid: 'https://krebsonsecurity.com/?p=73057',
  title: 'Test Article',
  link: 'https://krebsonsecurity.com/2026/02/test/',
  description: 'Test description',
  categories: ['Security'],
  pubDate: 'Sat, 28 Feb 2026 12:01:57 +0000',
  author: 'BrianKrebs',
};

const sentRecord: SentArticleRecord = {
  guid: article.guid,
  title: article.title,
  sentAt: '2026-03-04T00:00:00.000Z',
};

const email: NewsletterEmail = {
  to: ['cole.robinson@gce.com'],
  subject: 'Krebs on Security: Test Article',
  html: '<h1>Test</h1>',
  text: 'Test',
};

describe('run', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchFeed.mockResolvedValue([article]);
    mockLoadSentArticles.mockResolvedValue([]);
    mockFilterNewArticles.mockReturnValue([article]);
    mockFormatNewsletter.mockReturnValue(email);
    mockSendNewsletter.mockResolvedValue('email-id-123');
    mockCreateSentRecord.mockReturnValue(sentRecord);
    mockSaveSentArticles.mockResolvedValue(undefined);
  });

  it('fetches feed, filters, formats, sends, and saves on happy path', async () => {
    await run(testConfig);
    expect(mockFetchFeed).toHaveBeenCalledWith(testConfig.feedUrl);
    expect(mockLoadSentArticles).toHaveBeenCalledWith(testConfig.sentArticlesPath);
    expect(mockFilterNewArticles).toHaveBeenCalled();
    expect(mockFormatNewsletter).toHaveBeenCalled();
    expect(mockSendNewsletter).toHaveBeenCalledWith(email);
    expect(mockSaveSentArticles).toHaveBeenCalled();
  });

  it('logs "No new articles" and skips send when filterNewArticles returns empty array', async () => {
    mockFilterNewArticles.mockReturnValue([]);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await run(testConfig);
    expect(mockFormatNewsletter).not.toHaveBeenCalled();
    expect(mockSendNewsletter).not.toHaveBeenCalled();
    expect(mockSaveSentArticles).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No new articles'));
    consoleSpy.mockRestore();
  });

  it('propagates error when feed fetch fails', async () => {
    mockFetchFeed.mockRejectedValue(new Error('Network error'));
    await expect(run(testConfig)).rejects.toThrow('Network error');
    expect(mockSendNewsletter).not.toHaveBeenCalled();
  });

  it('saves dedup file after successful send', async () => {
    await run(testConfig);
    expect(mockSaveSentArticles).toHaveBeenCalledWith(
      testConfig.sentArticlesPath,
      expect.any(Array)
    );
  });

  it('passes recipients from config to formatNewsletter', async () => {
    await run(testConfig);
    expect(mockFormatNewsletter).toHaveBeenCalledWith(
      expect.any(Array),
      testConfig.recipients
    );
  });
});

describe('loadConfig', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.NEWSLETTER_RECIPIENTS = 'cole.robinson@gce.com';
    delete process.env.NEWSLETTER_SENT_ARTICLES_PATH;
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.NEWSLETTER_RECIPIENTS;
    delete process.env.NEWSLETTER_SENT_ARTICLES_PATH;
  });

  it('loads config from env vars with hardcoded feedUrl', () => {
    const config = loadConfig();
    expect(config.resendApiKey).toBe('re_test_key');
    expect(config.recipients).toEqual(['cole.robinson@gce.com']);
    expect(config.feedUrl).toBe('https://krebsonsecurity.com/feed/');
  });

  it('splits NEWSLETTER_RECIPIENTS by comma', () => {
    process.env.NEWSLETTER_RECIPIENTS = 'a@b.com,c@d.com,e@f.com';
    const config = loadConfig();
    expect(config.recipients).toEqual(['a@b.com', 'c@d.com', 'e@f.com']);
  });

  it('throws when RESEND_API_KEY is missing', () => {
    delete process.env.RESEND_API_KEY;
    expect(() => loadConfig()).toThrow('RESEND_API_KEY');
  });

  it('throws when NEWSLETTER_RECIPIENTS is missing', () => {
    delete process.env.NEWSLETTER_RECIPIENTS;
    expect(() => loadConfig()).toThrow('NEWSLETTER_RECIPIENTS');
  });
});
