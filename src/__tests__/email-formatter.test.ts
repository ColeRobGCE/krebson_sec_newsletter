import { formatNewsletter } from '../email-formatter.js';
import type { FeedArticle } from '../types.js';

const makeArticle = (overrides: Partial<FeedArticle> = {}): FeedArticle => ({
  guid: 'https://krebsonsecurity.com/?p=73057',
  title: 'DDoS Service Operator Gets 6 Years',
  link: 'https://krebsonsecurity.com/2026/02/ddos-service-operator-gets-6-years/',
  description: 'A federal judge sentenced a man to six years in prison for operating a DDoS-for-hire service that targeted banks and governments.',
  categories: ['DDoS-for-Hire', 'Breadcrumbs'],
  pubDate: 'Sat, 28 Feb 2026 12:01:57 +0000',
  author: 'BrianKrebs',
  ...overrides,
});

const recipients = ['cole.robinson@gce.com'];

describe('formatNewsletter', () => {
  it('returns a NewsletterEmail with to, subject, html, and text fields', () => {
    const email = formatNewsletter([makeArticle()], recipients);
    expect(email.to).toEqual(recipients);
    expect(email.subject).toBeDefined();
    expect(email.html).toBeDefined();
    expect(email.text).toBeDefined();
  });

  it('subject is "Krebs on Security: <title>" for single article', () => {
    const email = formatNewsletter([makeArticle()], recipients);
    expect(email.subject).toBe('Krebs on Security: DDoS Service Operator Gets 6 Years');
  });

  it('subject is "Krebs on Security: N New Articles" for multiple articles', () => {
    const articles = [makeArticle({ title: 'First' }), makeArticle({ guid: 'guid-2', title: 'Second' })];
    const email = formatNewsletter(articles, recipients);
    expect(email.subject).toBe('Krebs on Security: 2 New Articles');
  });

  it('text body contains title, description, link, categories, and date for each article', () => {
    const email = formatNewsletter([makeArticle()], recipients);
    expect(email.text).toContain('DDoS Service Operator Gets 6 Years');
    expect(email.text).toContain('https://krebsonsecurity.com/2026/02/ddos-service-operator-gets-6-years/');
    expect(email.text).toContain('DDoS-for-Hire');
    expect(email.text).toContain('Sat, 28 Feb 2026');
  });

  it('html body contains article title, link and description content', () => {
    const email = formatNewsletter([makeArticle()], recipients);
    expect(email.html).toContain('DDoS Service Operator Gets 6 Years');
    expect(email.html).toContain('https://krebsonsecurity.com/2026/02/ddos-service-operator-gets-6-years/');
    expect(email.html).toContain('<');  // Has HTML markup
  });

  it('formats multiple articles correctly — all articles present in text', () => {
    const articles = [
      makeArticle({ title: 'Article One' }),
      makeArticle({ guid: 'guid-2', title: 'Article Two' }),
      makeArticle({ guid: 'guid-3', title: 'Article Three' }),
    ];
    const email = formatNewsletter(articles, recipients);
    expect(email.text).toContain('Article One');
    expect(email.text).toContain('Article Two');
    expect(email.text).toContain('Article Three');
  });

  it('throws an error when articles array is empty', () => {
    expect(() => formatNewsletter([], recipients)).toThrow();
  });

  it('truncates long descriptions to ~280 chars with ellipsis in text', () => {
    const longDesc = 'A'.repeat(400);
    const email = formatNewsletter([makeArticle({ description: longDesc })], recipients);
    const lines = email.text.split('\n');
    const descLine = lines.find((l) => l.startsWith('A'));
    expect(descLine).toBeDefined();
    expect(descLine!.length).toBeLessThan(300);
    expect(descLine!.endsWith('…')).toBe(true);
  });

  it('html uses inline styles and no external CSS or CSS grid/flexbox', () => {
    const email = formatNewsletter([makeArticle()], recipients);
    expect(email.html).not.toContain('display: flex');
    expect(email.html).not.toContain('display: grid');
    expect(email.html).not.toContain('<link');
    expect(email.html).not.toContain('<style>');
  });
});
