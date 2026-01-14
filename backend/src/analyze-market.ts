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
  series_ticker?: string;
  market_type: string;
  title: string;
  subtitle: string;
  yes_sub_title: string;
  no_sub_title: string;
  created_time: string;
  open_time: string;
  close_time: string;
  expiration_time: string;
  latest_expiration_time: string;
  expected_expiration_time: string;
  settlement_timer_seconds: number;
  status: string;
  response_price_units: string;
  yes_bid: number;
  yes_bid_dollars: string;
  yes_ask: number;
  yes_ask_dollars: string;
  no_bid: number;
  no_bid_dollars: string;
  no_ask: number;
  no_ask_dollars: string;
  last_price: number;
  last_price_dollars: string;
  previous_price: number;
  previous_price_dollars: string;
  previous_yes_bid: number;
  previous_yes_bid_dollars: string;
  previous_yes_ask: number;
  previous_yes_ask_dollars: string;
  volume: number;
  volume_24h: number;
  result: string;
  can_close_early: boolean;
  open_interest: number;
  notional_value: number;
  notional_value_dollars: string;
  liquidity: number;
  liquidity_dollars: string;
  expiration_value: string;
  tick_size: number;
  rules_primary: string;
  rules_secondary: string;
  price_level_structure: string;
  price_ranges: Array<{
    start: string;
    end: string;
    step: string;
  }>;
  settlement_value?: number;
  settlement_value_dollars?: string;
  settlement_ts?: string;
  fee_waiver_expiration_time?: string;
  early_close_condition: string;
  strike_type?: string;
  floor_strike?: number;
  cap_strike?: number;
  functional_strike?: string;
  custom_strike?: any;
  mve_collection_ticker?: string;
  mve_selected_legs?: any[];
  primary_participant_key?: string;
  is_provisional?: boolean;
  category?: string;
}

interface KalshiMarketResponse {
  market: KalshiMarket;
}

interface KalshiMarketsResponse {
  markets: KalshiMarket[];
  cursor?: string;
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

export async function analyzeMarket(ticker: string, seriesTicker?: string): Promise<MarketAnalysisResult> {
  // 1. Fetch current market data from Kalshi
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
        // Try partial match (in case ticker format differs, e.g., "KXSB-26" vs "KXSB-26-SEA")
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
    console.log(`[Direct Lookup] Attempting direct ticker lookup for: "${ticker}"`);
    // Try different ticker formats
    const tickerVariants = [
      ticker,                    // Original ticker
      ticker.toUpperCase(),      // Uppercase
      ticker.toLowerCase(),      // Lowercase
    ];
    
    // Remove duplicates
    const uniqueVariants = [...new Set(tickerVariants)];
    
    let lastError: any = null;
    
    for (const tickerVariant of uniqueVariants) {
      try {
        console.log(`[Direct Lookup] Trying: ${KALSHI_BASE}/markets/${tickerVariant}`);
  const marketResponse = await axios.get<KalshiMarketResponse>(
          `${KALSHI_BASE}/markets/${tickerVariant}`,
          {
            timeout: 10000, // 10 second timeout
            headers: {
              'User-Agent': 'Kalshi-Pulse-Bot/1.0'
            }
          }
        );
        market = marketResponse.data.market;
        console.log(`[Direct Lookup] ✅ Successfully fetched market: ${market.ticker} - ${market.title}`);
        break; // Success, exit loop
      } catch (error: any) {
        lastError = error;
        // If it's not a 404, throw immediately (network error, etc.)
        if (error.response?.status !== 404) {
          throw error;
        }
        // If it's 404, try next variant
        console.log(`[Direct Lookup] ❌ Ticker variant "${tickerVariant}" not found (404), trying next...`);
        continue;
      }
    }
    
    // If we exhausted all variants and still no market found
    if (!market) {
    const error: any = lastError;
    console.error('Error fetching Kalshi market data:', error.message);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error(
        `Cannot connect to Kalshi API (${error.code}). ` +
        `Please check your internet connection and DNS settings. ` +
        `Trying to reach: ${KALSHI_BASE}/markets/${ticker}`
      );
    }
    
    if (error.response) {
      // API returned an error response
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

  // 2. Fetch 24-hour price history
  const endTs = Math.floor(Date.now() / 1000);
  const startTs = endTs - (24 * 60 * 60);

  let history: HistoryPoint[] = [];
  let previousPrice = market.last_price;

  try {
    const historyTicker = market.ticker; // Use the actual market ticker from API
    console.log(`[History] Fetching price history for: ${historyTicker}`);
    const historyResponse = await axios.get<KalshiHistoryResponse>(
      `${KALSHI_BASE}/markets/${historyTicker}/history`,
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

  // 3. Generate news search keywords using OpenAI
  let newsKeywords = '';
  try {
    console.log('[OpenAI] Generating news search keywords...');
    const keywordPrompt = `You are a news search expert. Given this prediction market question, generate 3-5 specific search keywords or phrases that would help find relevant recent news articles.

Market Question: "${market.title}"
${market.subtitle ? `Subtitle: "${market.subtitle}"` : ''}
${market.yes_sub_title ? `YES Outcome: "${market.yes_sub_title}"` : ''}
${market.no_sub_title ? `NO Outcome: "${market.no_sub_title}"` : ''}
${market.rules_primary ? `Rules: "${market.rules_primary}"` : ''}

Generate search keywords that:
1. Are specific and relevant to the market question
2. Would appear in recent news headlines or articles
3. Include key entities (people, places, organizations, events)
4. Avoid generic words like "will", "the", "be"
5. Focus on what's newsworthy about this topic

Return ONLY a comma-separated list of keywords/phrases (max 5), nothing else. Example: "Seattle Seahawks, Super Bowl 2026, NFL championship, Seattle football team"`;

    const keywordCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a news search expert. Generate specific, relevant search keywords for finding news articles.'
        },
        {
          role: 'user',
          content: keywordPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    newsKeywords = keywordCompletion.choices[0].message.content?.trim() || '';
    console.log(`[OpenAI] Generated keywords: ${newsKeywords}`);
    
    // Fallback to manual extraction if OpenAI fails
    if (!newsKeywords || newsKeywords.length < 5) {
      console.log('[OpenAI] Keywords too short, using fallback extraction');
      const fallbackKeywords = extractKeywords(market.title);
      const additionalKeywords = [
        market.subtitle,
        market.yes_sub_title,
        market.no_sub_title
      ].filter(Boolean).join(' ');
      newsKeywords = `${fallbackKeywords} ${additionalKeywords}`.trim();
    }
  } catch (error: any) {
    console.error('[OpenAI] Error generating keywords:', error.message);
    // Fallback to manual extraction
    const fallbackKeywords = extractKeywords(market.title);
    const additionalKeywords = [
      market.subtitle,
      market.yes_sub_title,
      market.no_sub_title
    ].filter(Boolean).join(' ');
    newsKeywords = `${fallbackKeywords} ${additionalKeywords}`.trim();
  }

  // 4. Fetch relevant news
  let articles: NewsArticle[] = [];
  let newsText = 'No recent news found';

  if (process.env.NEWS_API_KEY) {
    try {
      // Clean and format keywords for News API
      // Remove commas, split into terms, and join with OR for better matching
      const cleanedKeywords = newsKeywords
        .replace(/,/g, ' ')
        .split(/\s+/)
        .filter(term => term.length > 2)
        .slice(0, 5) // Limit to 5 terms
        .join(' OR ');
      
      console.log(`[News API] Fetching news for keywords: ${cleanedKeywords}`);
      const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Last 7 days
      const toDate = new Date().toISOString().split('T')[0];
      
      const newsResponse = await axios.get<NewsResponse>(
        'https://newsapi.org/v2/everything',
        {
          params: {
            q: cleanedKeywords,
            from: fromDate,
            to: toDate,
            language: 'en',
            sortBy: 'popularity',
            pageSize: 20,
            apiKey: process.env.NEWS_API_KEY
          }
        }
      );

      articles = newsResponse.data.articles || [];
      console.log(`[News API] Found ${articles.length} articles`);
      
      if (articles.length > 0) {
        // Include more detailed news information
        newsText = articles
          .slice(0, 10)
          .map((article, i) => {
            const date = new Date(article.publishedAt).toLocaleString();
            return `${i + 1}. **${article.title}**\n   Source: ${article.source.name} | Published: ${date}\n   ${article.description ? `Description: ${article.description.substring(0, 200)}...` : ''}\n   URL: ${article.url}`;
          })
          .join('\n\n');
      } else {
        newsText = 'No recent news articles found matching the market keywords.';
      }
    } catch (error: any) {
      console.error('[News API] Error fetching news:', error.message);
      if (error.response) {
        console.error('[News API] Response:', error.response.status, error.response.data);
      }
      newsText = `News API error: ${error.message}. Analysis will proceed without recent news context.`;
    }
  } else {
    console.log('[News API] NEWS_API_KEY not found in environment variables');
    newsText = 'News API key not configured. Analysis will proceed without recent news context.';
  }

  // 5. Build OpenAI prompt
  const bidAskSpread = market.yes_ask - market.yes_bid;
  const noBidAskSpread = market.no_ask - market.no_bid;
  const spreadPercentage = ((bidAskSpread / market.last_price) * 100).toFixed(2);
  const liquidityScore = market.liquidity > 10000 ? 'High' : market.liquidity > 1000 ? 'Medium' : 'Low';
  
  // Calculate price volatility from history
  let volatility = 'N/A';
  if (history.length > 1) {
    const prices = history.map(h => h.close);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    volatility = stdDev.toFixed(2);
  }
  
  const timeToClose = new Date(market.close_time).getTime() - Date.now();
  const hoursToClose = Math.floor(timeToClose / (1000 * 60 * 60));
  const daysToClose = Math.floor(hoursToClose / 24);
  
  // Build comprehensive prompt with ALL market data
  const prompt = `
You are analyzing a Kalshi prediction market to understand price movements, market dynamics, and underlying factors.

═══════════════════════════════════════════════════════════════
COMPLETE MARKET DATA
═══════════════════════════════════════════════════════════════

MARKET IDENTIFICATION:
- Ticker: ${market.ticker}
- Event Ticker: ${market.event_ticker}
${market.series_ticker ? `- Series Ticker: ${market.series_ticker}` : ''}
- Market Type: ${market.market_type}
- Status: ${market.status}

MARKET QUESTION & RULES:
- Title: "${market.title}"
${market.subtitle ? `- Subtitle: "${market.subtitle}"` : ''}
- YES Outcome: ${market.yes_sub_title || 'Yes'}
- NO Outcome: ${market.no_sub_title || 'No'}
- Primary Rules: ${market.rules_primary || 'N/A'}
${market.rules_secondary ? `- Secondary Rules: ${market.rules_secondary}` : ''}
${market.early_close_condition ? `- Early Close Condition: ${market.early_close_condition}` : ''}

PRICING & PROBABILITY:
- Current Probability (YES): ${market.last_price}% (${market.last_price_dollars})
- Previous Probability: ${previousPrice}% (${market.previous_price_dollars || 'N/A'})
- Price Change: ${priceChange >= 0 ? '+' : ''}${priceChange}% (${priceChange > 0 ? '↑ Increased' : priceChange < 0 ? '↓ Decreased' : '→ Stable'})

BID-ASK SPREADS:
- YES Side:
  * Bid: ${market.yes_bid}% (${market.yes_bid_dollars})
  * Ask: ${market.yes_ask}% (${market.yes_ask_dollars})
  * Spread: ${bidAskSpread} points (${spreadPercentage}% of price)
- NO Side:
  * Bid: ${market.no_bid}% (${market.no_bid_dollars})
  * Ask: ${market.no_ask}% (${market.no_ask_dollars})
  * Spread: ${noBidAskSpread} points
- Previous YES Bid: ${market.previous_yes_bid}% (${market.previous_yes_bid_dollars})
- Previous YES Ask: ${market.previous_yes_ask}% (${market.previous_yes_ask_dollars})

VOLUME & LIQUIDITY:
- Total Volume: ${market.volume.toLocaleString()} contracts
- Volume (24h): ${market.volume_24h?.toLocaleString() || market.volume.toLocaleString()} contracts
- Open Interest: ${market.open_interest.toLocaleString()} contracts
- Liquidity: ${market.liquidity.toLocaleString()} (${market.liquidity_dollars}) - ${liquidityScore} liquidity
- Notional Value: ${market.notional_value.toLocaleString()} (${market.notional_value_dollars})

TIMING & EXPIRATION:
- Created: ${new Date(market.created_time).toLocaleString()}
- Opened: ${new Date(market.open_time).toLocaleString()}
- Closes: ${new Date(market.close_time).toLocaleString()}
- Expiration: ${new Date(market.expiration_time).toLocaleString()}
- Expected Expiration: ${new Date(market.expected_expiration_time).toLocaleString()}
- Latest Expiration: ${new Date(market.latest_expiration_time).toLocaleString()}
- Time Remaining: ${daysToClose > 0 ? `${daysToClose} days, ${hoursToClose % 24} hours` : `${hoursToClose} hours`}
- Settlement Timer: ${market.settlement_timer_seconds} seconds
- Can Close Early: ${market.can_close_early ? 'Yes' : 'No'}
${market.fee_waiver_expiration_time ? `- Fee Waiver Expires: ${new Date(market.fee_waiver_expiration_time).toLocaleString()}` : ''}

MARKET STRUCTURE:
- Price Level Structure: ${market.price_level_structure}
- Response Price Units: ${market.response_price_units}
- Tick Size: ${market.tick_size}
- Price Ranges: ${JSON.stringify(market.price_ranges)}
${market.strike_type ? `- Strike Type: ${market.strike_type}` : ''}
${market.floor_strike !== undefined ? `- Floor Strike: ${market.floor_strike}` : ''}
${market.cap_strike !== undefined ? `- Cap Strike: ${market.cap_strike}` : ''}
${market.functional_strike ? `- Functional Strike: ${market.functional_strike}` : ''}
${market.custom_strike ? `- Custom Strike: ${JSON.stringify(market.custom_strike)}` : ''}

SETTLEMENT & RESULT:
- Current Result: ${market.result || 'Pending'}
${market.settlement_value !== undefined ? `- Settlement Value: ${market.settlement_value} (${market.settlement_value_dollars})` : ''}
${market.settlement_ts ? `- Settlement Timestamp: ${new Date(market.settlement_ts).toLocaleString()}` : ''}
- Expiration Value: ${market.expiration_value || 'N/A'}

PRICE HISTORY CONTEXT:
${history.length > 0 ? `
- 24h High: ${Math.max(...history.map(h => h.high)).toFixed(1)}%
- 24h Low: ${Math.min(...history.map(h => h.low)).toFixed(1)}%
- Opening Price (24h ago): ${history[0].open.toFixed(1)}%
- Current Price: ${market.last_price}%
- Price Volatility (24h): ${volatility}%
- Data Points: ${history.length} intervals
` : '- Limited price history available'}

ADDITIONAL MARKET DATA:
${market.mve_collection_ticker ? `- MVE Collection: ${market.mve_collection_ticker}` : ''}
${market.is_provisional !== undefined ? `- Is Provisional: ${market.is_provisional}` : ''}
${market.primary_participant_key ? `- Primary Participant: ${market.primary_participant_key}` : ''}

═══════════════════════════════════════════════════════════════
RECENT NEWS & EVENTS (${articles.length} articles found)
═══════════════════════════════════════════════════════════════
${newsText}

ANALYSIS TASK:
Provide a comprehensive analysis explaining the market's price movement and current dynamics. Consider:

1. **Price Movement Analysis**: Why did the probability ${priceChange > 0 ? 'increase' : priceChange < 0 ? 'decrease' : 'remain stable'}? What specific factors drove this change?

2. **News Impact**: How do recent news events relate to the price movement? Are there information gaps or delayed reactions?

3. **Market Structure**: What does the bid-ask spread, liquidity, and volume tell us about market efficiency and trader confidence?

4. **Timing Considerations**: How does the time remaining until market close affect the analysis? Are there upcoming events or deadlines that could impact the outcome?

5. **Risk Assessment**: What are the key uncertainties and edge cases that could affect the outcome?

Provide your analysis in the following structured format:

**Primary Driver:**
[1-2 sentences explaining the main reason for the price movement, referencing specific news events or market dynamics]

**Bull Case (YES will occur)** 🟢:
- [3-5 detailed bullet points supporting YES outcome]
- Include specific evidence from news, market metrics, or logical reasoning
- Rank by strength and likelihood

**Bear Case (NO will occur)** 🔴:
- [3-5 detailed bullet points supporting NO outcome]
- Include specific evidence from news, market metrics, or logical reasoning
- Rank by strength and likelihood

**Market Dynamics & Technical Factors:**
- Liquidity Analysis: ${liquidityScore} liquidity suggests [interpretation]
- Spread Analysis: ${bidAskSpread} point spread indicates [interpretation]
- Volume Analysis: ${market.volume_24h || market.volume} contracts suggests [interpretation]
- Open Interest: ${market.open_interest} contracts indicates [interpretation]

**Key Risk Factors:**
- [List 3-5 specific risks, edge cases, or uncertainties that could affect the outcome]
- Include timing risks, information risks, and structural risks

**Confidence Assessment:**
[High/Medium/Low] - Explain why based on:
- Quality and recency of news sources
- Market liquidity and efficiency indicators
- Clarity of the question and outcome criteria
- Time remaining until resolution

**Actionable Insights:**
- What should traders watch for in the coming hours/days?
- Are there any contrarian signals or market inefficiencies?
- What would need to happen for the price to move significantly?

Keep the analysis detailed, evidence-based, and actionable. Connect market metrics to underlying fundamentals and news events.`;

  // 6. Call OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert prediction market analyst with deep knowledge of market microstructure, information flow, and trading dynamics. You analyze markets by connecting price movements to underlying fundamentals, news events, and market structure indicators. You understand bid-ask spreads, liquidity, volume patterns, open interest, and how these metrics reflect market efficiency and trader sentiment. You provide detailed, evidence-based analysis that helps traders make informed decisions. Always be precise, data-driven, and avoid generic statements. Focus on actionable insights.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 2000
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
    category: market.category || 'Unknown',
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
    'as', 'from', 'this', 'that', 'these', 'those',
    'win', 'wins', 'winning', 'championship', 'championships'
  ];

  // Extract meaningful keywords
  const words = marketTitle
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length > 2 && 
      !stopWords.includes(word) &&
      !isNaN(Number(word)) === false // Keep numbers that might be years
    );

  // Prioritize longer, more specific terms
  const keywords = words
    .sort((a, b) => b.length - a.length)
    .slice(0, 8)
    .join(' OR ');

  return keywords || marketTitle.substring(0, 100);
}

