import 'dotenv/config';
import { fetchFeed } from './feed-parser.js';
import { loadSentArticles, filterNewArticles, saveSentArticles, createSentRecord } from './dedup.js';
import { formatNewsletter } from './email-formatter.js';
import { sendNewsletter } from './email-sender.js';
import type { AppConfig } from './types.js';

export function loadConfig(): AppConfig {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error('Missing required environment variable: RESEND_API_KEY');
  }

  const recipientsRaw = process.env.NEWSLETTER_RECIPIENTS;
  if (!recipientsRaw) {
    throw new Error('Missing required environment variable: NEWSLETTER_RECIPIENTS');
  }

  const recipients = recipientsRaw.split(',').map((r) => r.trim()).filter(Boolean);

  return {
    feedUrl: 'https://krebsonsecurity.com/feed/',
    recipients,
    resendApiKey,
    sentArticlesPath: process.env.NEWSLETTER_SENT_ARTICLES_PATH ?? './sent-articles.json',
  };
}

export async function run(config: AppConfig): Promise<void> {
  const articles = await fetchFeed(config.feedUrl);
  const sentRecords = await loadSentArticles(config.sentArticlesPath);
  const newArticles = filterNewArticles(articles, sentRecords);

  if (newArticles.length === 0) {
    console.log('No new articles found. Skipping newsletter send.');
    return;
  }

  console.log(`Found ${newArticles.length} new article(s). Sending newsletter...`);
  const email = formatNewsletter(newArticles, config.recipients);
  const emailId = await sendNewsletter(email);
  console.log(`Newsletter sent successfully. Resend ID: ${emailId}`);

  const newRecords = newArticles.map(createSentRecord);
  await saveSentArticles(config.sentArticlesPath, [...sentRecords, ...newRecords]);
  console.log(`Updated sent-articles.json with ${newRecords.length} new record(s).`);
}

const isMain = process.argv[1]?.endsWith('main.ts') || process.argv[1]?.endsWith('main.js');
if (isMain) {
  const config = loadConfig();
  run(config).catch((err: unknown) => {
    console.error('Fatal error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
