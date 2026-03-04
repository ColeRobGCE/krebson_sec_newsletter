export interface FeedArticle {
  guid: string;
  title: string;
  link: string;
  description: string;
  categories: string[];
  pubDate: string;
  author: string;
  contentEncoded?: string;
}

export interface SentArticleRecord {
  guid: string;
  title: string;
  sentAt: string;
}

export interface NewsletterEmail {
  to: string[];
  subject: string;
  html: string;
  text: string;
}

export interface AppConfig {
  feedUrl: string;
  recipients: string[];
  resendApiKey: string;
  sentArticlesPath: string;
}
