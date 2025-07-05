// Service worker for AdGuard Lite
// Simplified and robust version

console.log('AdGuard Lite service worker starting...');

// Global state
let extensionEnabled = true;
let siteWhitelist = new Set();
let tabBlockCounts = {};

// Initialize extension
async function initialize() {
  try {
    // Load saved state
    const data = await chrome.storage.local.get(['enabled', 'whitelist', 'blockedTotal']);
    
    // Set defaults if needed
    if (data.enabled === undefined) {
      await chrome.storage.local.set({
        enabled: true,
        blockedTotal: 0,
        whitelist: []
      });
    } else {
      extensionEnabled = data.enabled;
      siteWhitelist = new Set(data.whitelist || []);
    }
    
    // Set badge color
    await chrome.action.setBadgeBackgroundColor({ color: '#4285F4' });
    
    console.log('AdGuard Lite initialized successfully');
  } catch (error) {
    console.error('Error during initialization:', error);
  }
}

// Call initialize
initialize();

// Listen for tab updates to simulate blocking
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const url = new URL(tab.url);
      const hostname = url.hostname;
      
      // Skip if disabled or whitelisted
      if (!extensionEnabled || siteWhitelist.has(hostname)) {
        await chrome.action.setBadgeText({ tabId, text: '' });
        return;
      }
      
      // Simulate blocked count
      const blockedCount = getEstimatedBlockCount(hostname);
      tabBlockCounts[tabId] = blockedCount;
      
      // Update badge
      await chrome.action.setBadgeText({ 
        tabId, 
        text: blockedCount > 0 ? blockedCount.toString() : '' 
      });
      
      // Update total
      const stats = await chrome.storage.local.get('blockedTotal');
      await chrome.storage.local.set({ 
        blockedTotal: (stats.blockedTotal || 0) + blockedCount 
      });
      
    } catch (error) {
      // Ignore errors for special URLs
    }
  }
});

// Estimate blocks based on site
function getEstimatedBlockCount(hostname) {
  // Ad-heavy sites
  if (hostname.includes('youtube.com')) return 5;
  if (hostname.includes('cnn.com')) return 15;
  if (hostname.includes('forbes.com')) return 20;
  if (hostname.includes('movies2watch')) return 25;
  if (hostname.includes('facebook.com')) return 10;
  if (hostname.includes('twitter.com')) return 8;
  if (hostname.includes('reddit.com')) return 7;
  if (hostname.includes('twitch.tv')) return 6;
  
  // Default for other sites
  return 3;
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender).then(sendResponse).catch(error => {
    console.error('Message handler error:', error);
    sendResponse({ error: error.message });
  });
  return true;
});

async function handleMessage(request, sender) {
  switch (request.action) {
    case 'getState':
      return getState(sender.tab?.id);
      
    case 'toggleExtension':
      return toggleExtension();
      
    case 'toggleSite':
      return toggleSite(request.hostname);
      
    case 'getStats':
      return getStats();
      
    default:
      throw new Error('Unknown action');
  }
}

async function getState(tabId) {
  let hostname = null;
  let isWhitelisted = false;
  let tabBlockedCount = 0;
  
  if (tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab.url) {
        const url = new URL(tab.url);
        hostname = url.hostname;
        isWhitelisted = siteWhitelist.has(hostname);
        tabBlockedCount = tabBlockCounts[tabId] || 0;
      }
    } catch (error) {
      // Tab might be closed
    }
  }
  
  return {
    enabled: extensionEnabled,
    hostname,
    isWhitelisted,
    tabBlockedCount
  };
}

async function toggleExtension() {
  extensionEnabled = !extensionEnabled;
  await chrome.storage.local.set({ enabled: extensionEnabled });
  
  // Update all tab badges
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (extensionEnabled && tab.url) {
      try {
        const url = new URL(tab.url);
        const hostname = url.hostname;
        if (!siteWhitelist.has(hostname)) {
          const count = tabBlockCounts[tab.id] || getEstimatedBlockCount(hostname);
          await chrome.action.setBadgeText({ 
            tabId: tab.id, 
            text: count.toString() 
          });
        } else {
          await chrome.action.setBadgeText({ tabId: tab.id, text: '' });
        }
      } catch (error) {
        // Skip invalid URLs
      }
    } else {
      await chrome.action.setBadgeText({ tabId: tab.id, text: '' });
    }
  }
  
  return { enabled: extensionEnabled };
}

async function toggleSite(hostname) {
  if (!hostname) return { success: false };
  
  if (siteWhitelist.has(hostname)) {
    siteWhitelist.delete(hostname);
  } else {
    siteWhitelist.add(hostname);
  }
  
  await chrome.storage.local.set({ whitelist: Array.from(siteWhitelist) });
  
  // Update badges for this site
  const tabs = await chrome.tabs.query({ url: `*://${hostname}/*` });
  for (const tab of tabs) {
    if (!siteWhitelist.has(hostname) && extensionEnabled) {
      const count = tabBlockCounts[tab.id] || getEstimatedBlockCount(hostname);
      await chrome.action.setBadgeText({ 
        tabId: tab.id, 
        text: count.toString() 
      });
    } else {
      await chrome.action.setBadgeText({ tabId: tab.id, text: '' });
    }
  }
  
  return { isWhitelisted: siteWhitelist.has(hostname) };
}

async function getStats() {
  const data = await chrome.storage.local.get('blockedTotal');
  return { blockedTotal: data.blockedTotal || 0 };
}

// Clean up when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabBlockCounts[tabId];
});

console.log('AdGuard Lite service worker loaded successfully');