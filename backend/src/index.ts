import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { analyzeMarket } from './analyze-market';
import { analyzeComments } from './analyze-comments';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint 1: Analyze Market
app.post('/api/analyze-market', async (req: Request, res: Response) => {
  const { ticker } = req.body;

  if (!ticker) {
    return res.status(400).json({ 
      error: 'ticker is required' 
    });
  }

  try {
    console.log(`Analyzing market: ${ticker}`);
    const result = await analyzeMarket(ticker);
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
  const { ticker } = req.body;

  if (!ticker) {
    return res.status(400).json({ 
      error: 'ticker is required' 
    });
  }

  try {
    console.log(`Analyzing comments for: ${ticker}`);
    const result = await analyzeComments(ticker);
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

