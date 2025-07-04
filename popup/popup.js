let currentState = {
  enabled: true,
  hostname: null,
  isWhitelisted: false,
  tabBlockedCount: 0
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializePopup();
    setupEventListeners();
  } catch (error) {
    console.error('Critical error during popup initialization:', error);
    showError('Extension failed to initialize. Please try refreshing the page.');
    
    // Fallback to basic state
    document.body.classList.add('error-state');
    const mainToggle = document.getElementById('mainToggle');
    if (mainToggle) {
      mainToggle.disabled = true;
    }
  }
});

async function initializePopup() {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Fallback if no active tab
      if (!tab) {
        console.warn('No active tab found, using fallback state');
        currentState = { ...currentState, hostname: null, isWhitelisted: false };
        updateUI(currentState, { blockedTotal: 0 });
        return;
      }
      
      const [state, stats] = await Promise.allSettled([
        chrome.runtime.sendMessage({ action: 'getState' }),
        chrome.runtime.sendMessage({ action: 'getStats' })
      ]);
      
      // Handle state response
      if (state.status === 'fulfilled') {
        currentState = { ...currentState, ...state.value };
      } else {
        console.error('Failed to get extension state:', state.reason);
        // Use fallback state
        currentState = { enabled: true, hostname: null, isWhitelisted: false, tabBlockedCount: 0 };
      }
      
      // Handle stats response
      const statsValue = stats.status === 'fulfilled' ? stats.value : { blockedTotal: 0 };
      
      updateUI(currentState, statsValue);
      return; // Success, exit retry loop
      
    } catch (error) {
      retryCount++;
      console.error(`Error initializing popup (attempt ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount >= maxRetries) {
        showError('Failed to connect to extension. Please reload the extension.');
        // Set fallback UI state
        document.body.classList.add('disconnected');
        return;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 200 * retryCount));
    }
  }
}

function setupEventListeners() {
  const mainToggle = document.getElementById('mainToggle');
  const siteToggleBtn = document.getElementById('siteToggleBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const aboutLink = document.getElementById('aboutLink');
  const supportLink = document.getElementById('supportLink');

  mainToggle.addEventListener('change', handleMainToggle);
  siteToggleBtn.addEventListener('click', handleSiteToggle);
  settingsBtn.addEventListener('click', handleSettingsClick);
  aboutLink.addEventListener('click', handleAboutClick);
  supportLink.addEventListener('click', handleSupportClick);
}

async function handleMainToggle() {
  const mainToggle = document.getElementById('mainToggle');
  const toggleText = document.getElementById('toggleText');
  const toggleSubtext = document.getElementById('toggleSubtext');
  
  try {
    mainToggle.disabled = true;
    toggleText.textContent = 'Updating...';
    toggleSubtext.textContent = 'Please wait';
    
    const result = await chrome.runtime.sendMessage({ action: 'toggleExtension' });
    currentState.enabled = result.enabled;
    
    const stats = await chrome.runtime.sendMessage({ action: 'getStats' });
    updateUI(currentState, stats);
    
  } catch (error) {
    console.error('Error toggling extension:', error);
    showError('Failed to toggle extension');
    mainToggle.checked = currentState.enabled;
  } finally {
    mainToggle.disabled = false;
  }
}

async function handleSiteToggle() {
  const siteToggleBtn = document.getElementById('siteToggleBtn');
  const originalText = siteToggleBtn.textContent;
  
  if (!currentState.hostname) {
    showError('Cannot toggle site protection for this page');
    return;
  }
  
  try {
    siteToggleBtn.disabled = true;
    siteToggleBtn.textContent = 'Updating...';
    
    const result = await chrome.runtime.sendMessage({ 
      action: 'toggleSite', 
      hostname: currentState.hostname 
    });
    
    currentState.isWhitelisted = result.isWhitelisted;
    
    const stats = await chrome.runtime.sendMessage({ action: 'getStats' });
    updateUI(currentState, stats);
    
  } catch (error) {
    console.error('Error toggling site:', error);
    showError('Failed to toggle site protection');
    siteToggleBtn.textContent = originalText;
  } finally {
    siteToggleBtn.disabled = false;
  }
}

function handleSettingsClick() {
  chrome.tabs.create({ url: 'settings/settings.html' });
  window.close();
}

function handleAboutClick(event) {
  event.preventDefault();
  chrome.tabs.create({ url: 'https://github.com/johnautomates117/chrome-ad-blocker-extension' });
  window.close();
}

function handleSupportClick(event) {
  event.preventDefault();
  chrome.tabs.create({ url: 'https://github.com/johnautomates117/chrome-ad-blocker-extension/issues' });
  window.close();
}

function updateUI(state, stats) {
  updateMainToggle(state);
  updateStats(state, stats);
  updateSiteSection(state);
}

function updateMainToggle(state) {
  const mainToggle = document.getElementById('mainToggle');
  const toggleText = document.getElementById('toggleText');
  const toggleSubtext = document.getElementById('toggleSubtext');
  
  mainToggle.checked = state.enabled;
  
  if (state.enabled) {
    toggleText.textContent = 'Protection is ON';
    toggleSubtext.textContent = 'All ads and trackers are being blocked';
  } else {
    toggleText.textContent = 'Protection is OFF';
    toggleSubtext.textContent = 'Ads and trackers are not being blocked';
  }
}

function updateStats(state, stats) {
  const blockedCountEl = document.getElementById('blockedCount');
  const totalBlockedEl = document.getElementById('totalBlocked');
  
  blockedCountEl.textContent = formatNumber(state.tabBlockedCount || 0);
  totalBlockedEl.textContent = formatNumber(stats.blockedTotal || 0);
}

function updateSiteSection(state) {
  const siteSection = document.getElementById('siteSection');
  const siteName = document.getElementById('siteName');
  const siteToggleBtn = document.getElementById('siteToggleBtn');
  const siteToggleBtnText = document.getElementById('siteToggleBtnText');
  
  if (!state.hostname || state.hostname === 'chrome-extension' || state.hostname === 'chrome') {
    siteSection.style.display = 'none';
    return;
  }
  
  siteSection.style.display = 'block';
  siteName.textContent = state.hostname;
  
  if (state.isWhitelisted) {
    siteToggleBtnText.textContent = 'Resume on this site';
    siteToggleBtn.classList.add('whitelisted');
  } else {
    siteToggleBtnText.textContent = 'Pause on this site';
    siteToggleBtn.classList.remove('whitelisted');
  }
  
  siteToggleBtn.disabled = !state.enabled;
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    right: 10px;
    background: #ff4444;
    color: white;
    padding: 10px;
    border-radius: 6px;
    font-size: 14px;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    errorDiv.remove();
  }, 3000);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updatePopup') {
    initializePopup();
  }
});