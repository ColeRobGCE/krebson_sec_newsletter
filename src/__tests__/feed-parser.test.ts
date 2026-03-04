import { fetchFeed } from '../feed-parser.js';
import type { FeedArticle } from '../types.js';

const RSS_XML_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Krebs on Security</title>
    <link>https://krebsonsecurity.com</link>
    <description>In-depth security news and investigation</description>
    <item>
      <title>DDoS Service Operator Gets 6 Years</title>
      <link>https://krebsonsecurity.com/2026/02/ddos-service-operator-gets-6-years/</link>
      <dc:creator><![CDATA[BrianKrebs]]></dc:creator>
      <pubDate>Sat, 28 Feb 2026 12:01:57 +0000</pubDate>
      <category><![CDATA[DDoS-for-Hire]]></category>
      <category><![CDATA[Breadcrumbs]]></category>
      <guid isPermaLink="false">https://krebsonsecurity.com/?p=73057</guid>
      <description><![CDATA[<p>A federal judge sentenced a man to six years in prison for operating a DDoS-for-hire service.</p>]]></description>
      <content:encoded><![CDATA[<p>Full article content here with <strong>HTML</strong> formatting.</p>]]></content:encoded>
    </item>
    <item>
      <title>Second Article Title</title>
      <link>https://krebsonsecurity.com/2026/02/second/</link>
      <dc:creator><![CDATA[BrianKrebs]]></dc:creator>
      <pubDate>Mon, 24 Feb 2026 10:00:00 +0000</pubDate>
      <category><![CDATA[Security]]></category>
      <guid isPermaLink="false">https://krebsonsecurity.com/?p=73000</guid>
      <description><![CDATA[<p>Second article description.</p>]]></description>
    </item>
  </channel>
</rss>`;

const EMPTY_RSS_XML_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Krebs on Security</title>
    <link>https://krebsonsecurity.com</link>
    <description>In-depth security news and investigation</description>
  </channel>
</rss>`;

function mockFetchOk(body: string): void {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: async () => body,
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('fetchFeed', () => {
  test('returns an array of FeedArticle objects', async () => {
    mockFetchOk(RSS_XML_FIXTURE);
    const articles = await fetchFeed('https://krebsonsecurity.com/feed/');
    expect(Array.isArray(articles)).toBe(true);
    expect(articles.length).toBe(2);
  });

  test('parses guid, title, link, pubDate, author, and categories correctly', async () => {
    mockFetchOk(RSS_XML_FIXTURE);
    const articles = await fetchFeed('https://krebsonsecurity.com/feed/');
    const first = articles[0];

    expect(first.guid).toBe('https://krebsonsecurity.com/?p=73057');
    expect(first.title).toBe('DDoS Service Operator Gets 6 Years');
    expect(first.link).toBe('https://krebsonsecurity.com/2026/02/ddos-service-operator-gets-6-years/');
    expect(first.pubDate).toBe('Sat, 28 Feb 2026 12:01:57 +0000');
    expect(first.author).toBe('BrianKrebs');
    expect(first.categories).toEqual(['DDoS-for-Hire', 'Breadcrumbs']);
  });

  test('strips HTML tags from description', async () => {
    mockFetchOk(RSS_XML_FIXTURE);
    const articles = await fetchFeed('https://krebsonsecurity.com/feed/');
    const first = articles[0];

    expect(first.description).not.toMatch(/<[^>]*>/);
    expect(first.description).toBe(
      'A federal judge sentenced a man to six years in prison for operating a DDoS-for-hire service.'
    );
  });

  test('extracts contentEncoded when present, undefined when absent', async () => {
    mockFetchOk(RSS_XML_FIXTURE);
    const articles = await fetchFeed('https://krebsonsecurity.com/feed/');
    const first = articles[0];
    const second = articles[1];

    expect(first.contentEncoded).toBe(
      '<p>Full article content here with <strong>HTML</strong> formatting.</p>'
    );
    expect(second.contentEncoded).toBeUndefined();
  });

  test('returns empty array for feed with no items', async () => {
    mockFetchOk(EMPTY_RSS_XML_FIXTURE);
    const articles = await fetchFeed('https://krebsonsecurity.com/feed/');
    expect(articles).toEqual([]);
  });

  test('throws descriptive error on network failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network unreachable'));
    await expect(fetchFeed('https://krebsonsecurity.com/feed/')).rejects.toThrow(
      /Failed to fetch feed from https:\/\/krebsonsecurity\.com\/feed\//
    );
    await expect(
      (async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network unreachable'));
        return fetchFeed('https://krebsonsecurity.com/feed/');
      })()
    ).rejects.toThrow(/Network unreachable/);
  });

  test('throws error on non-ok HTTP response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    });
    await expect(fetchFeed('https://krebsonsecurity.com/feed/')).rejects.toThrow(
      /Feed fetch failed with status 404/
    );
  });
});
