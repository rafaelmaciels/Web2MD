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
import { ConversionResult, ExtensionResponse, ExtractedPage, UserSettings, Language } from '../shared/types';
import { t } from '../shared/i18n';

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

  const lang: Language = settings?.language || 'en';

  useEffect(() => {
    initPopup();

    const handleStorageChange = (_changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'sync') {
        getStoredSettings().then((s) => setSettings(s));
      }
    };

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    return () => {
      if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
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
      const currentLang = loadedSettings.language || 'en';

      if (typeof document !== 'undefined') {
        document.documentElement.lang = currentLang;
        document.title = currentLang === 'pt-BR' ? 'Web2MD - Conversor Web para Markdown' : 'Web2MD - Web Page to Markdown';
      }

      // Query current active browser tab
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const isFileAllowed = await checkFileSchemeAccess();

        if (!tab || !tab.id) {
          setErrorMsg(t(currentLang, 'popup.errorNoActiveTab'));
          setLoading(false);
          return;
        }

        // Case 1: tab.url is missing (Edge/Chrome hides URL for file:// when permission is not allowed, or internal page)
        if (!tab.url) {
          if (!isFileAllowed) {
            setFileAccessPrompt(true);
            setErrorMsg(t(currentLang, 'popup.errorLocalFileDetected'));
          } else {
            setErrorMsg(t(currentLang, 'popup.errorNoActiveTab'));
          }
          setLoading(false);
          return;
        }

        // Case 2: tab.url is a local file (file://) but file access permission is not granted
        if (tab.url.startsWith('file://') && !isFileAllowed) {
          setFileAccessPrompt(true);
          setErrorMsg(t(currentLang, 'popup.errorLocalFileRestricted'));
          setLoading(false);
          return;
        }

        // Case 3: internal browser pages that cannot be accessed
        if (isRestrictedUrl(tab.url)) {
          setErrorMsg(t(currentLang, 'popup.errorInternalPage'));
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
          title: t(currentLang, 'popup.demoTitle'),
          contentHtml: t(currentLang, 'popup.demoContentHtml'),
          textContent: t(currentLang, 'popup.demoTextContent'),
          url: 'https://example.com/demo',
          domain: 'example.com',
          metadata: {
            title: t(currentLang, 'popup.demoTitle'),
            url: 'https://example.com/demo',
            domain: 'example.com',
            extractedAt: new Date().toISOString(),
          },
        };
        setExtracted(demoData);
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg(
        t(lang, 'popup.errorInitFailed', {
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      );
      setLoading(false);
    }
  }

  function injectAndExtract(tabId: number, tabUrl: string, loadedSettings: UserSettings) {
    const currentLang = loadedSettings.language || 'en';
    if (!chrome.scripting) {
      setErrorMsg(t(currentLang, 'popup.errorScriptingUnavailable'));
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
            setErrorMsg(t(currentLang, 'popup.errorLocalPermissionRequired'));
          } else {
            setErrorMsg(t(currentLang, 'popup.errorReadFailed', { error: errMsg }));
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
              setErrorMsg(t(currentLang, 'popup.errorExtractFailed'));
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
          <span className="brand-tag">v1.1.0</span>
        </div>
        <div className="header-actions">
          <button className="btn-icon" onClick={initPopup} title={t(lang, 'popup.refreshTooltip')}>
            <RefreshCw size={15} />
          </button>
          <button className="btn-icon" onClick={openOptionsPage} title={t(lang, 'popup.settingsTooltip')}>
            <Settings size={15} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="alert-box">
          <div className="spinner"></div>
          <p className="alert-title">{t(lang, 'popup.readingAndConverting')}</p>
        </div>
      ) : errorMsg ? (
        <div className="alert-box">
          <AlertTriangle className="alert-icon" />
          <p className="alert-title">
            {fileAccessPrompt
              ? t(lang, 'popup.localFileAccessRequiredTitle')
              : t(lang, 'popup.pageUnavailableTitle')}
          </p>
          <p className="alert-desc">{errorMsg}</p>
          {fileAccessPrompt && (
            <div className="file-access-card">
              <p className="file-access-tip">{t(lang, 'popup.localFileAccessTip')}</p>
              <ol className="file-access-steps">
                <li>{t(lang, 'popup.localFileStep1')}</li>
                <li>{t(lang, 'popup.localFileStep2')}</li>
                <li>{t(lang, 'popup.localFileStep3')}</li>
              </ol>
              <button className="btn-primary file-access-btn" onClick={openExtensionDetails}>
                <ExternalLink size={13} style={{ marginRight: '6px' }} />
                {t(lang, 'popup.openExtensionSettingsBtn')}
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
              <span className="url-domain">
                {extracted.domain === 'local file' ? t(lang, 'common.localFile') : extracted.domain}
              </span>
              <span className="url-path">{extracted.url}</span>
            </div>
          )}

          {/* Statistics Bar */}
          {result && (
            <div className="stats-bar">
              <div className="stat-item" title={t(lang, 'popup.wordCountTooltip')}>
                <FileText size={12} />
                <span>{t(lang, 'common.words')}:</span>
                <span className="stat-value">{result.wordCount}</span>
              </div>
              <div className="stat-item" title={t(lang, 'popup.charCountTooltip')}>
                <FileCode size={12} />
                <span>{t(lang, 'common.chars')}:</span>
                <span className="stat-value">{result.charCount}</span>
              </div>
              <div className="stat-item" title={t(lang, 'popup.readingTimeTooltip')}>
                <Clock size={12} />
                <span>{t(lang, 'common.time')}:</span>
                <span className="stat-value">
                  {result.readingTimeMinutes} {t(lang, 'common.min')}
                </span>
              </div>
              <div className="stat-item" title={t(lang, 'popup.imagesCountTooltip')}>
                <ImageIcon size={12} />
                <span className="stat-value">
                  {result.imageCount} {t(lang, 'common.imagesCount')}
                </span>
              </div>
              <div className="stat-item" title={t(lang, 'popup.linksCountTooltip')}>
                <LinkIcon size={12} />
                <span className="stat-value">
                  {result.linkCount} {t(lang, 'common.linksCount')}
                </span>
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
                  {t(lang, 'popup.tabEditor')}
                </button>
                <button
                  className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('preview')}
                >
                  <Eye size={13} />
                  {t(lang, 'popup.tabPreview')}
                </button>
              </div>

              <div className="quick-toggles">
                <label className="toggle-chip" title={t(lang, 'popup.frontmatterTooltip')}>
                  <input
                    type="checkbox"
                    checked={settings?.includeFrontmatter ?? true}
                    onChange={handleToggleFrontmatter}
                  />
                  {t(lang, 'popup.frontmatterToggle')}
                </label>
                <label className="toggle-chip" title={t(lang, 'popup.imagesTooltip')}>
                  <input
                    type="checkbox"
                    checked={settings?.includeImages ?? true}
                    onChange={handleToggleImages}
                  />
                  {t(lang, 'popup.imagesToggle')}
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
                  placeholder={t(lang, 'popup.editorPlaceholder')}
                />
              ) : (
                <div className="markdown-preview">
                  <SimpleMarkdownViewer markdown={customMarkdown} />
                </div>
              )}
            </div>

            {copied && <div className="toast-success">{t(lang, 'popup.copiedToast')}</div>}
          </div>

          {/* Footer Controls */}
          <footer className="app-footer">
            <div className="filename-input-wrapper">
              <input
                type="text"
                className="filename-input"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder={t(lang, 'popup.filenamePlaceholder')}
              />
            </div>
            <button className="btn-secondary" onClick={handleCopy} title={t(lang, 'popup.copyTooltip')}>
              {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              {copied ? t(lang, 'popup.copiedBtn') : t(lang, 'popup.copyBtn')}
            </button>
            <button className="btn-primary" onClick={handleDownload} title={t(lang, 'popup.saveTooltip')}>
              <Download size={14} />
              {t(lang, 'popup.saveBtn')}
            </button>
          </footer>
        </>
      )}
    </div>
  );
}

// Lightweight Markdown Preview Renderer with full Image & Media support
function SimpleMarkdownViewer({ markdown }: { markdown: string }) {
  if (!markdown) return null;

  const lines = markdown.split('\n');
  const elements: React.ReactNode[] = [];

  let inFrontmatter = false;
  let frontmatterBuffer: string[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // 1. YAML Frontmatter Detection
    if (i === 0 && line === '---') {
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter) {
      if (line === '---') {
        inFrontmatter = false;
        elements.push(
          <div key={`frontmatter-${i}`} className="preview-frontmatter">
            <div className="preview-frontmatter-tag">YAML FRONTMATTER</div>
            <pre>{frontmatterBuffer.join('\n')}</pre>
          </div>
        );
        frontmatterBuffer = [];
        continue;
      }
      frontmatterBuffer.push(rawLine);
      continue;
    }

    // 2. Multi-line Code Blocks
    if (line.startsWith('```') || line.startsWith('~~~')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        elements.push(
          <pre key={`code-${i}`}>
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // 3. Standalone Linked Image: [![alt](imgUrl)](linkUrl)
    const linkedImgMatch = line.match(
      /^\[!\[(.*?)\]\(\s*([^\s\)]+)(?:\s+["'][^"']*["'])?\s*\)\]\(\s*([^\s\)]+)(?:\s+["'][^"']*["'])?\s*\)$/
    );
    if (linkedImgMatch) {
      const altText = linkedImgMatch[1];
      const imgUrl = linkedImgMatch[2];
      const linkUrl = linkedImgMatch[3];
      elements.push(
        <div key={`linked-img-${i}`} className="preview-image-container">
          <a href={linkUrl} target="_blank" rel="noopener noreferrer" title={altText || linkUrl}>
            <img
              src={imgUrl}
              alt={altText}
              loading="lazy"
              onError={(e) => {
                const img = e.currentTarget;
                img.style.display = 'none';
                const parent = img.parentElement?.parentElement;
                const fallback = parent?.querySelector('.preview-image-fallback') as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          </a>
          <div className="preview-image-fallback" style={{ display: 'none' }}>
            <ImageIcon size={14} />
            <span>{altText || 'Imagem'} ({imgUrl})</span>
          </div>
          {altText && <span className="preview-image-caption">{altText}</span>}
        </div>
      );
      continue;
    }

    // 4. Standalone Image: ![alt](imgUrl)
    const imgMatch = line.match(/^!\[(.*?)\]\(\s*([^\s\)]+)(?:\s+["'][^"']*["'])?\s*\)$/);
    if (imgMatch) {
      const altText = imgMatch[1];
      const imgUrl = imgMatch[2];
      elements.push(
        <div key={`img-${i}`} className="preview-image-container">
          <img
            src={imgUrl}
            alt={altText}
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              img.style.display = 'none';
              const parent = img.parentElement;
              const fallback = parent?.querySelector('.preview-image-fallback') as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div className="preview-image-fallback" style={{ display: 'none' }}>
            <ImageIcon size={14} />
            <span>{altText || 'Imagem'} ({imgUrl})</span>
          </div>
          {altText && <span className="preview-image-caption">{altText}</span>}
        </div>
      );
      continue;
    }

    // 5. Headings
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i}>{renderInlineContent(line.substring(2))}</h1>);
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i}>{renderInlineContent(line.substring(3))}</h2>);
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i}>{renderInlineContent(line.substring(4))}</h3>);
      continue;
    }
    if (line.startsWith('#### ')) {
      elements.push(<h4 key={i}>{renderInlineContent(line.substring(5))}</h4>);
      continue;
    }
    if (line.startsWith('##### ')) {
      elements.push(<h5 key={i}>{renderInlineContent(line.substring(6))}</h5>);
      continue;
    }
    if (line.startsWith('###### ')) {
      elements.push(<h6 key={i}>{renderInlineContent(line.substring(7))}</h6>);
      continue;
    }

    // 6. Blockquote
    if (line.startsWith('> ')) {
      elements.push(<blockquote key={i}>{renderInlineContent(line.substring(2))}</blockquote>);
      continue;
    }

    // 7. Horizontal Rule
    if (line === '---' || line === '***' || line === '___') {
      elements.push(<hr key={i} />);
      continue;
    }

    // 8. Lists
    if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ')) {
      elements.push(<li key={i}>{renderInlineContent(line.substring(2))}</li>);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      elements.push(<li key={i}>{renderInlineContent(line.replace(/^\d+\.\s/, ''))}</li>);
      continue;
    }

    // 9. Blank line
    if (!line) {
      elements.push(<br key={i} />);
      continue;
    }

    // 10. Regular Paragraph with inline formatting
    elements.push(<p key={i}>{renderInlineContent(rawLine)}</p>);
  }

  // Handle unclosed code block if any
  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <pre key="unclosed-code">
        <code>{codeBuffer.join('\n')}</code>
      </pre>
    );
  }

  return <div>{elements}</div>;
}

// Inline Markdown Parser for bold, italic, inline code, links and inline images
function renderInlineContent(text: string): React.ReactNode {
  const pattern = /(!?\[.*?\]\([^\s\)]+(?:\s+["'][^"']*["'])?\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    if (!part) return null;

    // Inline image: ![alt](url)
    const imgMatch = part.match(/^!\[(.*?)\]\(\s*([^\s\)]+)(?:\s+["'](.*?)["'])?\s*\)$/);
    if (imgMatch) {
      const alt = imgMatch[1];
      const src = imgMatch[2];
      return (
        <img
          key={index}
          src={src}
          alt={alt}
          className="inline-image"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      );
    }

    // Inline link: [text](url)
    const linkMatch = part.match(/^\[(.*?)\]\(\s*([^\s\)]+)(?:\s+["'](.*?)["'])?\s*\)$/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const href = linkMatch[2];
      return (
        <a key={index} href={href} target="_blank" rel="noopener noreferrer">
          {linkText}
        </a>
      );
    }

    // Inline code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    return part;
  });
}
