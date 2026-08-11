import { extractPageContent } from '../core/extractor';
import { ExtensionMessage, ExtensionResponse, ExtractedPage } from '../shared/types';

// Listen for messages from popup or background service worker
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(
    (
      message: ExtensionMessage,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: ExtensionResponse<ExtractedPage>) => void
    ) => {
      try {
        if (message.type === 'EXTRACT_CONTENT' || message.type === 'GET_SELECTION') {
          const extracted = extractPageContent(document);
          
          // Check for selected text
          const selection = window.getSelection()?.toString().trim();
          if (selection) {
            extracted.selectionText = selection;
          }

          sendResponse({
            success: true,
            data: extracted,
          });
        } else {
          sendResponse({
            success: false,
            error: `Unknown message type: ${message.type}`,
          });
        }
      } catch (err) {
        console.error('[Web2MD Content Script] Extraction error:', err);
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Unknown extraction error',
        });
      }
      return true; // Keep response channel open for async response
    }
  );
}
