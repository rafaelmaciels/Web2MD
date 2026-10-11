# Privacy Policy for Web2MD

**Effective Date:** October 11, 2026  
**Last Updated:** October 11, 2026  

Web2MD ("we", "our", or "the extension") is an open-source browser extension designed to convert web pages and local HTML documents into clean Markdown (`.md`) format.

We take user privacy very seriously. This Privacy Policy describes how Web2MD handles your information.

---

### 1. No Data Collection
Web2MD **does not collect, store, track, monitor, transmit, or sell** any personal data, browsing history, user credentials, IP addresses, or document contents.

All operations performed by Web2MD take place **strictly locally within your browser**:
- **DOM Parsing & Extraction:** Mozilla Readability and Turndown run locally inside your browser tab.
- **Conversion to Markdown:** Markdown generation occurs entirely on your device.
- **File Downloads:** Exported `.md` files are saved directly to your local file system via standard browser download APIs.
- **Clipboard Actions:** Text copied to your clipboard stays on your machine.

---

### 2. Permissions Justification

Web2MD requests only the permissions strictly necessary to deliver its core functionality:
- `activeTab`: Used to access and extract the contents of the currently active browser tab when you click the extension icon.
- `scripting`: Used to inject the extraction content script into the active page when requested.
- `storage`: Used solely to preserve your personal formatting preferences (e.g. heading styles, bullet markers, frontmatter toggles) across browser sessions via `chrome.storage.sync`.
- `contextMenus`: Used to provide convenient right-click context menu shortcuts ("Convert page to Markdown" and "Convert selection to Markdown").
- `downloads`: Used to save the converted `.md` file to your Downloads folder.
- `clipboardWrite`: Used for the "Copy to Clipboard" button.
- `file:///*` & `<all_urls>`: Used to allow users to convert local HTML documents and active web pages when user explicitly grants access. No local file data leaves your machine.

---

### 3. Remote Code & Third-Party Services
- Web2MD does **not** load or execute remote code, external scripts, or third-party analytics trackers.
- All code is bundled within the extension package.

---

### 4. Open Source Transparency
Web2MD is free and open-source software. You can inspect the complete source code at:  
https://github.com/rafaelmaciels/Web2MD

---

### 5. Contact
If you have any questions or feedback regarding this Privacy Policy, please open an issue on GitHub:  
https://github.com/rafaelmaciels/Web2MD/issues
