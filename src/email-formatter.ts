import type { FeedArticle, NewsletterEmail } from './types.js';

const MAX_DESCRIPTION_LENGTH = 280;

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

function buildTextBody(articles: FeedArticle[]): string {
  const sections = articles.map((article) => {
    const desc = truncate(article.description, MAX_DESCRIPTION_LENGTH);
    const cats = article.categories.join(', ');
    return [
      `${article.title}`,
      `${article.link}`,
      ``,
      `${desc}`,
      ``,
      `Categories: ${cats}`,
      `Published: ${article.pubDate}`,
      ``,
      `${'─'.repeat(60)}`,
    ].join('\n');
  });

  return [
    'KREBS ON SECURITY — Daily Newsletter',
    '═'.repeat(60),
    '',
    ...sections,
    '',
    'You are receiving this newsletter because you subscribed.',
  ].join('\n');
}

function buildHtmlBody(articles: FeedArticle[]): string {
  const articleHtml = articles.map((article) => {
    const desc = truncate(article.description, MAX_DESCRIPTION_LENGTH);
    const cats = article.categories.join(', ');
    return `
    <div style="margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #e0e0e0;">
      <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: bold;">
        <a href="${article.link}" style="color: #1a1a1a; text-decoration: none;">${article.title}</a>
      </h2>
      <p style="margin: 0 0 12px 0; color: #333; font-size: 15px; line-height: 1.6;">${desc}</p>
      <p style="margin: 0 0 8px 0;">
        <a href="${article.link}" style="color: #0066cc; font-size: 14px;">Read full article →</a>
      </p>
      <small style="color: #666; font-size: 13px;">
        ${article.pubDate} | Categories: ${cats}
      </small>
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px;">
    <h1 style="margin: 0 0 24px 0; font-size: 24px; color: #1a1a1a; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px;">
      Krebs on Security
    </h1>
    ${articleHtml}
  </div>
</body>
</html>`;
}

export function formatNewsletter(articles: FeedArticle[], recipients: string[]): NewsletterEmail {
  if (articles.length === 0) {
    throw new Error('formatNewsletter called with empty articles array');
  }

  const subject = articles.length === 1
    ? `Krebs on Security: ${articles[0].title}`
    : `Krebs on Security: ${articles.length} New Articles`;

  return {
    to: recipients,
    subject,
    html: buildHtmlBody(articles),
    text: buildTextBody(articles),
  };
}
