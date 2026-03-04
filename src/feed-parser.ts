import { parseFeed } from 'feedsmith';
import type { RssFeed } from 'feedsmith';
import type { FeedArticle } from './types.js';

type RssItem = NonNullable<RssFeed['items']>[number];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function mapRssItem(item: RssItem): FeedArticle {
  return {
    guid: item.guid ?? '',
    title: item.title ?? '',
    link: item.link ?? '',
    description: stripHtml(item.description ?? ''),
    categories: (item.categories ?? [])
      .map((cat) => cat.name ?? '')
      .filter((name): name is string => name !== ''),
    pubDate: item.pubDate ?? '',
    author: item.dc?.creator ?? (item.authors?.[0] ?? ''),
    contentEncoded: item.content?.encoded,
  };
}

export async function fetchFeed(url: string): Promise<FeedArticle[]> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new Error(
      `Failed to fetch feed from ${url}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!response.ok) {
    throw new Error(`Feed fetch failed with status ${response.status}: ${url}`);
  }

  const xml = await response.text();
  const parsed = parseFeed(xml);

  if (parsed.type !== 'rss') {
    return [];
  }

  return (parsed.feed.items ?? [])
    .map(mapRssItem)
    .filter((article) => article.guid !== '');
}
