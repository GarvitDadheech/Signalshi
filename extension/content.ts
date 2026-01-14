console.log('🚀 Kalshi Pulse extension loaded');

const BACKEND_URL = 'https://alysha-dustier-rosita.ngrok-free.dev';

// Check if we're on a specific market page (not a category page)
function isMarketPage(): boolean {
  const pathname = window.location.pathname;
  
  // Only show on specific market URLs like /markets/kxpresperson/pres-person/kxpresperson-28
  // NOT on category pages like /category/all or /category/politics
  // NOT on /markets/ without a specific market
  
  // Check if it's a category page
  if (pathname.startsWith('/category/')) {
    console.log('❌ Category page detected, skipping button injection');
    return false;
  }
  
  // Check if it's a specific market page
  // Pattern: /markets/{series}/{category}/{ticker}
  // Example: /markets/kxpresperson/pres-person/kxpresperson-28
  const marketPattern = /^\/markets\/[^\/]+\/[^\/]+\/[^\/]+$/;
  
  if (marketPattern.test(pathname)) {
    console.log('✅ Specific market page detected');
    return true;
  }
  
  // Also check for /sports/ pattern (like the example provided)
  const sportsPattern = /^\/sports\/[^\/]+\/[^\/]+\/[^\/]+$/;
  if (sportsPattern.test(pathname)) {
    console.log('✅ Sports market page detected');
    return true;
  }
  
  console.log('❌ Not a specific market page, skipping button injection');
  return false;
}

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

// Find the container where we should inject buttons (below the headings)
function findHeadingContainer(): HTMLElement | null {
  // Use the specific selector provided by the user
  // This targets the div containing the h1 heading
  const selectors = [
    // Primary selector: the div containing the h1 and breadcrumbs
    '#top-level-layout > div.h-full.w-screen.box-border.md\\:w-full.min-h-\\[90vh\\] > div:nth-child(2) > div > div > div > div > div > div.flex-col.w-full.z-\\[2\\].bg-surface-x10.box-border.px-3.mb-3.sm\\:mb-2.flex > div.flex.justify-between.items-center.box-border.w-full > div.flex.gap-3 > div:nth-child(1)',
    // Alternative: the parent flex container
    '#top-level-layout > div.h-full.w-screen.box-border.md\\:w-full.min-h-\\[90vh\\] > div:nth-child(2) > div > div > div > div > div > div.flex-col.w-full.z-\\[2\\].bg-surface-x10.box-border.px-3.mb-3.sm\\:mb-2.flex > div.flex.justify-between.items-center.box-border.w-full > div.flex.gap-3',
    // More flexible: find the div containing h1 with the breadcrumbs
    'div.flex.flex-col.justify-center.gap-0\\.5.w-full.mr-3',
    // Fallback: find h1 and get its parent container
    'h1',
  ];

  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`✅ Found heading container with selector: ${selector}`);
        
        // If we found the h1, get its parent container (the div with flex-col)
        if (element.tagName === 'H1') {
          const parent = element.closest('div.flex.flex-col.justify-center.gap-0\\.5');
          if (parent) {
            return parent as HTMLElement;
          }
          // If not found, get the parent of h1's parent
          const h1Parent = element.parentElement;
          if (h1Parent) {
            const grandParent = h1Parent.parentElement;
            if (grandParent && grandParent.classList.contains('flex')) {
              return grandParent as HTMLElement;
            }
            return h1Parent as HTMLElement;
          }
        }
        
        return element as HTMLElement;
      }
    } catch (e) {
      console.log(`Selector failed: ${selector}`, e);
    }
  }

  // Fallback: Find h1 and use its parent
  const h1 = document.querySelector('h1');
  if (h1) {
    const parent = h1.parentElement;
    if (parent) {
      console.log('✅ Found container via h1 parent (fallback)');
      return parent;
    }
  }

  console.log('⚠️ Could not find heading container');
  return null;
}

function injectButtons(): void {
  // First check if we're on a market page
  if (!isMarketPage()) {
    // Remove any existing buttons if we navigated away from a market page
    const existing = document.querySelector('.kalshi-pulse-buttons');
    if (existing) {
      existing.remove();
    }
    return;
  }

  // Check if already injected
  if (document.querySelector('.kalshi-pulse-buttons')) {
    console.log('Buttons already injected, skipping...');
    return;
  }

  // Try to find the heading container div (the one with flex-col that contains h1)
  // Structure: <div class="flex flex-col justify-center gap-0.5 w-full mr-3">...</div>
  let headingContainer: HTMLElement | null = null;
  
  // Strategy 1: Find the div with the specific classes
  const headingDiv = document.querySelector('div.flex.flex-col.justify-center.gap-0\\.5.w-full.mr-3');
  if (headingDiv) {
    headingContainer = headingDiv as HTMLElement;
    console.log('✅ Found heading container via class selector');
  } else {
    // Strategy 2: Find h1 and traverse up to find the flex-col container
    const h1 = document.querySelector('h1');
    if (h1) {
      // h1 is inside a span, which is inside the flex-col div
      const span = h1.closest('span');
      if (span) {
        const flexColDiv = span.closest('div.flex.flex-col');
        if (flexColDiv) {
          headingContainer = flexColDiv as HTMLElement;
          console.log('✅ Found heading container via h1 traversal');
        }
      }
    }
  }

  if (!headingContainer) {
    console.log('⚠️ Could not find heading container, retrying...');
    // Retry after a short delay
    setTimeout(() => {
      if (!document.querySelector('.kalshi-pulse-buttons')) {
        injectButtons();
      }
    }, 1000);
    return;
  }

  const btnContainer = createButtonContainer();
  
  // Find the parent container that wraps the entire heading row
  // Structure: div.flex.justify-between.items-center (row container) > div.flex.gap-3 > div.flex.flex-col (heading)
  // We want to insert buttons after the row container, not inside it
  
  // Strategy 1: Find the row container (div.flex.justify-between.items-center)
  let rowContainer: HTMLElement | null = null;
  
  // Traverse up from heading container to find the row container
  let current: HTMLElement | null = headingContainer;
  while (current && current.parentElement) {
    const parent: HTMLElement = current.parentElement;
    // Check if parent has the justify-between class (the row container)
    if (parent.classList.contains('flex') && parent.classList.contains('justify-between')) {
      rowContainer = parent;
      console.log('✅ Found row container via traversal');
      break;
    }
    current = parent;
  }
  
  // Strategy 2: Use the specific selector to find the row container
  if (!rowContainer) {
    const rowSelector = '#top-level-layout > div.h-full.w-screen.box-border.md\\:w-full.min-h-\\[90vh\\] > div:nth-child(2) > div > div > div > div > div > div.flex-col.w-full.z-\\[2\\].bg-surface-x10.box-border.px-3.mb-3.sm\\:mb-2.flex > div.flex.justify-between.items-center.box-border.w-full';
    const foundRow = document.querySelector(rowSelector);
    if (foundRow) {
      rowContainer = foundRow as HTMLElement;
      console.log('✅ Found row container via selector');
    }
  }
  
  // Strategy 3: Find the outer flex-col container and insert after the row
  if (!rowContainer) {
    // Find the outer container (div.flex-col.w-full...)
    const outerContainer = headingContainer.closest('div.flex-col.w-full');
    if (outerContainer) {
      // Find the row container inside it
      const row = outerContainer.querySelector('div.flex.justify-between.items-center');
      if (row) {
        rowContainer = row as HTMLElement;
        console.log('✅ Found row container via outer container');
      }
    }
  }
  
  if (rowContainer && rowContainer.parentElement) {
    // Insert buttons after the row container (below the entire heading row)
    rowContainer.parentElement.insertBefore(btnContainer, rowContainer.nextSibling);
    console.log('✅ Buttons injected below heading row');
  } else {
    // Fallback: Insert after the heading container's parent (the flex gap-3 div)
    // But make sure it's in a full-width container
    const parent = headingContainer.parentElement;
    if (parent && parent.parentElement) {
      // Create a wrapper div to ensure full width
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'width: 100%;';
      wrapper.appendChild(btnContainer);
      parent.parentElement.insertBefore(wrapper, parent.nextSibling);
      console.log('✅ Buttons injected below headings (with wrapper)');
    } else {
      // Last resort: append after h1's parent span
      const h1 = headingContainer.querySelector('h1');
      if (h1 && h1.parentElement && h1.parentElement.parentElement) {
        h1.parentElement.parentElement.insertBefore(btnContainer, h1.parentElement.nextSibling);
        console.log('✅ Buttons injected after h1 parent (last resort)');
      } else {
        headingContainer.appendChild(btnContainer);
        console.log('✅ Buttons appended to heading container (last resort)');
      }
    }
  }
}

function createButtonContainer(): HTMLDivElement {
  const btnContainer = document.createElement('div');
  btnContainer.className = 'kalshi-pulse-buttons';
  btnContainer.style.cssText = 'display: flex; gap: 12px; margin: 20px 0; flex-wrap: wrap; z-index: 1000; width: 100%;';

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

  return btnContainer;
}

function createFloatingButtons(): void {
  // Create floating container
  const floatingContainer = document.createElement('div');
  floatingContainer.className = 'kalshi-pulse-buttons kalshi-pulse-floating';
  floatingContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 999999;
    background: white;
    padding: 15px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border: 2px solid #09c285;
  `;

  const btnContainer = createButtonContainer();
  btnContainer.style.cssText = 'display: flex; flex-direction: column; gap: 10px; margin: 0;';
  
  // Make buttons full width in floating mode
  const buttons = btnContainer.querySelectorAll('.kalshi-pulse-btn');
  buttons.forEach(btn => {
    (btn as HTMLElement).style.width = '100%';
    (btn as HTMLElement).style.minWidth = '200px';
  });

  floatingContainer.appendChild(btnContainer);
  document.body.appendChild(floatingContainer);
  console.log('✅ Floating buttons created');
}

// Try injecting immediately (only on market pages)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (isMarketPage()) {
      setTimeout(injectButtons, 500);
    }
  });
} else {
  if (isMarketPage()) {
    setTimeout(injectButtons, 500);
  }
}

// Also try on window load
window.addEventListener('load', () => {
  if (isMarketPage()) {
    setTimeout(injectButtons, 1000);
  }
});

// Use MutationObserver for dynamic content (SPA navigation)
const observer = new MutationObserver(() => {
  // Only inject if we're on a market page
  if (isMarketPage() && !document.querySelector('.kalshi-pulse-buttons')) {
    setTimeout(injectButtons, 500);
  } else if (!isMarketPage()) {
    // Remove buttons if we navigated away from a market page
    const existing = document.querySelector('.kalshi-pulse-buttons');
    if (existing) {
      existing.remove();
    }
  }
});

// Start observing after a short delay
setTimeout(() => {
  const targetNode = document.body || document.documentElement;
  if (targetNode) {
    observer.observe(targetNode, {
      childList: true,
      subtree: true
    });
    console.log('👀 Started observing DOM changes');
  }
}, 2000);

function extractTicker(): string | null {
  // Extract ticker from page HTML
  // Look for the pattern: <span>Market</span><span>TICKER</span>
  // Structure: <div class="flex gap-0.5"><span>Market</span><span>KXSB-26-SEA</span></div>
  
  console.log('🔍 Extracting ticker from HTML...');
  
  // Method 1: Use the specific selector provided by user
  try {
    const marketContainer = document.querySelector('#rules-section > div:nth-child(2) > div.flex.overflow-hidden.transition-all.ease-in-out.duration-\\[600ms\\].max-h-\\[500px\\].pt-1.pb-3 > div > div.flex.flex-wrap.gap-1 > div:nth-child(3)');
    if (marketContainer) {
      const marketSpan = marketContainer.querySelector('span:last-child');
      if (marketSpan) {
        const ticker = marketSpan.textContent?.trim();
        if (ticker && /^[A-Z0-9-]+$/i.test(ticker) && ticker.length >= 3) {
          console.log(`✅ Extracted ticker from specific selector: ${ticker}`);
          return ticker;
        }
      }
    }
  } catch (e) {
    console.log('Could not use specific selector, trying general method...');
  }
  
  // Method 2: Find all spans with text "Market" and get next sibling
  const allSpans = Array.from(document.querySelectorAll('span'));
  
  for (let i = 0; i < allSpans.length; i++) {
    const span = allSpans[i];
    const text = span.textContent?.trim();
    
    if (text === 'Market') {
      // Get parent div
      const parent = span.parentElement;
      if (parent) {
        // Get all children of parent
        const siblings = Array.from(parent.children);
        const marketIndex = siblings.indexOf(span);
        
        // The ticker should be the next span sibling
        if (marketIndex !== -1 && marketIndex + 1 < siblings.length) {
          const tickerSpan = siblings[marketIndex + 1];
          const ticker = tickerSpan.textContent?.trim();
          
          // Validate ticker format (alphanumeric and hyphens, at least 3 chars)
          if (ticker && /^[A-Z0-9-]+$/i.test(ticker) && ticker.length >= 3) {
            console.log(`✅ Extracted ticker from HTML (sibling method): ${ticker}`);
            return ticker;
          }
        }
      }
      
      // Alternative: Check next span in document order if they're in same parent
      if (i + 1 < allSpans.length) {
        const nextSpan = allSpans[i + 1];
        if (span.parentElement === nextSpan.parentElement) {
          const ticker = nextSpan.textContent?.trim();
          if (ticker && /^[A-Z0-9-]+$/i.test(ticker) && ticker.length >= 3) {
            console.log(`✅ Extracted ticker from HTML (next span method): ${ticker}`);
            return ticker;
          }
        }
      }
    }
  }
  
  // Method 3: Look for divs containing "Market" label
  const marketDivs = Array.from(document.querySelectorAll('div')).filter(div => {
    const text = div.textContent || '';
    return text.includes('Market') && div.querySelector('span');
  });
  
  for (const div of marketDivs) {
    const spans = Array.from(div.querySelectorAll('span'));
    for (let i = 0; i < spans.length; i++) {
      if (spans[i].textContent?.trim() === 'Market' && i + 1 < spans.length) {
        const ticker = spans[i + 1].textContent?.trim();
        if (ticker && /^[A-Z0-9-]+$/i.test(ticker) && ticker.length >= 3) {
          console.log(`✅ Extracted ticker from HTML (div method): ${ticker}`);
          return ticker;
        }
      }
    }
  }
  
  // Fallback: Try URL extraction
  console.log('⚠️ Could not extract ticker from HTML, trying URL...');
  const pathname = window.location.pathname;
  
  if (!pathname.includes('/markets/')) {
    console.log('❌ Not on a markets page');
    return null;
  }

  const segments = pathname.split('/').filter(s => s.length > 0);
  const marketsIndex = segments.indexOf('markets');
  
  if (marketsIndex === -1 || marketsIndex === segments.length - 1) {
    console.log('❌ Could not find markets segment or no ticker after it');
    return null;
  }

  const ticker = segments[segments.length - 1];
  
  if (/^[A-Z0-9-]+$/i.test(ticker)) {
    console.log(`⚠️ Extracted ticker from URL (fallback): ${ticker}`);
    return ticker;
  }

  console.log(`❌ Could not extract ticker from URL: ${ticker}`);
  return null;
}

function extractSeriesTicker(): string | null {
  // Extract series ticker from page HTML first
  // Look for: <span>Series</span><span>KXSB</span>
  
  const allSpans = Array.from(document.querySelectorAll('span'));
  
  for (let i = 0; i < allSpans.length; i++) {
    const span = allSpans[i];
    const text = span.textContent?.trim();
    
    if (text === 'Series') {
      // Check if it's in a flex container with another span
      const parent = span.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children);
        const seriesIndex = siblings.indexOf(span);
        
        if (seriesIndex !== -1 && seriesIndex + 1 < siblings.length) {
          const tickerSpan = siblings[seriesIndex + 1];
          const seriesTicker = tickerSpan.textContent?.trim();
          
          if (seriesTicker && /^[A-Z0-9-]+$/i.test(seriesTicker)) {
            console.log(`Extracted series ticker from HTML: ${seriesTicker}`);
            return seriesTicker;
          }
        }
      }
      
      // Alternative: Check next span in document order
      if (i + 1 < allSpans.length) {
        const nextSpan = allSpans[i + 1];
        if (span.parentElement === nextSpan.parentElement) {
          const seriesTicker = nextSpan.textContent?.trim();
          if (seriesTicker && /^[A-Z0-9-]+$/i.test(seriesTicker)) {
            console.log(`Extracted series ticker from HTML (sibling method): ${seriesTicker}`);
            return seriesTicker;
          }
        }
      }
    }
  }
  
  // Fallback: Extract from URL
  const pathname = window.location.pathname;
  
  if (!pathname.includes('/markets/')) {
    return null;
  }

  const segments = pathname.split('/').filter(s => s.length > 0);
  const marketsIndex = segments.indexOf('markets');
  
  if (marketsIndex === -1 || marketsIndex === segments.length - 1) {
    return null;
  }

  const seriesTicker = segments[marketsIndex + 1];
  
  if (seriesTicker && /^[A-Z0-9-]+$/i.test(seriesTicker)) {
    console.log(`Extracted series ticker from URL: ${seriesTicker}`);
    return seriesTicker;
  }

  return null;
}

function extractComments(): string[] {
  console.log('🔍 Extracting comments from HTML...');
  const comments: string[] = [];
  
  try {
    // Find the comments container - use flexible selector for dynamic class names
    // The container has class like "noScrollbar-0-2-59" or "noScrollbar-0-2-48"
    const baseSelector = '#top-level-layout > div.h-full.w-screen.box-border.md\\:w-full.min-h-\\[90vh\\] > div:nth-child(2) > div > div > div > div > div > div.flex.flex-col.gap-7 > div.flex.flex-col.gap-7.w-full > div:nth-child(3) > div > div > section > div > div:nth-child(2)';
    
    // Try to find container with flexible class matching
    let commentsContainer: Element | null = null;
    
    // Method 1: Try exact selector first
    const exactContainer = document.querySelector(`${baseSelector} > div.noScrollbar-0-2-59`);
    if (exactContainer) {
      commentsContainer = exactContainer;
      console.log('✅ Found comments container (exact match)');
    } else {
      // Method 2: Find any div with noScrollbar class in that location
      const parent = document.querySelector(baseSelector);
      if (parent) {
        const noScrollbarDivs = parent.querySelectorAll('div[class*="noScrollbar"]');
        if (noScrollbarDivs.length > 0) {
          commentsContainer = noScrollbarDivs[0];
          console.log(`✅ Found comments container (flexible match): ${commentsContainer.className}`);
        }
      }
    }
    
    if (commentsContainer) {
      // Get all direct child divs (comments are in div:nth-child(1), div:nth-child(2), div:nth-child(5), etc.)
      const commentDivs = Array.from(commentsContainer.children).filter(
        child => child.tagName === 'DIV'
      ) as HTMLElement[];
      
      console.log(`Found ${commentDivs.length} potential comment divs`);
      
      commentDivs.forEach((div, index) => {
        let commentText = '';
        
        // Strategy 1: Use the exact pattern from user examples
        // Structure: div > div > a > div > div[class*="content-"] > div:nth-child(6) > span
        // The content div has dynamic class like "content-0-2-69" or "content-0-2-58"
        const contentDiv = div.querySelector('div[class*="content-"]');
        if (contentDiv) {
          // Look for div:nth-child(6) > span (the exact pattern)
          const sixthDiv = contentDiv.querySelector('div:nth-child(6)');
          if (sixthDiv) {
            const textSpan = sixthDiv.querySelector('span');
            if (textSpan) {
              commentText = textSpan.textContent?.trim() || '';
              if (commentText) {
                console.log(`✅ Found comment ${index + 1} via div:nth-child(6) > span: ${commentText.substring(0, 60)}...`);
              }
            }
          }
          
          // Fallback: Look for span with specific font-size style (15px) - comment text pattern
          if (!commentText || commentText.length < 10) {
            // Try multiple selectors for font-size
            const spanSelectors = [
              'span[style*="font-size: 15px"]',
              'span[style*="font-size:15px"]',
              'span[style*="15px"]'
            ];
            
            for (const selector of spanSelectors) {
              const spans = contentDiv.querySelectorAll(selector);
              for (const span of Array.from(spans)) {
                const text = span.textContent?.trim();
                const style = span.getAttribute('style') || '';
                // Check if it's a real comment (has meaningful length and correct style)
                if (text && text.length > 15 && style.includes('15px')) {
                  // Filter out UI elements
                  if (!text.match(/^(Reply|Like|Share|Follow|View|Hide|\d+)$/i) && 
                      text.split(' ').length > 2) {
                    commentText = text;
                    console.log(`✅ Found comment ${index + 1} via ${selector}: ${commentText.substring(0, 60)}...`);
                    break;
                  }
                }
              }
              if (commentText) break;
            }
          }
          
          // Fallback 2: Look for any span in content div and check its style
          if (!commentText || commentText.length < 10) {
            const allSpans = contentDiv.querySelectorAll('span');
            for (const span of Array.from(allSpans)) {
              const style = span.getAttribute('style') || '';
              const text = span.textContent?.trim();
              // Check if style contains font-size: 15px
              if (style.includes('font-size') && style.includes('15px') && 
                  text && text.length > 15 && text.split(' ').length > 2) {
                if (!text.match(/^(Reply|Like|Share|Follow|View|Hide|\d+)$/i)) {
                  commentText = text;
                  console.log(`✅ Found comment ${index + 1} via span style check: ${commentText.substring(0, 60)}...`);
                  break;
                }
              }
            }
          }
        }
        
        // Strategy 2: If content div not found, search for the span pattern directly
        if (!commentText || commentText.length < 10) {
          // Look for spans with the specific style pattern (font-size: 15px)
          const commentSpans = div.querySelectorAll('span[style*="font-size: 15px"], span[style*="font-size:15px"]');
          for (const span of Array.from(commentSpans)) {
            const text = span.textContent?.trim();
            if (text && text.length > 15) {
              // Filter out UI elements
              if (!text.match(/^(Reply|Like|Share|Follow|View|Hide|\d+)$/i) && 
                  text.split(' ').length > 2) {
                commentText = text;
                console.log(`✅ Found comment ${index + 1} via direct span search: ${commentText.substring(0, 60)}...`);
                break;
              }
            }
          }
        }
        
        // Strategy 3: Navigate through the nested structure
        if (!commentText || commentText.length < 10) {
          // Navigate: div > div > a > div > div[class*="content"] > div:nth-child(6) > span
          const nestedStructure = div.querySelector('div > div > a > div > div[class*="content"]');
          if (nestedStructure) {
            const sixthDiv = nestedStructure.querySelector('div:nth-child(6)');
            if (sixthDiv) {
              const textSpan = sixthDiv.querySelector('span');
              if (textSpan) {
                const text = textSpan.textContent?.trim();
                if (text && text.length > 15) {
                  commentText = text;
                  console.log(`✅ Found comment ${index + 1} via nested structure: ${commentText.substring(0, 60)}...`);
                }
              }
            }
          }
        }
        
        // Add comment if we found valid text
        if (commentText && commentText.length > 10) {
          // Clean up the text
          const cleaned = commentText
            .replace(/\s+/g, ' ')
            .replace(/^\d+\s*/, '') // Remove leading numbers
            .trim();
          
          // Filter out duplicates and non-meaningful content
          if (cleaned.length > 10) {
            const isDuplicate = comments.some(c => {
              // Check for similarity (first 50 chars match)
              const cStart = c.toLowerCase().substring(0, 50).trim();
              const cleanedStart = cleaned.toLowerCase().substring(0, 50).trim();
              return cStart === cleanedStart && cStart.length > 20;
            });
            
            if (!isDuplicate && 
                !cleaned.match(/^(Reply|Like|Share|Follow|View|Hide)$/i) &&
                cleaned.split(' ').length > 2) {
              comments.push(cleaned);
              console.log(`✅ Added comment ${comments.length}: ${cleaned.substring(0, 80)}...`);
            } else if (isDuplicate) {
              console.log(`⚠️ Skipped duplicate comment in div ${index + 1}`);
            }
          }
        } else {
          console.log(`⚠️ No valid comment text found in div ${index + 1}`);
        }
      });
      
      console.log(`📊 Extracted ${comments.length} comments from ${commentDivs.length} divs`);
    } else {
      console.log('⚠️ Comments container not found, trying alternative methods...');
      
      // Fallback 1: Try to find any noScrollbar container in the section
      const section = document.querySelector('section');
      if (section) {
        console.log('Trying section fallback...');
        const noScrollbarDivs = section.querySelectorAll('div[class*="noScrollbar"]');
        console.log(`Found ${noScrollbarDivs.length} noScrollbar divs in section`);
        
        for (const container of Array.from(noScrollbarDivs)) {
          const commentDivs = Array.from(container.children).filter(
            child => child.tagName === 'DIV'
          ) as HTMLElement[];
          
          console.log(`Processing container with ${commentDivs.length} child divs`);
          
          commentDivs.forEach((div, idx) => {
            // Use the same extraction logic
            const contentDiv = div.querySelector('div[class*="content-"]');
            if (contentDiv) {
              const sixthDiv = contentDiv.querySelector('div:nth-child(6)');
              if (sixthDiv) {
                const textSpan = sixthDiv.querySelector('span');
                if (textSpan) {
                  const text = textSpan.textContent?.trim();
                  if (text && text.length > 15 && text.split(' ').length > 2) {
                    const isDuplicate = comments.some(c => c.toLowerCase().substring(0, 50) === text.toLowerCase().substring(0, 50));
                    if (!isDuplicate) {
                      comments.push(text);
                      console.log(`✅ Fallback: Added comment ${comments.length} from div ${idx + 1}`);
                    }
                  }
                }
              }
            }
          });
          
          if (comments.length > 0) {
            console.log(`✅ Found ${comments.length} comments using fallback method`);
            break;
          }
        }
      }
      
      // Fallback 2: Search for all spans with font-size: 15px (comment text style) in the entire document
      if (comments.length === 0) {
        console.log('Trying global span search fallback...');
        const allSpans = document.querySelectorAll('span[style*="15px"]');
        console.log(`Found ${allSpans.length} spans with 15px font-size`);
        
        for (const span of Array.from(allSpans)) {
          const style = span.getAttribute('style') || '';
          const text = span.textContent?.trim();
          
          // Check if it's the comment text style (font-size: 15px)
          if (style.includes('font-size') && style.includes('15px') && 
              text && text.length > 15 && text.split(' ').length > 2) {
            // Filter out UI elements
            if (!text.match(/^(Reply|Like|Share|Follow|View|Hide|\d+)$/i)) {
              // Check if it's in a comment-like structure (has content div ancestor)
              const contentAncestor = span.closest('div[class*="content"]');
              if (contentAncestor) {
                const isDuplicate = comments.some(c => 
                  c.toLowerCase().substring(0, 50) === text.toLowerCase().substring(0, 50)
                );
                if (!isDuplicate) {
                  comments.push(text);
                  console.log(`✅ Global search: Added comment ${comments.length}: ${text.substring(0, 60)}...`);
                }
              }
            }
          }
        }
      }
    }
    
    console.log(`📊 Total extracted: ${comments.length} comments`);
    return comments;
  } catch (error) {
    console.error('Error extracting comments:', error);
    return [];
  }
}

async function handleAnalyzeMarket(btn: HTMLButtonElement): Promise<void> {
  console.log('🔍 Starting market analysis...');
  const ticker = extractTicker();
  const seriesTicker = extractSeriesTicker();
  
  console.log(`📊 Extracted values:`, { ticker, seriesTicker });
  
  if (!ticker) {
    alert('Could not extract ticker from page. Please make sure you are on a Kalshi market page.');
    return;
  }

  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Analyzing...';
  btn.disabled = true;

  try {
    console.log(`📡 Sending request to: ${BACKEND_URL}/api/analyze-market`);
    console.log(`📦 Payload:`, { ticker, series_ticker: seriesTicker });
    
    const response = await fetch(`${BACKEND_URL}/api/analyze-market`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ ticker, series_ticker: seriesTicker })
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data: MarketAnalysisData = await response.json();
    console.log('Analysis received:', data);
    showModal('Market Analysis', data, 'market');
  } catch (error) {
    console.error('Fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    alert(`Error analyzing market: ${errorMessage}\n\nCheck console for details.`);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

async function handleAnalyzeComments(btn: HTMLButtonElement): Promise<void> {
  console.log('🔍 Starting comment analysis...');
  const ticker = extractTicker();
  const seriesTicker = extractSeriesTicker();
  const comments = extractComments();
  
  console.log(`📊 Extracted values:`, { ticker, seriesTicker, commentCount: comments.length });
  
  if (!ticker) {
    alert('Could not extract ticker from page. Please make sure you are on a Kalshi market page.');
    return;
  }

  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Analyzing...';
  btn.disabled = true;

  try {
    console.log(`📡 Sending request to: ${BACKEND_URL}/api/analyze-comments`);
    console.log(`📦 Payload:`, { ticker, series_ticker: seriesTicker, comments: comments.slice(0, 50) });
    
    const response = await fetch(`${BACKEND_URL}/api/analyze-comments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ 
        ticker, 
        series_ticker: seriesTicker,
        comments: comments.slice(0, 50) // Limit to 50 comments
      })
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data: CommentAnalysisData = await response.json();
    console.log('Analysis received:', data);
    showModal('Comment Sentiment', data, 'comments');
  } catch (error) {
    console.error('Fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    alert(`Error analyzing comments: ${errorMessage}\n\nCheck console for details.`);
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

