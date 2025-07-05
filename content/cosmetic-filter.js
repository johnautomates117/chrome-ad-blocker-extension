// Enhanced cosmetic filter for aggressive ad and popup blocking
// Specifically targets streaming sites and popup-heavy sites

const AD_SELECTORS = [
  // Generic ad containers
  '[class*="ad-"]',
  '[class*="ads-"]',
  '[class*="advertisement"]',
  '[id*="ad-"]',
  '[id*="ads-"]',
  '[id*="advertisement"]',
  '[id*="google_ads"]',
  '[id*="googleads"]',
  '.ad',
  '.ads',
  '.advert',
  '.advertisement',
  '.ad-container',
  '.ad-wrapper',
  '.ad-banner',
  '.ad-block',
  '.ad-unit',
  '.adsbygoogle',
  '.sponsored',
  '.sponsored-content',
  '.banner-ad',
  '.banner_ad',
  '.bannerAd',
  '.banner-ads',
  
  // Popup and overlay specific
  '[class*="popup"]',
  '[class*="pop-up"]',
  '[class*="overlay"]',
  '[class*="modal"][class*="ad"]',
  '[id*="popup"]',
  '[id*="pop-up"]',
  '[id*="overlay"]',
  '.popup-ad',
  '.popup_ad',
  '.popupAd',
  '.overlay-ad',
  '.modal-ad',
  '.interstitial',
  '.interstitial-ad',
  
  // Video player ads
  '.video-ads',
  '.ytp-ad-module',
  '.videoAdUi',
  '.vid-ad',
  '.video-ad',
  '.player-ads',
  '.player-ad-container',
  
  // YouTube specific ad selectors
  '.ytp-ad-overlay-container',
  '.ytp-ad-text-overlay',
  '.ytp-ad-skip-button-container',
  '.ytp-ad-preview-container',
  '.video-ads__container',
  '.ytd-player-legacy-desktop-watch-ads-renderer',
  '.ytd-ad-slot-renderer',
  'ytd-display-ad-renderer',
  'ytd-banner-promo-renderer',
  'ytd-statement-banner-renderer',
  'ytd-masthead-prime-renderer',
  'ytd-primetime-promo-renderer',
  'ytd-inline-survey-renderer',
  'ytd-brand-video-shelf-renderer',
  'ytd-promoted-sparkles-web-renderer',
  
  // Streaming site specific
  '.vjs-ad-playing',
  '.jw-ad',
  '.jw-ad-container',
  '.flowplayer-ad',
  '.videojs-ad-playing',
  
  // Push notification prompts
  '[class*="push-notification"]',
  '[class*="notification-prompt"]',
  '[class*="subscribe-push"]',
  '.push-prompt',
  '.notification-prompt',
  '.subscribe-bell',
  
  // Social media embeds used as ads
  '.fb-ad',
  '.twitter-ad',
  '[data-testid="placementTracking"]',
  
  // Specific to streaming/movie sites
  '.afs_ads',
  '.trc_rbox',
  '.OUTBRAIN',
  '.ob-widget',
  '.nativo-ad',
  '.native-ad',
  
  // Float/sticky ads
  '.sticky-ad',
  '.float-ad',
  '.floating-ad',
  '.fixed-ad',
  '[style*="position: fixed"][class*="ad"]',
  '[style*="position: sticky"][class*="ad"]'
];

// Check if we're on YouTube
const isYouTube = window.location.hostname.includes('youtube.com');

let hiddenCount = 0;
let observer = null;
let popupBlockerInterval = null;

function hideAds() {
  const startTime = performance.now();
  let elementsHidden = 0;
  
  AD_SELECTORS.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.dataset.adblockHidden && isLikelyAd(element)) {
          element.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;';
          element.dataset.adblockHidden = 'true';
          elementsHidden++;
          hiddenCount++;
        }
      });
    } catch (error) {
      // Ignore selector errors
    }
  });
  
  const duration = performance.now() - startTime;
  if (duration > 10) {
    console.warn(`Cosmetic filtering took ${duration.toFixed(2)}ms`);
  }
  
  if (elementsHidden > 0) {
    console.log(`Hidden ${elementsHidden} ad elements`);
  }
}

function isLikelyAd(element) {
  // Skip if element is too small to be an ad
  const rect = element.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) {
    return false;
  }
  
  // Check for ad-related attributes
  const attributes = ['data-ad', 'data-ads', 'data-advertisement', 'data-google-query-id'];
  for (const attr of attributes) {
    if (element.hasAttribute(attr)) {
      return true;
    }
  }
  
  // Check for ad-related classes and IDs more thoroughly
  const classAndId = (element.className + ' ' + element.id).toLowerCase();
  const adKeywords = ['ad', 'ads', 'banner', 'sponsor', 'promo', 'popup', 'overlay', 'interstitial'];
  
  for (const keyword of adKeywords) {
    if (classAndId.includes(keyword)) {
      // Make sure it's not a false positive
      const falsePositives = ['load', 'read', 'thread', 'spread', 'bread', 'head', 'lead'];
      let isFalsePositive = false;
      
      for (const fp of falsePositives) {
        if (classAndId.includes(fp) && !classAndId.includes('header-ad')) {
          isFalsePositive = true;
          break;
        }
      }
      
      if (!isFalsePositive) {
        return true;
      }
    }
  }
  
  // Check if it's a suspicious iframe
  if (element.tagName === 'IFRAME') {
    const src = element.src || '';
    if (src.includes('doubleclick') || src.includes('googlesyndication') || 
        src.includes('facebook.com/tr') || src.includes('amazon-adsystem') ||
        !src || src === 'about:blank') {
      return true;
    }
  }
  
  return false;
}

// Aggressive popup blocking
function blockPopups() {
  // Override window.open
  const originalOpen = window.open;
  window.open = function(...args) {
    console.log('Blocked popup:', args[0]);
    return null;
  };
  
  // Block popunder attempts
  let lastMouseDown = 0;
  document.addEventListener('mousedown', () => {
    lastMouseDown = Date.now();
  }, true);
  
  document.addEventListener('click', (e) => {
    if (Date.now() - lastMouseDown > 100) {
      // Likely a programmatic click for popup
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
  
  // Block beforeunload popups - but be careful not to break YouTube
  if (!isYouTube) {
    window.addEventListener('beforeunload', (e) => {
      e.stopPropagation();
      e.preventDefault();
      delete e.returnValue;
    }, true);
  }
  
  // Remove onclick attributes that might open popups
  const clickableElements = document.querySelectorAll('[onclick*="window.open"], [onclick*="popup"], [onclick*="pop"]');
  clickableElements.forEach(el => {
    el.removeAttribute('onclick');
    el.style.cursor = 'default';
  });
}

// Remove overlay and modal backgrounds
function removeOverlays() {
  const overlays = document.querySelectorAll(
    '[class*="overlay"], [class*="modal-backdrop"], [class*="modal-bg"], ' +
    '[class*="popup-bg"], [class*="lightbox"], .fancybox-overlay, ' +
    '[style*="position: fixed"][style*="z-index"][style*="background"]'
  );
  
  overlays.forEach(overlay => {
    // Skip YouTube player overlays
    if (isYouTube && overlay.closest('.html5-video-player')) {
      return;
    }
    
    const rect = overlay.getBoundingClientRect();
    // Check if it covers most of the screen
    if (rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.8) {
      overlay.style.display = 'none';
      // Also restore body scroll if it was disabled
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    }
  });
}

// Enhanced observer for dynamic content
function setupObserver() {
  if (observer) {
    observer.disconnect();
  }
  
  observer = new MutationObserver((mutations) => {
    let shouldHideAds = false;
    let shouldRemoveOverlays = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldHideAds = true;
        
        // Check for overlay/popup additions
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            const classAndId = ((node.className || '') + ' ' + (node.id || '')).toLowerCase();
            if (classAndId.includes('overlay') || classAndId.includes('modal') || 
                classAndId.includes('popup')) {
              shouldRemoveOverlays = true;
            }
          }
        });
      }
    }
    
    if (shouldHideAds) {
      clearTimeout(observer.hideTimeout);
      observer.hideTimeout = setTimeout(hideAds, 250);
    }
    
    if (shouldRemoveOverlays) {
      clearTimeout(observer.overlayTimeout);
      observer.overlayTimeout = setTimeout(removeOverlays, 100);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Periodic cleanup for stubborn popups
function startPopupBlockerInterval() {
  popupBlockerInterval = setInterval(() => {
    removeOverlays();
    blockPopups();
    cleanupEmptyContainers();
  }, 2000);
}

// Clean up empty ad containers
function cleanupEmptyContainers() {
  const containers = document.querySelectorAll(
    '.ad-container, .ad-wrapper, .ads-wrapper, .advertisement-container, ' +
    '[class*="ad-slot"], [class*="ad-space"]'
  );
  
  containers.forEach(container => {
    if (container.children.length === 0 || 
        Array.from(container.children).every(child => 
          child.style.display === 'none' || 
          child.style.visibility === 'hidden')) {
      container.style.display = 'none';
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    hideAds();
    blockPopups();
    removeOverlays();
    setupObserver();
    startPopupBlockerInterval();
  });
} else {
  hideAds();
  blockPopups();
  removeOverlays();
  setupObserver();
  startPopupBlockerInterval();
}

// Re-run when window loads (for delayed content)
window.addEventListener('load', () => {
  setTimeout(() => {
    hideAds();
    removeOverlays();
    blockPopups();
  }, 1000);
});

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getHiddenCount') {
    sendResponse({ hiddenCount });
  }
});

// Cleanup on page unload - removed to fix the "unload" permission error
// Instead, let Chrome handle cleanup automatically

console.log('AdGuard Lite: Enhanced cosmetic filter loaded');