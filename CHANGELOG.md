# Changelog

All notable changes to the Web2MD extension project will be documented in this file.

## [1.1.0] - 2026-10-11

### Added
- **Internationalization (i18n & l10n)**:
  - Added full multilingual engine with support for **English (Default)** and **Português (Brasil)**.
  - Added dedicated Language selector in Extension Settings with real-time UI switching.
  - Full Portuguese (Brazil) localization across Popup, Options, Context Menus, and Mobile screens.
  - Formatted dates and numbers localized using browser `Intl` APIs.
  - Added automated test script `verify-i18n.js` ensuring 100% key parity and fallback handling.
  - Reactive sync of language preferences across all active extension views and background service worker.

## [1.0.1] - 2026-10-11

### Added & Improved
- **Local Files Support (`file:///`)**:
  - Added `file:///*` match patterns to `content_scripts` and `host_permissions` in Manifest V3.
  - Implemented local file domain detection (`local file`) and automatic document title fallback from the file path.
  - Added browser permission check using `chrome.extension.isAllowedFileSchemeAccess`.
  - Added dedicated user onboarding card in Popup and Settings with direct link to enable "Allow access to file URLs" in Microsoft Edge and Google Chrome.
  - Enhanced background service worker with injection fallback for context menu actions on local documents.

## [1.0.0] - 2026-08-11

### Initial Release
- **Manifest V3 Core**: Fully compliant extension manifest for Google Chrome and Microsoft Edge.
- **Article Extraction Engine**: Powered by `@mozilla/readability` with DOM cleaning fallback.
- **HTML to Markdown Conversion**: Powered by `turndown` with GitHub Flavored Markdown (GFM) support for tables, code blocks, task lists, and quotes.
- **UI & UX**:
  - Live raw Markdown editor with syntax font.
  - Side-by-side or tabbed live Markdown preview.
  - Real-time content metrics (words, chars, reading time, image count, link count).
  - One-click Copy to Clipboard with visual toast confirmation.
  - Download `.md` file with sanitized, editable title.
  - Quick toggles for YAML Frontmatter metadata and Images.
- **Options & Settings**:
  - Sync settings via `chrome.storage.sync`.
  - Configurable heading styles, bullet markers, code block fences, and default download subfolders.
- **Context Menus & Shortcuts**:
  - Right-click page or text selection to convert.
  - Keyboard hotkey shortcut `Alt+Shift+M`.
