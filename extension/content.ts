console.log('🚀 Kalshi Pulse extension loaded');

const BACKEND_URL = 'http://localhost:3000';

interface MarketAnalysisData {
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

interface CommentAnalysisData {
  ticker: string;
  title: string;
  currentPrice: number;
  commentCount: number;
  hasComments: boolean;
  analysis: string;
  timestamp: string;
}

// Wait for page to fully load
window.addEventListener('load', () => {
  setTimeout(injectButtons, 1000);
});

function injectButtons(): void {
  // Try to find a good container on the page
  const container = 
    document.querySelector('[data-testid="market-header"]') ||
    document.querySelector('.market-header') ||
    document.querySelector('h1')?.parentElement;

  if (!container) {
    console.log('Container not found, retrying...');
    setTimeout(injectButtons, 1000);
    return;
  }

  // Check if already injected
  if (document.querySelector('.kalshi-pulse-buttons')) {
    return;
  }

  // Create button container
  const btnContainer = document.createElement('div');
  btnContainer.className = 'kalshi-pulse-buttons';

  // Button 1: Analyze Market
  const analyzeMarketBtn = document.createElement('button');
  analyzeMarketBtn.className = 'kalshi-pulse-btn';
  analyzeMarketBtn.innerHTML = '🧠 Analyze Market';
  analyzeMarketBtn.onclick = () => handleAnalyzeMarket(analyzeMarketBtn);

  // Button 2: Analyze Comments
  const analyzeCommentsBtn = document.createElement('button');
  analyzeCommentsBtn.className = 'kalshi-pulse-btn';
  analyzeCommentsBtn.innerHTML = '💬 Analyze Comments';
  analyzeCommentsBtn.onclick = () => handleAnalyzeComments(analyzeCommentsBtn);

  btnContainer.appendChild(analyzeMarketBtn);
  btnContainer.appendChild(analyzeCommentsBtn);

  container.appendChild(btnContainer);
  console.log('✅ Buttons injected');
}

function extractTicker(): string | null {
  const match = window.location.pathname.match(/\/markets\/([A-Z0-9-]+)/);
  return match ? match[1] : null;
}

async function handleAnalyzeMarket(btn: HTMLButtonElement): Promise<void> {
  const ticker = extractTicker();
  if (!ticker) {
    alert('Could not extract ticker from URL');
    return;
  }

  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Analyzing...';
  btn.disabled = true;

  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze-market`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: MarketAnalysisData = await response.json();
    showModal('Market Analysis', data, 'market');
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    alert(`Error analyzing market: ${errorMessage}`);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

async function handleAnalyzeComments(btn: HTMLButtonElement): Promise<void> {
  const ticker = extractTicker();
  if (!ticker) {
    alert('Could not extract ticker from URL');
    return;
  }

  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Analyzing...';
  btn.disabled = true;

  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze-comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: CommentAnalysisData = await response.json();
    showModal('Comment Sentiment', data, 'comments');
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    alert(`Error analyzing comments: ${errorMessage}`);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

function showModal(
  title: string, 
  data: MarketAnalysisData | CommentAnalysisData, 
  type: 'market' | 'comments'
): void {
  // Remove existing modal if any
  const existing = document.querySelector('.kalshi-pulse-overlay');
  if (existing) existing.remove();

  // Create modal
  const overlay = document.createElement('div');
  overlay.className = 'kalshi-pulse-overlay';

  const modal = document.createElement('div');
  modal.className = 'kalshi-pulse-modal';

  // Build HTML content
  let html = `
    <button class="close-btn">×</button>
    <h2>${title}</h2>
    <h3>${data.title}</h3>
  `;

  if (type === 'market') {
    const marketData = data as MarketAnalysisData;
    html += `
      <div class="price-info">
        <div>Current: <strong>${marketData.currentPrice}%</strong></div>
        <div>Previous (24h): <strong>${marketData.previousPrice}%</strong></div>
        <div class="change ${marketData.priceChange >= 0 ? 'positive' : 'negative'}">
          Change: ${marketData.priceChange >= 0 ? '↑' : '↓'} ${Math.abs(marketData.priceChange).toFixed(1)}%
        </div>
      </div>
    `;
  } else {
    const commentData = data as CommentAnalysisData;
    html += `
      <div class="comment-info">
        ${commentData.hasComments 
          ? `📊 ${commentData.commentCount} comments analyzed` 
          : '⚠️ No public comments available - analysis based on market metrics'}
      </div>
    `;
  }

  html += `
    <div class="analysis-content">
      ${formatMarkdown(data.analysis)}
    </div>
  `;

  modal.innerHTML = html;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close handlers
  const closeBtn = modal.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => overlay.remove());
  }
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  
  const escapeHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/- (.+)/g, '<li>$1</li>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

