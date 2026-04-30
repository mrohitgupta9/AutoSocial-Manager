import Parser from "rss-parser";

const parser = new Parser();

export class NewsService {
  static async getTrendingNews() {
    try {
      // Fetching from Google News RSS for a "World News" or "Tech News" perspective
      const feed = await parser.parseURL("https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en");
      
      return feed.items.slice(0, 10).map(item => ({
        id: item.guid || crypto.randomUUID(),
        title: item.title,
        link: item.link,
        source: item.source || "Google News",
        published_at: item.pubDate
      }));
    } catch (error) {
      console.error("News fetch error:", error);
      return [];
    }
  }
}
