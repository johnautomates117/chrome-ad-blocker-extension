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
        whitelist: ['youtube.com', 'www.youtube.com']
      });
      siteWhitelist = new Set(['youtube.com', 'www.youtube.com']);
    } else {
      extensionEnabled = data.enabled;
      const whitelist = data.whitelist || [];
      // Add YouTube to existing whitelist if not present
      if (!whitelist.includes('youtube.com')) {
        whitelist.push('youtube.com', 'www.youtube.com');
        await chrome.storage.local.set({ whitelist });
      }
      siteWhitelist = new Set(whitelist);
    }
    
    // Set badge color
    await chrome.action.setBadgeBackgroundColor({ color: '#4285F4' });
    
    // Initialize blocking rules based on extension state
    await updateExtensionRules();
    
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
  
  // Manage network-level blocking rules
  await updateExtensionRules();
  
  // Update all tab badges and notify content scripts
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
    
    // Notify content scripts about extension state change
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'extensionToggled',
        enabled: extensionEnabled
      });
    } catch (e) {
      // Content script might not be ready, that's OK
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
  
  // Update dynamic rules for YouTube
  if (hostname === 'youtube.com' || hostname === 'www.youtube.com') {
    await updateYouTubeDynamicRules();
  }
  
  // Update badges for this site and notify content scripts
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
    
    // Notify content script about whitelist change
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'whitelistChanged',
        isWhitelisted: siteWhitelist.has(hostname)
      });
    } catch (e) {
      // Content script might not be ready, that's OK
    }
  }
  
  return { isWhitelisted: siteWhitelist.has(hostname) };
}

// Manage extension-level blocking rules
async function updateExtensionRules() {
  try {
    if (extensionEnabled) {
      // Enable rulesets when extension is enabled
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: ['ruleset_ads', 'ruleset_trackers'],
        disableRulesetIds: []
      });
      
      // Update YouTube rules based on whitelist
      await updateYouTubeDynamicRules();
      
      console.log('Extension blocking rules enabled');
    } else {
      // Disable all rulesets when extension is disabled
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: ['ruleset_youtube_allowlist'], // Always keep YouTube allowlist active
        disableRulesetIds: ['ruleset_ads', 'ruleset_trackers', 'ruleset_annoyances']
      });
      
      // Remove dynamic rules
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [9000, 9001, 9002, 9003, 9004]
      });
      
      console.log('Extension blocking rules disabled');
    }
  } catch (error) {
    console.error('Error updating extension rules:', error);
  }
}

// Manage dynamic YouTube allowlist rules
async function updateYouTubeDynamicRules() {
  try {
    const isYouTubeWhitelisted = siteWhitelist.has('youtube.com') || siteWhitelist.has('www.youtube.com');
    
    // Define the dynamic rule IDs
    const DYNAMIC_RULE_IDS = [9000, 9001, 9002, 9003, 9004];
    
    if (isYouTubeWhitelisted) {
      // Add allowlist rules for YouTube video playback
      const allowRules = [
        {
          "id": 9000,
          "priority": 1000,
          "action": { "type": "allow" },
          "condition": {
            "urlFilter": "*googlevideo.com/videoplayback*",
            "resourceTypes": ["media", "xmlhttprequest", "other"]
          }
        },
        {
          "id": 9001,
          "priority": 1000,
          "action": { "type": "allow" },
          "condition": {
            "urlFilter": "*rr*.googlevideo.com/*",
            "resourceTypes": ["media", "xmlhttprequest", "other"]
          }
        },
        {
          "id": 9002,
          "priority": 1000,
          "action": { "type": "allow" },
          "condition": {
            "urlFilter": "*youtube.com/ptracking*",
            "resourceTypes": ["xmlhttprequest", "image"]
          }
        },
        {
          "id": 9003,
          "priority": 1000,
          "action": { "type": "allow" },
          "condition": {
            "urlFilter": "*youtube.com/api/stats*",
            "resourceTypes": ["xmlhttprequest"]
          }
        },
        {
          "id": 9004,
          "priority": 1000,
          "action": { "type": "allow" },
          "condition": {
            "urlFilter": "*.googlevideo.com/*",
            "resourceTypes": ["media", "xmlhttprequest", "other"]
          }
        }
      ];
      
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: DYNAMIC_RULE_IDS,
        addRules: allowRules
      });
      
      console.log('YouTube dynamic allowlist rules enabled');
    } else {
      // Remove allowlist rules when YouTube is not whitelisted
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: DYNAMIC_RULE_IDS
      });
      
      console.log('YouTube dynamic allowlist rules disabled');
    }
  } catch (error) {
    console.error('Error updating YouTube dynamic rules:', error);
  }
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