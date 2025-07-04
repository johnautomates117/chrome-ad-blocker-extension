# Claude Code Development Instructions

This file contains specific instructions for developing the Chrome Ad Blocker Extension using Claude Code.

## Project Overview

You are building a Chrome extension that blocks ads, trackers, and annoyances. The extension uses Manifest V3 and should be lightweight and performant.

## Key Files to Reference

1. **PRD.md** - Contains the complete Product Requirements Document with all specifications
2. **manifest.json** - The extension manifest (already created with basic structure)
3. **README.md** - Project overview and setup instructions

## Development Phases

### Phase 1: MVP Implementation
Start with these files in order:

1. **background/service-worker.js**
   - Initialize the extension
   - Set up declarativeNetRequest rules
   - Handle extension installation
   - Implement badge updates

2. **rules/ads.json**
   - Create initial ruleset with top 1000 ad domains
   - Follow the format specified in PRD section 4.4

3. **popup/popup.html**
   - Create basic UI with ON/OFF toggle
   - Include blocked items counter
   - Add settings gear icon

4. **popup/popup.js**
   - Implement toggle functionality
   - Connect to storage API
   - Update UI based on current state

5. **popup/popup.css**
   - Style the popup (300x400px)
   - Make toggle switch prominent
   - Follow modern, clean design

### Phase 2: Core Features
After MVP is working:

1. **utils/storage.js**
   - Implement storage wrapper functions
   - Handle sync vs local storage

2. **background/rule-engine.js**
   - Dynamic rule management
   - Whitelist implementation

3. **content/cosmetic-filter.js**
   - Hide ad containers
   - Implement efficient DOM observation

4. **settings/** (all files)
   - Create settings page UI
   - Implement whitelist management

### Key Technical Notes

1. **Permissions**: Start minimal, only add what's needed
2. **Performance**: Keep service worker lightweight
3. **Storage**: Use chrome.storage.sync for whitelist (cross-device sync)
4. **Rules Format**: Follow declarativeNetRequest API format exactly
5. **Error Handling**: Wrap all async operations in try-catch

## Testing During Development

1. After creating each component, load the extension in Chrome
2. Check console for errors (both extension and page console)
3. Test on these sites first:
   - google.com (search ads)
   - cnn.com (display ads)
   - youtube.com (video ads)

## Common Pitfalls to Avoid

1. Don't use Manifest V2 APIs (they're deprecated)
2. Don't fetch remote code (violates Chrome policies)
3. Don't collect user data
4. Keep service worker stateless (it can be terminated anytime)
5. Test memory usage regularly

## Chrome APIs to Use

- `chrome.declarativeNetRequest` - For blocking
- `chrome.storage` - For settings/whitelist
- `chrome.tabs` - For current tab info
- `chrome.action` - For badge updates

## File Naming Conventions

- Use kebab-case for files: `service-worker.js`
- Use camelCase for functions: `updateBadgeCount()`
- Use UPPER_CASE for constants: `MAX_RULES`

Start with Phase 1 and test thoroughly before moving to Phase 2!