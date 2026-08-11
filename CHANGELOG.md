# Changelog

All notable changes to the Web2MD extension project will be documented in this file.

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
