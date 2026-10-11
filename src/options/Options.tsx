import { useEffect, useState } from 'react';
import { FileCode, Sliders, FolderDown, Save, FileText, ExternalLink } from 'lucide-react';
import { getStoredSettings, saveStoredSettings } from '../core/storage';
import { UserSettings, DEFAULT_SETTINGS } from '../shared/types';

export default function Options() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState<boolean>(false);
  const [fileAccessAllowed, setFileAccessAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    getStoredSettings().then((s) => setSettings(s));
    if (typeof chrome !== 'undefined' && chrome.extension?.isAllowedFileSchemeAccess) {
      chrome.extension.isAllowedFileSchemeAccess((allowed) => {
        setFileAccessAllowed(Boolean(allowed));
      });
    }
  }, []);

  async function handleSave() {
    await saveStoredSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function updateField<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
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
          chrome.tabs.create({ url: isEdge ? 'edge://extensions' : 'chrome://extensions' });
        }
      });
    }
  }

  return (
    <div className="options-container">
      <header className="options-header">
        <div className="brand-icon">M↓</div>
        <div className="header-text">
          <h1>Web2MD Settings</h1>
          <p>Configure default HTML to Markdown conversion preferences and export rules.</p>
        </div>
      </header>

      {/* Content & Metadata Section */}
      <div className="section-card">
        <div className="section-title">
          <Sliders size={18} />
          Content & Metadata Defaults
        </div>

        <div className="option-row">
          <div className="option-info">
            <span className="option-label">Include YAML Frontmatter</span>
            <span className="option-desc">Add structured metadata header (title, URL, date, author, domain) at top of file</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.includeFrontmatter}
              onChange={(e) => updateField('includeFrontmatter', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="option-row">
          <div className="option-info">
            <span className="option-label">Include Images</span>
            <span className="option-desc">Convert HTML `&lt;img&gt;` tags into Markdown image syntax `![alt](url)`</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.includeImages}
              onChange={(e) => updateField('includeImages', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="option-row">
          <div className="option-info">
            <span className="option-label">Include Hyperlinks</span>
            <span className="option-desc">Convert HTML `&lt;a&gt;` links into Markdown syntax `[anchor](url)`</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.includeLinks}
              onChange={(e) => updateField('includeLinks', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* Markdown Syntax Format Section */}
      <div className="section-card">
        <div className="section-title">
          <FileCode size={18} />
          Markdown Syntax Styling
        </div>

        <div className="option-row">
          <div className="option-info">
            <span className="option-label">Heading Style</span>
            <span className="option-desc">Use ATX style (`# Heading`) or Setext style (`Heading\n===`)</span>
          </div>
          <select
            className="form-control"
            value={settings.headingStyle}
            onChange={(e) => updateField('headingStyle', e.target.value as any)}
          >
            <option value="atx">ATX (# Heading)</option>
            <option value="setext">Setext (Underlined)</option>
          </select>
        </div>

        <div className="option-row">
          <div className="option-info">
            <span className="option-label">Bullet List Marker</span>
            <span className="option-desc">Symbol used for unordered bullet lists</span>
          </div>
          <select
            className="form-control"
            value={settings.bulletListMarker}
            onChange={(e) => updateField('bulletListMarker', e.target.value as any)}
          >
            <option value="-">Hyphen (-)</option>
            <option value="*">Asterisk (*)</option>
            <option value="+">Plus (+)</option>
          </select>
        </div>

        <div className="option-row">
          <div className="option-info">
            <span className="option-label">Code Block Fence</span>
            <span className="option-desc">Delimiter character for code blocks</span>
          </div>
          <select
            className="form-control"
            value={settings.fence}
            onChange={(e) => updateField('fence', e.target.value as any)}
          >
            <option value="```">Backticks (```)</option>
            <option value="~~~">Tildes (~~~)</option>
          </select>
        </div>
      </div>

      {/* Export & Download Options */}
      <div className="section-card">
        <div className="section-title">
          <FolderDown size={18} />
          Export & Download Rules
        </div>

        <div className="option-row">
          <div className="option-info">
            <span className="option-label">Default Subfolder</span>
            <span className="option-desc">Subfolder inside default Downloads directory (leave blank for root Downloads)</span>
          </div>
          <input
            type="text"
            className="form-control"
            style={{ width: '220px' }}
            placeholder="e.g. Web2MD"
            value={settings.downloadFolder}
            onChange={(e) => updateField('downloadFolder', e.target.value)}
          />
        </div>
      </div>

      {/* Local Files Permission Section */}
      <div className="section-card">
        <div className="section-title">
          <FileText size={18} />
          Local Files Support (file:///)
        </div>

        <div className="option-row">
          <div className="option-info">
            <span className="option-label">Browser File URL Permission</span>
            <span className="option-desc">
              {fileAccessAllowed === true
                ? 'Active: Web2MD has permission to convert local files (file://) in your browser.'
                : fileAccessAllowed === false
                ? 'Inactive: Edge/Chrome blocks extensions from reading local files until enabled in extension settings.'
                : 'Check or enable "Allow access to file URLs" in browser extension settings.'}
            </span>
          </div>
          <button
            type="button"
            className="btn-outline"
            onClick={openExtensionDetails}
          >
            <ExternalLink size={13} />
            {fileAccessAllowed === true ? 'Manage in Browser' : 'Enable in Browser'}
          </button>
        </div>
      </div>

      {/* Save Actions */}
      <div className="options-footer">
        {saved ? <span className="save-status">Settings saved successfully!</span> : <span />}
        <button className="btn-save" onClick={handleSave}>
          <Save size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
          Save Preferences
        </button>
      </div>
    </div>
  );
}
