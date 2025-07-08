// Specific content script for movies2watch.tv
// This script handles the aggressive anti-adblock measures on this site

(function() {
  'use strict';
  
  console.log('AdGuard Lite: movies2watch.tv specific script loaded');
  
  // Check if current site is whitelisted
  async function isWhitelisted() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getState'
      });
      return response && response.isWhitelisted;
    } catch (e) {
      return false;
    }
  }
  
  // Check if extension is enabled
  async function isExtensionEnabled() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getState'
      });
      return response && response.enabled;
    } catch (e) {
      return true; // Default to enabled if we can't check
    }
  }
  
  // List of blocked ad domains (more targeted)
  const blockedPatterns = [
    'hoptreeperrie.shop',
    'ddacn.biz',
    'ahcdn.com',
    'jscdn.pw'
  ];
  
  // More conservative XHR/Fetch blocking - only block obvious ad domains
  const originalXHR = window.XMLHttpRequest;
  const originalFetch = window.fetch;
  
  // Override XMLHttpRequest (less aggressive)
  window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    const originalOpen = xhr.open;
    
    xhr.open = function(method, url) {
      const urlString = url.toString();
      for (const pattern of blockedPatterns) {
        if (urlString.includes(pattern)) {
          console.log('Blocked XHR request:', urlString);
          // Open a dummy request instead
          return originalOpen.call(this, method, 'data:text/plain,');
        }
      }
      return originalOpen.apply(this, arguments);
    };
    
    return xhr;
  };
  
  // Override fetch (less aggressive)
  window.fetch = function(resource, init) {
    const url = resource.toString();
    for (const pattern of blockedPatterns) {
      if (url.includes(pattern)) {
        console.log('Blocked fetch request:', url);
        // Return empty response
        return Promise.resolve(new Response('', {
          status: 200,
          statusText: 'OK'
        }));
      }
    }
    return originalFetch.apply(this, arguments);
  };
  
  // Override createElement to prevent ad script injection
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(document, tagName);
    
    if (tagName.toLowerCase() === 'script') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (name === 'src') {
          for (const pattern of blockedPatterns) {
            if (value.includes(pattern)) {
              console.log('Blocked script injection:', value);
              return;
            }
          }
        }
        return originalSetAttribute.call(this, name, value);
      };
      
      // Also override direct src property access
      Object.defineProperty(element, 'src', {
        set: function(value) {
          for (const pattern of blockedPatterns) {
            if (value.includes(pattern)) {
              console.log('Blocked script src:', value);
              return;
            }
          }
          element.setAttribute('src', value);
        },
        get: function() {
          return element.getAttribute('src');
        }
      });
    }
    
    return element;
  };
  
  // Remove existing ad scripts
  function removeAdScripts() {
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      const src = script.src || '';
      for (const pattern of blockedPatterns) {
        if (src.includes(pattern)) {
          script.remove();
          console.log('Removed ad script:', src);
        }
      }
    });
  }
  
  // Conservative cleanup - only remove obvious ads
  function cleanupAds() {
    let removedCount = 0;
    
    // Only target very specific ad selectors to avoid breaking the site
    const conservativeAdSelectors = [
      '.afs_ads',
      '.banner-ads',
      '.ad-overlay',
      'iframe[src*="hoptreeperrie.shop"]',
      'iframe[src*="ddacn.biz"]',
      'iframe[src*="ahcdn.com"]',
      'iframe[src*="jscdn.pw"]'
    ];
    
    conservativeAdSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          // Only remove if it's clearly not part of main content
          if (!el.closest('.video-player, .main-video, .player-container, .content, .main-content')) {
            el.remove();
            removedCount++;
          }
        });
      } catch (e) {
        // Ignore errors to prevent breaking the site
      }
    });
    
    if (removedCount > 0) {
      console.log(`Movies2Watch blocker: Removed ${removedCount} ad elements`);
    }
  }
  
  // Conservative click interceptor removal
  function removeClickInterceptors() {
    try {
      // Only remove very obvious popup triggers
      const suspiciousClicks = document.querySelectorAll('*[onclick*="window.open"], *[onclick*="popup"]');
      suspiciousClicks.forEach(el => {
        if (!el.closest('.video-player, .main-video, .player-container')) {
          el.removeAttribute('onclick');
          console.log('Removed suspicious click handler');
        }
      });
    } catch (e) {
      // Ignore errors
    }
  }
  
  // Conservative popup blocking
  function blockAllPopups() {
    // Only override window.open - don't mess with other functions
    window.open = function() {
      console.log('Blocked popup');
      return null;
    };
  }
  
  // Minimal navigation blocking
  function blockNavigationTricks() {
    // Only block suspicious beforeunload events
    window.addEventListener('beforeunload', function(e) {
      if (e.returnValue && e.returnValue.toLowerCase().includes('ad')) {
        e.preventDefault();
        delete e.returnValue;
      }
    }, true);
  }
  
  // Conservative CSS injection - only target obvious ads
  function injectBlockingCSS() {
    const style = document.createElement('style');
    style.textContent = `
      /* Hide specific ad network iframes */
      iframe[src*="hoptreeperrie.shop"],
      iframe[src*="ddacn.biz"],
      iframe[src*="ahcdn.com"],
      iframe[src*="jscdn.pw"] {
        display: none !important;
        visibility: hidden !important;
      }
      
      /* Hide obvious ad containers by class/id */
      .afs_ads,
      .banner-ads,
      #ad-container,
      .ad-overlay {
        display: none !important;
        visibility: hidden !important;
      }
    `;
    
    if (document.head) {
      document.head.appendChild(style);
      console.log('AdGuard Lite: Injected conservative blocking CSS');
    }
  }
  
  // Initialize blocking with extension state and whitelist checks
  async function initializeMovies2WatchBlocking() {
    const enabled = await isExtensionEnabled();
    if (!enabled) {
      console.log('AdGuard Lite: Extension is disabled, skipping movies2watch.tv blocking');
      return;
    }
    
    const whitelisted = await isWhitelisted();
    if (whitelisted) {
      console.log('AdGuard Lite: movies2watch.tv is whitelisted, skipping blocking');
      return;
    }
    
    console.log('AdGuard Lite: Initializing conservative movies2watch.tv blocking');
    
    // Light CSS injection
    setTimeout(injectBlockingCSS, 100);
    
    // Basic popup blocking
    blockAllPopups();
    
    // Initial cleanup
    setTimeout(() => {
      removeAdScripts();
      cleanupAds();
    }, 500);
    
    // Simple observer - only watch for iframe additions
    const observer = new MutationObserver((mutations) => {
      try {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1 && node.tagName === 'IFRAME') {
                const src = node.src || '';
                if (src.includes('hoptreeperrie.shop') || 
                    src.includes('ddacn.biz') ||
                    src.includes('ahcdn.com') ||
                    src.includes('jscdn.pw')) {
                  node.remove();
                  console.log('Removed ad iframe:', src);
                }
              }
            });
          }
        });
      } catch (e) {
        // Ignore errors
      }
    });
    
    // Start light monitoring
    if (document.documentElement) {
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
    
    // Very light periodic cleanup
    setInterval(async () => {
      try {
        const enabled = await isExtensionEnabled();
        if (!enabled) {
          return;
        }
        
        const whitelisted = await isWhitelisted();
        if (!whitelisted) {
          cleanupAds();
        }
      } catch (e) {
        // Ignore errors
      }
    }, 3000); // Much less frequent
  }
  
  // Initialize
  initializeMovies2WatchBlocking();
  
  // Light cleanup on load
  window.addEventListener('load', () => {
    setTimeout(async () => {
      const enabled = await isExtensionEnabled();
      if (!enabled) {
        return;
      }
      
      const whitelisted = await isWhitelisted();
      if (whitelisted) {
        return;
      }
      
      // Simple post-load cleanup
      cleanupAds();
      console.log('AdGuard Lite: Post-load cleanup completed');
    }, 1000);
  });
  
  // Listen for extension state changes
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'whitelistChanged') {
      // Reload the page when whitelist status changes
      location.reload();
    } else if (request.action === 'extensionToggled') {
      // Reload the page when extension is toggled
      location.reload();
    }
  });
  
})();