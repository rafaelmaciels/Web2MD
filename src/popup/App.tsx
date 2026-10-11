import React, { useEffect, useState } from 'react';
import {
  Copy,
  Download,
  FileText,
  Eye,
  Edit3,
  Settings,
  RefreshCw,
  AlertTriangle,
  Check,
  Globe,
  Clock,
  FileCode,
  Image as ImageIcon,
  Link as LinkIcon,
  ExternalLink,
} from 'lucide-react';
import { convertToMarkdown } from '../core/markdown';
import { getStoredSettings, saveStoredSettings } from '../core/storage';
import { ConversionResult, ExtensionResponse, ExtractedPage, UserSettings } from '../shared/types';

export default function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedPage | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [customMarkdown, setCustomMarkdown] = useState<string>('');
  const [filename, setFilename] = useState<string>('web2md_doc.md');
  const [copied, setCopied] = useState<boolean>(false);
  const [fileAccessPrompt, setFileAccessPrompt] = useState<boolean>(false);

  useEffect(() => {
    initPopup();
  }, []);

  // Re-run markdown conversion whenever settings or extracted page changes
  useEffect(() => {
    if (extracted && settings) {
      const res = convertToMarkdown(extracted, settings);
      setResult(res);
      setCustomMarkdown(res.markdown);
      setFilename(res.suggestedFilename);
    }
  }, [extracted, settings]);

  async function checkFileSchemeAccess(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.extension?.isAllowedFileSchemeAccess) {
        chrome.extension.isAllowedFileSchemeAccess((isAllowed) => {
          resolve(Boolean(isAllowed));
        });
      } else {
        resolve(false);
      }
    });
  }

  async function initPopup() {
    setLoading(true);
    setErrorMsg(null);
    setFileAccessPrompt(false);

    try {
      const loadedSettings = await getStoredSettings();
      setSettings(loadedSettings);

      // Query current active browser tab
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const isFileAllowed = await checkFileSchemeAccess();

        if (!tab || !tab.id) {
          setErrorMsg('No active web page detected.');
          setLoading(false);
          return;
        }

        // Case 1: tab.url is missing (Edge/Chrome hides URL for file:// when permission is not allowed, or internal page)
        if (!tab.url) {
          if (!isFileAllowed) {
            setFileAccessPrompt(true);
            setErrorMsg('Local file detected, but file access is not enabled in your browser settings.');
          } else {
            setErrorMsg('No active web page detected.');
          }
          setLoading(false);
          return;
        }

        // Case 2: tab.url is a local file (file://) but file access permission is not granted
        if (tab.url.startsWith('file://') && !isFileAllowed) {
          setFileAccessPrompt(true);
          setErrorMsg('Local file access is disabled in browser settings.');
          setLoading(false);
          return;
        }

        // Case 3: internal browser pages that cannot be accessed
        if (isRestrictedUrl(tab.url)) {
          setErrorMsg('Internal browser pages (chrome://, edge://, extensions) cannot be converted to Markdown.');
          setLoading(false);
          return;
        }

        // Send content extraction request to tab script or inject content script if needed
        chrome.tabs.sendMessage(
          tab.id,
          { type: 'EXTRACT_CONTENT' },
          (response: ExtensionResponse<ExtractedPage>) => {
            if (chrome.runtime.lastError || !response || !response.success) {
              // Try programmatic injection fallback if content script isn't loaded yet
              injectAndExtract(tab.id!, tab.url!, loadedSettings);
            } else {
              setExtracted(response.data!);
              setLoading(false);
            }
          }
        );
      } else {
        // Fallback demo state for standalone dev preview
        const demoData: ExtractedPage = {
          title: 'Welcome to Web2MD Extension',
          contentHtml: '<h1>Web2MD Demo</h1><p>Convert any web page to clean Markdown instantaneously.</p>',
          textContent: 'Welcome to Web2MD Extension. Convert any web page to clean Markdown instantaneously.',
          url: 'https://example.com/demo',
          domain: 'example.com',
          metadata: {
            title: 'Welcome to Web2MD Extension',
            url: 'https://example.com/demo',
            domain: 'example.com',
            extractedAt: new Date().toISOString(),
          },
        };
        setExtracted(demoData);
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to initialize Web2MD');
      setLoading(false);
    }
  }

  function injectAndExtract(tabId: number, tabUrl: string, _loadedSettings: UserSettings) {
    if (!chrome.scripting) {
      setErrorMsg('Scripting permission unavailable for active tab.');
      setLoading(false);
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId },
        files: ['content/index.js'],
      },
      () => {
        if (chrome.runtime.lastError) {
          const errMsg = chrome.runtime.lastError.message || '';
          if (tabUrl.startsWith('file://') || errMsg.toLowerCase().includes('file')) {
            setFileAccessPrompt(true);
            setErrorMsg('Local file access required: please ensure "Allow access to file URLs" is enabled.');
          } else {
            setErrorMsg(`Unable to read page content: ${errMsg}`);
          }
          setLoading(false);
          return;
        }

        // Retry sending extraction message
        chrome.tabs.sendMessage(
          tabId,
          { type: 'EXTRACT_CONTENT' },
          (response: ExtensionResponse<ExtractedPage>) => {
            if (response && response.success && response.data) {
              setExtracted(response.data);
            } else {
              setErrorMsg('Could not extract main article content from page.');
            }
            setLoading(false);
          }
        );
      }
    );
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

  async function handleToggleFrontmatter(e: React.ChangeEvent<HTMLInputElement>) {
    if (!settings) return;
    const updated = await saveStoredSettings({ includeFrontmatter: e.target.checked });
    setSettings(updated);
  }

  async function handleToggleImages(e: React.ChangeEvent<HTMLInputElement>) {
    if (!settings) return;
    const updated = await saveStoredSettings({ includeImages: e.target.checked });
    setSettings(updated);
  }

  async function handleCopy() {
    if (!customMarkdown) return;
    try {
      await navigator.clipboard.writeText(customMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }

  function handleDownload() {
    if (!customMarkdown) return;
    const safeName = filename.trim().endsWith('.md') ? filename.trim() : `${filename.trim()}.md`;

    if (typeof chrome !== 'undefined' && chrome.downloads) {
      const blob = new Blob([customMarkdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      chrome.downloads.download({
        url,
        filename: safeName,
        saveAs: false,
      });
    } else {
      // Browser fallback download
      const element = document.createElement('a');
      const file = new Blob([customMarkdown], { type: 'text/markdown;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = safeName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  }

  function openOptionsPage() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  }

  function openExtensionDetails() {
    const isEdge = typeof navigator !== 'undefined' && /Edg/i.test(navigator.userAgent);
    const extId = typeof chrome !== 'undefined' && chrome.runtime?.id ? chrome.runtime.id : '';
    const targetUrl = isEdge
      ? `edge://extensions/?id=${extId}`
      : `chrome://extensions/?id=${extId}`;

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: targetUrl }, () => {
        if (chrome.runtime.lastError) {
          chrome.tabs.create({ url: isEdge ? 'edge://extensions' : 'chrome://extensions' }, () => {
            if (chrome.runtime.lastError) {
              chrome.runtime.openOptionsPage?.();
            }
          });
        }
      });
    }
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">M↓</div>
          <span className="brand-title">Web2MD</span>
          <span className="brand-tag">v1.0.1</span>
        </div>
        <div className="header-actions">
          <button className="btn-icon" onClick={initPopup} title="Refresh Extraction">
            <RefreshCw size={15} />
          </button>
          <button className="btn-icon" onClick={openOptionsPage} title="Extension Settings">
            <Settings size={15} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="alert-box">
          <div className="spinner"></div>
          <p className="alert-title">Reading & Converting Page...</p>
        </div>
      ) : errorMsg ? (
        <div className="alert-box">
          <AlertTriangle className="alert-icon" />
          <p className="alert-title">{fileAccessPrompt ? 'Local File Access Required' : 'Page Unavailable'}</p>
          <p className="alert-desc">{errorMsg}</p>
          {fileAccessPrompt && (
            <div className="file-access-card">
              <p className="file-access-tip">
                Edge and Chrome require user permission to read local files (<code>file:///...</code>):
              </p>
              <ol className="file-access-steps">
                <li>Click <strong>&quot;Open Extension Settings&quot;</strong> below</li>
                <li>Toggle ON <strong>&quot;Allow access to file URLs&quot;</strong></li>
                <li>Return to your local file and click <strong>Refresh</strong> (or reopen Web2MD)</li>
              </ol>
              <button className="btn-primary file-access-btn" onClick={openExtensionDetails}>
                <ExternalLink size={13} style={{ marginRight: '6px' }} />
                Open Extension Settings
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* URL & Domain Bar */}
          {extracted && (
            <div className="url-bar">
              {extracted.url.startsWith('file://') ? (
                <FileCode size={13} className="url-domain" />
              ) : (
                <Globe size={13} className="url-domain" />
              )}
              <span className="url-domain">{extracted.domain}</span>
              <span className="url-path">{extracted.url}</span>
            </div>
          )}

          {/* Statistics Bar */}
          {result && (
            <div className="stats-bar">
              <div className="stat-item" title="Word count">
                <FileText size={12} />
                <span>Words:</span>
                <span className="stat-value">{result.wordCount}</span>
              </div>
              <div className="stat-item" title="Character count">
                <FileCode size={12} />
                <span>Chars:</span>
                <span className="stat-value">{result.charCount}</span>
              </div>
              <div className="stat-item" title="Reading time">
                <Clock size={12} />
                <span>Time:</span>
                <span className="stat-value">{result.readingTimeMinutes} min</span>
              </div>
              <div className="stat-item" title="Images count">
                <ImageIcon size={12} />
                <span className="stat-value">{result.imageCount} imgs</span>
              </div>
              <div className="stat-item" title="Links count">
                <LinkIcon size={12} />
                <span className="stat-value">{result.linkCount} links</span>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="content-area">
            {/* Tab Header & Quick Toggles */}
            <div className="tab-header">
              <div className="tabs">
                <button
                  className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
                  onClick={() => setActiveTab('editor')}
                >
                  <Edit3 size={13} />
                  Editor
                </button>
                <button
                  className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('preview')}
                >
                  <Eye size={13} />
                  Preview
                </button>
              </div>

              <div className="quick-toggles">
                <label className="toggle-chip" title="Include YAML Frontmatter metadata header">
                  <input
                    type="checkbox"
                    checked={settings?.includeFrontmatter ?? true}
                    onChange={handleToggleFrontmatter}
                  />
                  Frontmatter
                </label>
                <label className="toggle-chip" title="Include images in markdown output">
                  <input
                    type="checkbox"
                    checked={settings?.includeImages ?? true}
                    onChange={handleToggleImages}
                  />
                  Images
                </label>
              </div>
            </div>

            {/* Pane View */}
            <div className="pane">
              {activeTab === 'editor' ? (
                <textarea
                  className="markdown-editor"
                  value={customMarkdown}
                  onChange={(e) => setCustomMarkdown(e.target.value)}
                  placeholder="Markdown output will appear here..."
                />
              ) : (
                <div className="markdown-preview">
                  <SimpleMarkdownViewer markdown={customMarkdown} />
                </div>
              )}
            </div>

            {copied && <div className="toast-success">Copied to Clipboard!</div>}
          </div>

          {/* Footer Controls */}
          <footer className="app-footer">
            <div className="filename-input-wrapper">
              <input
                type="text"
                className="filename-input"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="filename.md"
              />
            </div>
            <button className="btn-secondary" onClick={handleCopy} title="Copy Markdown to Clipboard">
              {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button className="btn-primary" onClick={handleDownload} title="Download .md File">
              <Download size={14} />
              Save .md
            </button>
          </footer>
        </>
      )}
    </div>
  );
}

// Lightweight Markdown Preview Renderer
function SimpleMarkdownViewer({ markdown }: { markdown: string }) {
  if (!markdown) return null;

  const lines = markdown.split('\n');
  return (
    <div>
      {lines.map((line, idx) => {
        if (line.startsWith('# ')) return <h1 key={idx}>{line.substring(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={idx}>{line.substring(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={idx}>{line.substring(4)}</h3>;
        if (line.startsWith('#### ')) return <h4 key={idx}>{line.substring(5)}</h4>;
        if (line.startsWith('> ')) return <blockquote key={idx}>{line.substring(2)}</blockquote>;
        if (line.startsWith('```')) return <pre key={idx}><code>{line}</code></pre>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={idx}>{line.substring(2)}</li>;
        if (!line.trim()) return <br key={idx} />;
        return <p key={idx}>{line}</p>;
      })}
    </div>
  );
}
