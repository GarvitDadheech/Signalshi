# Kalshi Pulse

AI-powered analysis for Kalshi prediction markets - Chrome extension with Express.js backend.

## Project Structure

```
Signalshi/
├── backend/          # Express.js TypeScript backend
│   ├── src/
│   │   ├── index.ts              # Express server
│   │   ├── analyze-market.ts     # Market analysis endpoint
│   │   └── analyze-comments.ts   # Comment sentiment endpoint
│   ├── package.json
│   └── tsconfig.json
└── extension/        # Chrome extension (Manifest v3)
    ├── manifest.json
    ├── content.ts    # Content script (TypeScript)
    ├── content.js    # Compiled JavaScript (generated)
    ├── styles.css
    └── package.json
```

## Setup

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in `backend/` directory:
```bash
OPENAI_API_KEY=sk-proj-your-key-here
NEWS_API_KEY=your-newsapi-key-here
PORT=3000
NODE_ENV=development
```

4. Run the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Extension Setup

1. Navigate to extension directory:
```bash
cd extension
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript content script:
```bash
npm run build
```

This compiles `content.ts` to `content.js`.

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `extension/` folder

## Usage

1. Start the backend server (`npm run dev` in `backend/`)
2. Load the extension in Chrome
3. Navigate to any Kalshi market page (e.g., `https://kalshi.com/markets/INXD-26JAN15-T5800`)
4. You'll see two buttons:
   - **🧠 Analyze Market** - AI analysis using market data + news
   - **💬 Analyze Comments** - AI sentiment of community discussion

## API Endpoints

### POST `/api/analyze-market`
Analyzes a market using Kalshi API data, news articles, and OpenAI.

**Request:**
```json
{
  "ticker": "INXD-26JAN15-T5800"
}
```

**Response:**
```json
{
  "ticker": "INXD-26JAN15-T5800",
  "title": "Will the S&P 500 close above 5,800 on January 15, 2026?",
  "currentPrice": 63,
  "previousPrice": 58,
  "priceChange": 8.6,
  "volume24h": 3240,
  "category": "Economics",
  "closeTime": "2026-01-15T21:00:00Z",
  "analysis": "...",
  "newsCount": 5,
  "timestamp": "2026-01-12T10:30:00Z"
}
```

### POST `/api/analyze-comments`
Analyzes community sentiment for a market.

**Request:**
```json
{
  "ticker": "INXD-26JAN15-T5800"
}
```

### GET `/health`
Health check endpoint.

## Development

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production build

### Extension
- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode for development

## Environment Variables

- `OPENAI_API_KEY` - Required. Get from https://platform.openai.com
- `NEWS_API_KEY` - Optional. Get from https://newsapi.org/register
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Notes

- The extension requires the backend to be running on `http://localhost:3000`
- Kalshi API doesn't require authentication for public market data
- If NewsAPI key is not provided, market analysis will work but without news context
- Comment analysis may fall back to market metrics if Kalshi doesn't expose comments API

