# Web2MD - Multiplatform Web to Markdown Ecosystem

> Modern **Chrome Extension** & **Mobile App (Android & iOS)** that converts web pages into clean, well-formatted Markdown (`.md`) files. Perfect for documentation, note-taking apps (Obsidian, Notion, Logseq), knowledge bases, and AI prompt engineering.

---

## 📱 Ecosystem Architecture

Web2MD operates as a unified multiplatform ecosystem:

```text
Web2MD/
├── dist/                         # Compiled Chrome Extension distribution (Manifest v3)
├── public/                       # Extension Manifest and icons
├── src/                          # Chrome Extension & Shared Engine (Preserved & Active)
│   ├── background/               # Service worker and context menu listeners
│   ├── content/                  # Active DOM injection & content script
│   ├── core/                     # Domain conversion, cleaning, and sanitization algorithms
│   ├── options/                  # Settings and preferences page
│   ├── popup/                    # Main extension popup interface
│   └── shared/                   # Shared types and configuration defaults
│
├── mobile/                       # Web2MD Mobile Application (React Native & Expo)
│   ├── App.tsx                   # Main mobile application entry with bottom navigation
│   ├── app.json                  # Expo mobile configuration (Android & iOS metadata)
│   ├── package.json              # Mobile dependencies & build scripts
│   ├── tsconfig.json             # TypeScript configuration for mobile
│   ├── assets/                   # App icons, splash screens, and adaptive assets
│   └── src/
│       ├── components/           # Mobile UI components (Header, StatsBar, MarkdownViewer, QuickToggles)
│       ├── screens/              # Screens (ConvertScreen, EditorScreen, HistoryScreen, SettingsScreen)
│       ├── services/             # Native mobile services (fetcher, storage, exporter)
│       ├── core/                 # Shared Markdown, filename, and cleaning logic
│       └── types/                # Strict TypeScript definitions
│
├── package.json                  # Root scripts for extension and mobile
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🌟 Key Features

| Feature | Chrome Extension | Mobile App (Android & iOS) |
| :--- | :--- | :--- |
| **Input Source** | Active browser tab / selection | URL input, Clipboard paste & Raw HTML/Text |
| **Extraction Engine** | Mozilla Readability on active DOM | Remote HTML Fetcher & DOM extractor |
| **Markdown Conversion** | Turndown + GFM + Custom Language Blocks | Turndown + GFM + Custom Language Blocks |
| **YAML Frontmatter** | Title, URL, Date, Author, Domain | Title, URL, Date, Author, Domain |
| **Real-time Metrics** | Words, Chars, Reading Time, Images, Links | Words, Chars, Reading Time, Images, Links |
| **Editor & Live Preview** | Dual tab view (Editor / Preview) | Dual tab view (Editor / Preview) |
| **Export Options** | Local File Download (`.md`) & Clipboard Copy | Native Share Sheet, File Export & Clipboard Copy |
| **Offline History** | Session based | Local Conversion History with search/restore |
| **Custom Preferences** | Chrome Sync Storage | AsyncStorage persistent preferences |

---

## 🚀 Running the Project

### 1. Chrome Extension

#### Build Extension
```bash
# Install dependencies
npm install

# Build production bundle for Chrome/Edge
npm run build
```
The compiled extension will be output to the `dist/` directory.

#### Load in Chrome / Edge
1. Open Chrome and navigate to `chrome://extensions/` (or `edge://extensions/`).
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the `dist/` folder.

---

### 2. Mobile Smartphone App (Android & iOS)

#### Start Expo Dev Server
```bash
# From repository root
npm run mobile

# Or navigate directly to the mobile folder
cd mobile
npm start
```

#### Run on Android
```bash
npm run mobile:android
# Or inside mobile/: npm run android
```

#### Run on iOS
```bash
npm run mobile:ios
# Or inside mobile/: npm run ios
```

#### Build Native Android Package (.apk / .aab)
To generate an Android APK using Expo EAS:
```bash
cd mobile
npx eas-cli build --platform android --profile preview
```

#### Build Native iOS Package (.ipa)
```bash
cd mobile
npx eas-cli build --platform ios
```

---

## ⌨️ Shortcuts (Desktop Extension)

| Platform | Shortcut | Action |
| --- | --- | --- |
| Windows / Linux | `Alt + Shift + M` | Open Web2MD popup on active tab |
| macOS | `Option + Shift + M` | Open Web2MD popup on active tab |

---

## 🔒 Security & Privacy

- 100% Client-side processing: Content extraction and markdown conversion execute entirely on your device.
- No third-party tracking, analytics, or telemetry.
- Secure tokenless local storage for preferences and history.

---

## 📄 License

[MIT License](LICENSE) © 2026 Web2MD Project
