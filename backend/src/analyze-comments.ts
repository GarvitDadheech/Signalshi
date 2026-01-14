import axios from 'axios';
import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables. Please check your .env file.');
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

const KALSHI_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

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

interface KalshiMarketsResponse {
  markets: KalshiMarket[];
  cursor?: string;
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

export async function analyzeComments(ticker: string, seriesTicker?: string, commentsFromPage?: string[]): Promise<CommentAnalysisResult> {
  // 1. Fetch market data
  let market: KalshiMarket | null = null;
  
  // If series_ticker is provided, fetch markets from series and find the matching one
  if (seriesTicker) {
    try {
      console.log(`[Series Lookup] Fetching markets for series: ${seriesTicker}`);
      const marketsResponse = await axios.get<KalshiMarketsResponse>(
        `${KALSHI_BASE}/markets`,
        {
          params: { series_ticker: seriesTicker },
          timeout: 10000,
          headers: {
            'User-Agent': 'Kalshi-Pulse-Bot/1.0'
          }
        }
      );
      
      const markets = marketsResponse.data.markets || [];
      console.log(`[Series Lookup] Found ${markets.length} markets in series ${seriesTicker}`);
      
      if (markets.length > 0) {
        console.log(`[Series Lookup] Sample tickers: ${markets.slice(0, 5).map(m => m.ticker).join(', ')}`);
      }
      
      // Try to find exact match first (case-insensitive)
      market = markets.find(m => 
        m.ticker.toLowerCase() === ticker.toLowerCase() ||
        m.ticker === ticker
      ) || null;
      
      if (market) {
        console.log(`[Series Lookup] ✅ Found market by exact ticker match: ${market.ticker} - ${market.title}`);
      } else {
        // Try partial match
        market = markets.find(m => 
          m.ticker.toLowerCase().includes(ticker.toLowerCase()) || 
          ticker.toLowerCase().includes(m.ticker.toLowerCase())
        ) || null;
        
        if (market) {
          console.log(`[Series Lookup] ✅ Found market by partial match: ${market.ticker} - ${market.title}`);
        } else {
          console.log(`[Series Lookup] ❌ No match found. Looking for: "${ticker}", Available tickers: ${markets.map(m => m.ticker).join(', ')}`);
        }
      }
    } catch (error: any) {
      console.error(`[Series Lookup] ❌ Error fetching markets by series:`, error.message);
      if (error.response) {
        console.error(`[Series Lookup] Response status: ${error.response.status}, data:`, error.response.data);
      }
      console.log(`[Series Lookup] Falling back to direct ticker lookup...`);
    }
  } else {
    console.log(`[Direct Lookup] No series_ticker provided, using direct ticker lookup`);
  }
  
  // If still no market found, try direct ticker lookup
  if (!market) {
    try {
      console.log(`Fetching market data from: ${KALSHI_BASE}/markets/${ticker}`);
      const marketResponse = await axios.get<KalshiMarketResponse>(
        `${KALSHI_BASE}/markets/${ticker}`,
        {
          timeout: 10000, // 10 second timeout
          headers: {
            'User-Agent': 'Kalshi-Pulse-Bot/1.0'
          }
        }
      );
      market = marketResponse.data.market;
      console.log(`Successfully fetched market: ${market.title}`);
    } catch (error: any) {
    console.error('Error fetching Kalshi market data:', error.message);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error(
        `Cannot connect to Kalshi API (${error.code}). ` +
        `Please check your internet connection and DNS settings. ` +
        `Trying to reach: ${KALSHI_BASE}/markets/${ticker}`
      );
    }
    
    if (error.response) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || errorData?.error || JSON.stringify(errorData) || 'Unknown error';
      
      console.error('Kalshi API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: errorData,
        url: `${KALSHI_BASE}/markets/${ticker}`
      });
      
      if (error.response.status === 404) {
        throw new Error(
          `Market not found (404). Ticker "${ticker}" may not exist or may be incorrect. ` +
          `Please verify the ticker from the Kalshi website. ` +
          `API Response: ${errorMessage}`
        );
      }
      
      throw new Error(
        `Kalshi API error: ${error.response.status} ${error.response.statusText}. ` +
        `Message: ${errorMessage}`
      );
    }
    
    if (error.code === 'ETIMEDOUT') {
      throw new Error('Request to Kalshi API timed out. Please try again.');
    }
    
    throw new Error(`Failed to fetch market data: ${error.message}`);
    }
  }
  
  // Ensure we have a market before proceeding
  if (!market) {
    throw new Error(
      `Market not found. Ticker "${ticker}"${seriesTicker ? ` in series "${seriesTicker}"` : ''} does not exist. ` +
      `Please verify the ticker from the Kalshi website.`
    );
  }

  // 2. Process comments from page or try API
  let comments: any[] = [];
  let commentText = '';
  let hasComments = false;

  // Use comments from page if provided
  if (commentsFromPage && commentsFromPage.length > 0) {
    console.log(`[Comments] Using ${commentsFromPage.length} comments from page HTML`);
    comments = commentsFromPage.map((text, index) => ({ 
      id: index + 1, 
      text: text, 
      comment: text,
      source: 'page'
    }));
    hasComments = true;
    
    commentText = comments
      .slice(0, 50)
      .map((c: any) => `- ${c.text || c.comment || ''}`)
      .filter((c: string) => c.length > 2)
      .join('\n');
    
    console.log(`[Comments] Processed ${comments.length} comments into text`);
  } else {
    // Fallback: Try to fetch comments from API (Kalshi may not have this endpoint)
    console.log('[Comments] No comments from page, trying API endpoints...');
    try {
      const endpoints = [
        `/markets/${market.ticker}/activity`,
        `/markets/${market.ticker}/trades`,
        `/events/${market.event_ticker}/activity`
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${KALSHI_BASE}${endpoint}`);
          if (response.data) {
            comments = response.data.activity || response.data.trades || [];
            if (comments.length > 0) {
              hasComments = true;
              break;
            }
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
        console.log(`[Comments] Found ${comments.length} comments from API`);
      }
    } catch (error) {
      console.log('[Comments] No comments API available');
    }
  }

  // 3. If no comments, generate analysis based on market metrics
  if (!commentText || comments.length === 0) {
    console.log('[Comments] No comments found, using market metrics fallback');
    commentText = `No public comments available for this market. Analysis based on market metrics:
- Current price: ${market.last_price}%
- Volume: ${market.volume} contracts
- Open interest: ${market.open_interest} contracts
- Bid-ask spread: ${market.yes_ask - market.yes_bid} points`;
    hasComments = false;
  }

  // 4. Build OpenAI prompt
  const bidAskSpread = market.yes_ask - market.yes_bid;
  const spreadPercentage = ((bidAskSpread / market.last_price) * 100).toFixed(2);
  
  const prompt = `
You are analyzing a Kalshi prediction market based on community sentiment and market dynamics.

MARKET CONTEXT:
- Market Title: "${market.title}"
- Current Probability (YES): ${market.last_price}%
- Volume: ${market.volume} contracts
- Open Interest: ${market.open_interest} contracts
- Bid-Ask Spread: ${bidAskSpread} points (${spreadPercentage}% of price)
  - YES Bid: ${market.yes_bid}%
  - YES Ask: ${market.yes_ask}%

COMMUNITY DISCUSSION:
${commentText}

ANALYSIS TASK:
Perform a comprehensive sentiment analysis of the community discussion. Consider:
1. The strength and frequency of arguments on each side
2. The quality and credibility of reasoning presented
3. Emotional indicators (fear, greed, confidence, uncertainty)
4. Consensus vs. disagreement patterns
5. How sentiment aligns or diverges from current market price

Provide your analysis in the following structured format:

**Overall Sentiment:** 
[Bullish/Bearish/Mixed/Neutral] - Provide a percentage breakdown if determinable (e.g., "Mixed: 60% Bullish, 30% Bearish, 10% Neutral")

**Top Bull Arguments (YES will occur):**
- [List 3-5 main bullish points with brief context]
- Rank by frequency and strength of support in comments

**Top Bear Arguments (NO will occur):**
- [List 3-5 main bearish points with brief context]
- Rank by frequency and strength of support in comments

**Community Confidence Level:** 
[High/Medium/Low] - Explain why based on:
- Consensus level among participants
- Quality of reasoning presented
- Volume and engagement of discussion

**Notable Disagreements & Key Debates:**
- [Identify 2-3 key points where community views significantly differ]
- Explain what each side is arguing

**Sentiment vs. Price Analysis:**
- Does community sentiment align with current market price (${market.last_price}%)?
- Are there contrarian signals or consensus divergences?
- What does the bid-ask spread (${bidAskSpread} points) suggest about market uncertainty?

**Risk Factors Mentioned:**
- [List any risks, edge cases, or uncertainties discussed by the community]

Keep the analysis objective, data-driven, and actionable. Focus on extracting genuine insights from the discussion rather than generic statements.`;

  // 5. Call OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert sentiment analyst specializing in prediction markets. You analyze community discussions, market dynamics, and trading behavior to provide objective, actionable insights. You understand market microstructure, bid-ask spreads, volume patterns, and how sentiment translates to trading decisions. Always be precise, data-driven, and avoid generic statements.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.6,
    max_tokens: 1000
  });

  const analysis = completion.choices[0].message.content || 'Analysis unavailable';

  // 6. Return structured response
  return {
    ticker,
    title: market.title,
    currentPrice: market.last_price,
    commentCount: comments.length,
    hasComments: hasComments,
    analysis: analysis,
    timestamp: new Date().toISOString()
  };
}

