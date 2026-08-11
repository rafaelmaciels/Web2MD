import { convertToMarkdown } from '../core/markdown';
import { getStoredSettings } from '../core/storage';
import { ExtensionMessage, ExtensionResponse, ExtractedPage } from '../shared/types';

// Context menu setup on extension install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'web2md-convert-page',
    title: 'Web2MD: Convert page to Markdown',
    contexts: ['page'],
  });

  chrome.contextMenus.create({
    id: 'web2md-convert-selection',
    title: 'Web2MD: Convert selection to Markdown',
    contexts: ['selection'],
  });
});

// Handle Context Menu item clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id || !tab.url || isRestrictedUrl(tab.url)) {
    return;
  }

  try {
    const settings = await getStoredSettings();

    // Send extract content message to active tab content script
    chrome.tabs.sendMessage(
      tab.id,
      { type: info.menuItemId === 'web2md-convert-selection' ? 'GET_SELECTION' : 'EXTRACT_CONTENT' },
      async (response: ExtensionResponse<ExtractedPage>) => {
        if (!response || !response.success || !response.data) {
          console.warn('[Web2MD ServiceWorker] Extraction failed from content script');
          return;
        }

        const extracted = response.data;
        if (info.menuItemId === 'web2md-convert-selection' && info.selectionText) {
          extracted.selectionText = info.selectionText;
        }

        const result = convertToMarkdown(extracted, settings);

        // Auto download file
        downloadMarkdownFile(result.markdown, result.suggestedFilename, settings.downloadFolder);
      }
    );
  } catch (err) {
    console.error('[Web2MD ServiceWorker] Context menu handler error:', err);
  }
});

// Handle incoming messages from popup or options
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === 'TRIGGER_DOWNLOAD') {
    const { markdown, filename, subfolder } = message.payload || {};
    if (markdown && filename) {
      downloadMarkdownFile(markdown, filename, subfolder)
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }
  }
});

function downloadMarkdownFile(content: string, filename: string, subfolder?: string): Promise<number> {
  return new Promise((resolve, reject) => {
    // Data URI blob for clean download
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      
      let targetPath = filename;
      if (subfolder && subfolder.trim()) {
        const cleanSub = subfolder.trim().replace(/[\\/]+/g, '/').replace(/^\/|\/$/g, '');
        targetPath = `${cleanSub}/${filename}`;
      }

      chrome.downloads.download(
        {
          url: dataUrl,
          filename: targetPath,
          saveAs: false,
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(downloadId);
          }
        }
      );
    };

    reader.onerror = () => reject(new Error('Failed to encode Markdown content blob'));
    reader.readAsDataURL(blob);
  });
}

function isRestrictedUrl(url: string): boolean {
  return (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('https://chrome.google.com/webstore') ||
    url.startsWith('https://chromewebstore.google.com')
  );
}
