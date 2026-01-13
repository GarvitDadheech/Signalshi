import axios from 'axios';
import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

const KALSHI_BASE = 'https://api.kalshi.com/trade-api/v2';

interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  series_ticker: string;
  title: string;
  subtitle: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  previous_yes_bid: number;
  previous_yes_ask: number;
  volume: number;
  volume_24h: number;
  liquidity: number;
  open_interest: number;
  close_time: string;
  expiration_time: string;
  status: string;
  result: string | null;
  can_close_early: boolean;
  category: string;
  risk_limit_cents: number;
}

interface KalshiMarketResponse {
  market: KalshiMarket;
}

interface HistoryPoint {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface KalshiHistoryResponse {
  history: HistoryPoint[];
}

interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface NewsResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

interface MarketAnalysisResult {
  ticker: string;
  title: string;
  currentPrice: number;
  previousPrice: number;
  priceChange: number;
  volume24h: number;
  category: string;
  closeTime: string;
  analysis: string;
  newsCount: number;
  timestamp: string;
}

export async function analyzeMarket(ticker: string): Promise<MarketAnalysisResult> {
  // 1. Fetch current market data from Kalshi
  const marketResponse = await axios.get<KalshiMarketResponse>(
    `${KALSHI_BASE}/markets/${ticker}`
  );
  const market = marketResponse.data.market;

  // 2. Fetch 24-hour price history
  const endTs = Math.floor(Date.now() / 1000);
  const startTs = endTs - (24 * 60 * 60);

  let history: HistoryPoint[] = [];
  let previousPrice = market.last_price;

  try {
    const historyResponse = await axios.get<KalshiHistoryResponse>(
      `${KALSHI_BASE}/markets/${ticker}/history`,
      {
        params: {
          start_ts: startTs,
          end_ts: endTs,
          period_interval: 60
        }
      }
    );

    history = historyResponse.data.history || [];
    if (history.length > 0) {
      previousPrice = history[0].close;
    }
  } catch (error) {
    console.log('Could not fetch history, using current price as previous');
  }

  const priceChange = previousPrice !== market.last_price
    ? parseFloat(((market.last_price - previousPrice) / previousPrice * 100).toFixed(1))
    : 0;

  // 3. Extract keywords from market title
  const keywords = extractKeywords(market.title);

  // 4. Fetch relevant news
  let articles: NewsArticle[] = [];
  let newsText = 'No recent news found';

  if (process.env.NEWS_API_KEY) {
    try {
      const fromDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const newsResponse = await axios.get<NewsResponse>(
        'https://newsapi.org/v2/everything',
        {
          params: {
            q: keywords,
            from: fromDate,
            language: 'en',
            sortBy: 'publishedAt',
            pageSize: 10,
            apiKey: process.env.NEWS_API_KEY
          }
        }
      );

      articles = newsResponse.data.articles || [];
      if (articles.length > 0) {
        newsText = articles
          .slice(0, 5)
          .map((article, i) => 
            `${i + 1}. ${article.title} (${article.source.name}, ${new Date(article.publishedAt).toLocaleDateString()})`
          )
          .join('\n');
      }
    } catch (error) {
      console.log('Could not fetch news:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // 5. Build OpenAI prompt
  const prompt = `
Market: "${market.title}"
Current Probability: ${market.last_price}%
Previous Probability (24h ago): ${previousPrice}%
Change: ${priceChange >= 0 ? '+' : ''}${priceChange}%
Volume (24h): ${market.volume_24h || 'N/A'} contracts
Category: ${market.category || 'Unknown'}
Closes: ${new Date(market.close_time).toLocaleDateString()}

Recent News:
${newsText}

Task: Analyze why this market probability ${priceChange > 0 ? 'increased' : priceChange < 0 ? 'decreased' : 'stayed stable'}. Provide:

**Primary Driver** (1 sentence explaining the main reason for the move)

**Bull Case** 🟢
- [2-3 concise bullet points supporting YES outcome]

**Bear Case** 🔴
- [2-3 concise bullet points supporting NO outcome]

**Confidence Level:** [High/Medium/Low] based on news quality and market conditions

Keep it actionable and concise.`;

  // 6. Call OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a prediction market analyst. Provide clear, concise analysis without financial advice disclaimers.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 600
  });

  const analysis = completion.choices[0].message.content || 'Analysis unavailable';

  // 7. Return structured response
  return {
    ticker,
    title: market.title,
    currentPrice: market.last_price,
    previousPrice: previousPrice,
    priceChange: priceChange,
    volume24h: market.volume_24h,
    category: market.category,
    closeTime: market.close_time,
    analysis: analysis,
    newsCount: articles.length,
    timestamp: new Date().toISOString()
  };
}

function extractKeywords(marketTitle: string): string {
  const stopWords = [
    'will', 'the', 'be', 'to', 'of', 'a', 'an', 
    'in', 'on', 'at', 'by', 'for', 'with', 'about', 
    'as', 'from', 'this', 'that', 'these', 'those'
  ];

  const words = marketTitle
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => 
      word.length > 3 && 
      !stopWords.includes(word) &&
      isNaN(Number(word))
    );

  return words.slice(0, 5).join(' OR ');
}

