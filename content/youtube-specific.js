// YouTube-specific ad blocking script
(function() {
  'use strict';

  // Only run on YouTube
  if (!window.location.hostname.includes('youtube.com')) {
    return;
  }

  console.log('YouTube Ad Blocker: Initializing...');

  // YouTube ad selectors
  const YOUTUBE_AD_SELECTORS = [
    // Video ads
    '.ytp-ad-module',
    '.ytp-ad-player-overlay',
    '.ytp-ad-image-overlay',
    '.ytp-ad-text-overlay',
    '.ytp-ad-skip-button-container',
    '.ytp-ad-preview-container',
    '.video-ads',
    '.ytd-player-legacy-desktop-watch-ads-renderer',
    
    // Display ads
    'ytd-display-ad-renderer',
    'ytd-banner-promo-renderer',
    'ytd-statement-banner-renderer',
    'ytd-masthead-ad-v3-renderer',
    'ytd-primetime-promo-renderer',
    'ytd-inline-survey-renderer',
    'ytd-brand-video-shelf-renderer',
    'ytd-promoted-sparkles-web-renderer',
    'ytd-rich-item-renderer:has(ytd-display-ad-renderer)',
    
    // Sidebar ads
    'ytd-companion-slot-renderer',
    'ytd-action-companion-ad-renderer',
    'ytd-promoted-video-renderer',
    
    // Homepage ads
    'ytd-ad-slot-renderer',
    'ytd-rich-section-renderer:has(ytd-statement-banner-renderer)',
    
    // Search ads
    'ytd-search-pyv-renderer',
    'ytd-promoted-sparkles-text-search-renderer',
    
    // Shorts ads
    'ytd-reel-video-renderer:has([is-ads])',
    'ytd-ad-preview-renderer'
  ];

  // Hide ads function
  function hideYouTubeAds() {
    YOUTUBE_AD_SELECTORS.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (!element.dataset.adblocked) {
            element.style.cssText = 'display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important;';
            element.dataset.adblocked = 'true';
          }
        });
      } catch (e) {
        // Ignore selector errors
      }
    });
  }

  // Skip video ads
  function skipVideoAds() {
    // Check for skip button
    const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern');
    if (skipButton) {
      skipButton.click();
      console.log('YouTube Ad Blocker: Skipped ad');
    }

    // Check if ad is playing
    const video = document.querySelector('video');
    const adModule = document.querySelector('.ytp-ad-module');
    
    if (video && adModule) {
      // Speed up ad playback
      video.playbackRate = 16;
      video.muted = true;
    }
  }

  // Remove ad containers
  function removeAdContainers() {
    // Remove empty ad containers
    const adContainers = document.querySelectorAll('.ytd-ad-slot-renderer, .ytd-banner-promo-renderer');
    adContainers.forEach(container => {
      const parent = container.parentElement;
      if (parent && parent.tagName === 'YTD-RICH-ITEM-RENDERER') {
        parent.remove();
      }
    });
  }

  // Setup observer
  const observer = new MutationObserver(() => {
    hideYouTubeAds();
    skipVideoAds();
    removeAdContainers();
  });

  // Start observing
  function startObserving() {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize
  if (document.body) {
    hideYouTubeAds();
    skipVideoAds();
    removeAdContainers();
    startObserving();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      hideYouTubeAds();
      skipVideoAds();
      removeAdContainers();
      startObserving();
    });
  }

  // Run periodically for stubborn ads
  setInterval(() => {
    hideYouTubeAds();
    skipVideoAds();
  }, 1000);

  console.log('YouTube Ad Blocker: Active');
})();