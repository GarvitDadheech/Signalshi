import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { analyzeMarket } from './analyze-market';
import { analyzeComments } from './analyze-comments';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins (for ngrok and localhost)
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

// Handle ngrok browser warning
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

app.use(express.json());

// Endpoint 1: Analyze Market
app.post('/api/analyze-market', async (req: Request, res: Response) => {
  const { ticker, series_ticker } = req.body;

  console.log('Received request:', { ticker, series_ticker });

  if (!ticker) {
    return res.status(400).json({ 
      error: 'ticker is required' 
    });
  }

  try {
    console.log(`Analyzing market: ticker="${ticker}"${series_ticker ? `, series_ticker="${series_ticker}"` : ' (no series_ticker provided)'}`);
    const result = await analyzeMarket(ticker, series_ticker);
    return res.json(result);
  } catch (error) {
    console.error('Error analyzing market:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      error: errorMessage 
    });
  }
});

// Endpoint 2: Analyze Comments
app.post('/api/analyze-comments', async (req: Request, res: Response) => {
  const { ticker, series_ticker, comments } = req.body;

  console.log('Received comment analysis request:', { 
    ticker, 
    series_ticker, 
    commentCount: comments?.length || 0 
  });

  if (!ticker) {
    return res.status(400).json({ 
      error: 'ticker is required' 
    });
  }

  try {
    console.log(`Analyzing comments for: ${ticker}${series_ticker ? ` (series: ${series_ticker})` : ''}`);
    const result = await analyzeComments(ticker, series_ticker, comments);
    return res.json(result);
  } catch (error) {
    console.error('Error analyzing comments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      error: errorMessage 
    });
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  return res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

// Test Kalshi API connectivity
app.get('/test-kalshi', async (req: Request, res: Response) => {
  const axios = require('axios');
  const KALSHI_BASE = 'https://api.elections.kalshi.com/trade-api/v2';
  
  try {
    // Try to fetch a known market
    const response = await axios.get(`${KALSHI_BASE}/markets/INXD-26JAN15-T5800`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Kalshi-Pulse-Bot/1.0'
      }
    });
    
    return res.json({
      status: 'success',
      message: 'Kalshi API is reachable',
      data: response.data
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: 'Cannot reach Kalshi API',
      error: {
        code: error.code,
        message: error.message,
        hostname: error.hostname || 'api.kalshi.com'
      },
      troubleshooting: {
        checkInternet: 'Verify your internet connection',
        checkDNS: 'Try: nslookup api.kalshi.com or ping api.kalshi.com',
        checkFirewall: 'Ensure firewall is not blocking outbound HTTPS connections',
        checkProxy: 'If behind a proxy, configure axios to use it'
      }
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

