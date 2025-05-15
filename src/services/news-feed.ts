import Parser from "rss-parser";

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
}

const parser = new Parser();

// List of Kerala news RSS feeds
const RSS_FEEDS = [
  {
    // Using RSS2JSON API as a CORS proxy
    url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.thehindu.com%2Fnews%2Fnational%2Fkerala%2Ffeeder%2Fdefault.rss",
    source: "The Hindu - Kerala",
  },
  {
    url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fenglish.mathrubhumi.com%2Ffeed%2Fkerala",
    source: "Mathrubhumi English",
  },
  {
    url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.newindianexpress.com%2Fstates%2Fkerala%2Frss",
    source: "New Indian Express - Kerala",
  },
  {
    url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.onmanorama.com%2Fnews%2Fkerala.feed",
    source: "Manorama Online",
  },
  {
    url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fkeralakaumudi.com%2Fen%2Frss%2Fkerala.xml",
    source: "Kerala Kaumudi",
  },
  {
    url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.doolnews.com%2Fkerala%2Ffeed",
    source: "Dool News",
  },
];

// Keywords to filter flood and weather related news
const WEATHER_KEYWORDS = [
  // English keywords
  "flood",
  "rain",
  "weather",
  "water level",
  "dam",
  "river",
  "rainfall",
  "monsoon",
  "storm",
  "disaster",
  "rescue",
  "relief",
  "landslide",
  "heavy rain",
  "waterlogging",
  "evacuation",
  "alert",
  "warning",
  "emergency",
  "inundation",
  "cloudburst",
  "thunderstorm",
  "cyclone",
  "downpour",
  "deluge",

  // Malayalam keywords
  "മഴ",
  "വെള്ളപ്പൊക്കം",
  "കാലാവസ്ഥ",
  "ഉരുൾപൊട്ടൽ",
  "അണക്കെട്ട്",
  "ജലനിരപ്പ്",
  "വെള്ളം",
  "ദുരന്തം",
  "രക്ഷാപ്രവർത്തനം",
  "മുന്നറിയിപ്പ്",
  "അടിയന്തര",
  "ശക്തമായ മഴ",
  "വെള്ളക്കെട്ട്",
];

export async function getWeatherNews(): Promise<NewsItem[]> {
  try {
    const allNews: NewsItem[] = [];

    const promises = RSS_FEEDS.map(async (feed) => {
      try {
        const response = await fetch(feed.url);
        const data = await response.json();

        if (data.status !== "ok" || !Array.isArray(data.items)) {
          console.warn(`Invalid data from ${feed.source}`);
          return;
        }

        const newsItems = data.items
          .filter((item: any) => {
            const content = `${item.title} ${item.description}`.toLowerCase();
            return WEATHER_KEYWORDS.some((keyword) =>
              content.includes(keyword.toLowerCase())
            );
          })
          .map((item: any) => ({
            title: item.title?.trim() || "",
            link: item.link || "",
            pubDate: item.pubDate || new Date().toISOString(),
            description: item.description
              ? item.description.replace(/<[^>]*>/g, "").slice(0, 200) + "..."
              : "",
            source: feed.source,
          }))
          .filter((item) => item.title && item.description); // Remove items without title or description

        allNews.push(...newsItems);
      } catch (error) {
        console.warn(`Failed to fetch news from ${feed.source}`);
      }
    });

    await Promise.all(promises);

    // Remove duplicates based on title
    const uniqueNews = allNews.filter(
      (news, index, self) =>
        index === self.findIndex((t) => t.title === news.title)
    );

    // Sort by date, most recent first
    return uniqueNews
      .sort(
        (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
      )
      .slice(0, 20); // Limit to 20 most recent items
  } catch (error) {
    return [];
  }
}
