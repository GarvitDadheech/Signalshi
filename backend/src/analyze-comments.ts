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
  last_price: number;
  volume: number;
  open_interest: number;
  yes_bid: number;
  yes_ask: number;
}

interface KalshiMarketResponse {
  market: KalshiMarket;
}

interface CommentAnalysisResult {
  ticker: string;
  title: string;
  currentPrice: number;
  commentCount: number;
  hasComments: boolean;
  analysis: string;
  timestamp: string;
}

export async function analyzeComments(ticker: string): Promise<CommentAnalysisResult> {
  // 1. Fetch market data
  const marketResponse = await axios.get<KalshiMarketResponse>(
    `${KALSHI_BASE}/markets/${ticker}`
  );
  const market = marketResponse.data.market;

  // 2. Try to fetch comments (Kalshi may not have this endpoint)
  let comments: any[] = [];
  let commentText = '';

  try {
    // Try different possible endpoints
    const endpoints = [
      `/markets/${ticker}/activity`,
      `/markets/${ticker}/trades`,
      `/events/${market.event_ticker}/activity`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${KALSHI_BASE}${endpoint}`);
        if (response.data) {
          comments = response.data.activity || response.data.trades || [];
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (comments.length > 0) {
      commentText = comments
        .slice(0, 50)
        .map((c: any) => `- ${c.text || c.comment || c.message || ''}`)
        .filter((c: string) => c.length > 2)
        .join('\n');
    }
  } catch (error) {
    console.log('No comments API available');
  }

  // 3. If no comments, generate analysis based on market metrics
  if (!commentText) {
    commentText = `No public comments available for this market. Analysis based on market metrics:
- Current price: ${market.last_price}%
- Volume: ${market.volume} contracts
- Open interest: ${market.open_interest} contracts
- Bid-ask spread: ${market.yes_ask - market.yes_bid} points`;
  }

  // 4. Build OpenAI prompt
  const prompt = `
Market: "${market.title}"
Current Probability: ${market.last_price}%
Volume: ${market.volume} contracts

Community Discussion:
${commentText}

Task: Analyze the sentiment and key arguments in this market's community.

**Overall Sentiment:** Bullish/Bearish/Mixed (with % if determinable)

**Top Bull Arguments:**
- [List 3 main bullish points]

**Top Bear Arguments:**
- [List 3 main bearish points]

**Community Confidence:** High/Medium/Low

**Notable Disagreements:**
- [Key points where views differ]

Keep it concise and objective.`;

  // 5. Call OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a sentiment analyst for prediction markets. Analyze community sentiment objectively.'
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

  // 6. Return structured response
  return {
    ticker,
    title: market.title,
    currentPrice: market.last_price,
    commentCount: comments.length,
    hasComments: comments.length > 0,
    analysis: analysis,
    timestamp: new Date().toISOString()
  };
}

