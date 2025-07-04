# Chrome Ad Blocker Extension

A lightweight, performant ad blocker Chrome extension built with Manifest V3. Blocks ads, trackers, and annoyances while maintaining website functionality.

## Features

- 🚫 **Ad Blocking**: Blocks ads from thousands of known ad-serving domains
- 🛡️ **Tracker Protection**: Prevents tracking scripts from monitoring your browsing
- ⚡ **Performance Focused**: Minimal impact on page load times (<50ms)
- 🎯 **Smart Filtering**: Cosmetic filtering to hide ad containers
- ⚙️ **User Control**: Easy whitelist management and per-site toggle
- 📊 **Statistics**: Track how many ads and trackers were blocked
- 🔒 **Privacy First**: No data collection, all processing done locally

## Project Structure

```
chrome-ad-blocker-extension/
├── manifest.json          # Extension manifest file
├── background/            # Service worker and core logic
├── content/               # Content scripts for cosmetic filtering
├── popup/                 # Extension popup UI
├── settings/              # Settings page
├── rules/                 # Filter lists (ads, trackers, annoyances)
├── icons/                 # Extension icons
├── utils/                 # Utility functions
└── PRD.md                 # Product Requirements Document
```

## Development Setup

### Prerequisites
- Chrome browser (version 88 or higher)
- Git
- Text editor (VS Code recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/johnautomates117/chrome-ad-blocker-extension.git
   cd chrome-ad-blocker-extension
   ```

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the project directory

3. The extension icon should appear in your toolbar!

## Usage

- **Toggle On/Off**: Click the extension icon and use the main toggle switch
- **Whitelist a Site**: Click "Pause on this site" in the popup
- **View Statistics**: See blocked items count in the popup
- **Access Settings**: Click the gear icon in the popup

## Development with Claude Code

This project includes a comprehensive PRD.md file that can be used with Claude Code for development. The PRD contains:

- Detailed technical specifications
- Implementation phases
- File structure and component descriptions
- Data schemas and API usage
- Testing requirements

To use with Claude Code:
1. Open Claude Code
2. Reference the PRD.md file
3. Follow the implementation phases outlined in the document

## Testing

### Manual Testing
- Test on popular websites (Google, YouTube, Facebook, news sites)
- Verify ads are blocked without breaking functionality
- Check performance impact using Chrome DevTools

### Test Sites
- https://www.google.com (search ads)
- https://www.youtube.com (video ads)
- https://www.forbes.com (banner ads)
- https://www.cnn.com (various ad types)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Filter lists inspired by EasyList and EasyPrivacy
- Built following Chrome Extension Manifest V3 best practices
- UI design inspired by popular ad blockers

## Support

If you encounter any issues or have suggestions:
1. Check existing issues on GitHub
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

---

**Note**: This extension is for educational purposes and personal use. Always respect website terms of service and consider supporting content creators through other means if you block their ads.