import { useEffect, useState } from 'react';
import { FileCode, Sliders, FolderDown, Save, FileText, ExternalLink, Globe } from 'lucide-react';
import { getStoredSettings, saveStoredSettings } from '../core/storage';
import { UserSettings, DEFAULT_SETTINGS, Language } from '../shared/types';
import { t } from '../shared/i18n';

export default function Options() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState<boolean>(false);
  const [fileAccessAllowed, setFileAccessAllowed] = useState<boolean | null>(null);

  const lang = settings.language || 'en';

  useEffect(() => {
    getStoredSettings().then((s) => {
      setSettings(s);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = s.language || 'en';
        document.title = s.language === 'pt-BR' ? 'Configurações do Web2MD' : 'Web2MD Settings';
      }
    });

    if (typeof chrome !== 'undefined' && chrome.extension?.isAllowedFileSchemeAccess) {
      chrome.extension.isAllowedFileSchemeAccess((allowed) => {
        setFileAccessAllowed(Boolean(allowed));
      });
    }

    // Sync if settings change in another tab / popup
    const handleStorageChange = (_changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'sync') {
        getStoredSettings().then((updated) => setSettings(updated));
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

  async function handleSave() {
    await saveStoredSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function updateField<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleLanguageChange(newLang: Language) {
    const updated = { ...settings, language: newLang };
    setSettings(updated);
    await saveStoredSettings({ language: newLang });
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang;
      document.title = newLang === 'pt-BR' ? 'Configurações do Web2MD' : 'Web2MD Settings';
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
          <h1>{t(lang, 'options.headerTitle')}</h1>
          <p>{t(lang, 'options.headerDesc')}</p>
        </div>
      </header>

      {/* Language Selection Section */}
      <div className="section-card">
        <div className="section-title">
          <Globe size={18} />
          {t(lang, 'options.languageSectionTitle')}
        </div>

        <div className="option-row">
          <div className="option-info">
            <span className="option-label">{t(lang, 'options.languageLabel')}</span>
            <span className="option-desc">{t(lang, 'options.languageDesc')}</span>
          </div>
          <select
            className="form-control"
            value={lang}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            style={{ minWidth: '220px' }}
          >
            <option value="en">
              {lang === 'pt-BR' ? 'English (Default) — Inglês (Padrão)' : 'English (Default)'}
            </option>
            <option value="pt-BR">
              {lang === 'pt-BR' ? 'Português (Brasil)' : 'Português (Brasil)'}
            </option>
          </select>
        </div>
      </div>

      {/* Content & Metadata Section */}
      <div className="section-card">
        <div className="section-title">
          <Sliders size={18} />
          {t(lang, 'options.contentSectionTitle')}
        </div>

        <div className="option-row">
          <div className="option-info">
            <span className="option-label">{t(lang, 'options.frontmatterLabel')}</span>
            <span className="option-desc">{t(lang, 'options.frontmatterDesc')}</span>
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
            <span className="option-label">{t(lang, 'options.imagesLabel')}</span>
            <span className="option-desc">{t(lang, 'options.imagesDesc')}</span>
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
            <span className="option-label">{t(lang, 'options.linksLabel')}</span>
            <span className="option-desc">{t(lang, 'options.linksDesc')}</span>
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
          {t(lang, 'options.syntaxSectionTitle')}
        </div>

        <div className="option-row">
          <div className="option-info">
            <span className="option-label">{t(lang, 'options.headingLabel')}</span>
            <span className="option-desc">{t(lang, 'options.headingDesc')}</span>
          </div>
          <select
            className="form-control"
            value={settings.headingStyle}
            onChange={(e) => updateField('headingStyle', e.target.value as any)}
          >
            <option value="atx">{t(lang, 'options.headingAtx')}</option>
            <option value="setext">{t(lang, 'options.headingSetext')}</option>
          </select>
        </div>

        <div className="option-row">
          <div className="option-info">
            <span className="option-label">{t(lang, 'options.bulletLabel')}</span>
            <span className="option-desc">{t(lang, 'options.bulletDesc')}</span>
          </div>
          <select
            className="form-control"
            value={settings.bulletListMarker}
            onChange={(e) => updateField('bulletListMarker', e.target.value as any)}
          >
            <option value="-">{t(lang, 'options.bulletHyphen')}</option>
            <option value="*">{t(lang, 'options.bulletAsterisk')}</option>
            <option value="+">{t(lang, 'options.bulletPlus')}</option>
          </select>
        </div>

        <div className="option-row">
          <div className="option-info">
            <span className="option-label">{t(lang, 'options.fenceLabel')}</span>
            <span className="option-desc">{t(lang, 'options.fenceDesc')}</span>
          </div>
          <select
            className="form-control"
            value={settings.fence}
            onChange={(e) => updateField('fence', e.target.value as any)}
          >
            <option value="```">{t(lang, 'options.fenceBackticks')}</option>
            <option value="~~~">{t(lang, 'options.fenceTildes')}</option>
          </select>
        </div>
      </div>

      {/* Export & Download Options */}
      <div className="section-card">
        <div className="section-title">
          <FolderDown size={18} />
          {t(lang, 'options.exportSectionTitle')}
        </div>

        <div className="option-row">
          <div className="option-info">
            <span className="option-label">{t(lang, 'options.subfolderLabel')}</span>
            <span className="option-desc">{t(lang, 'options.subfolderDesc')}</span>
          </div>
          <input
            type="text"
            className="form-control"
            style={{ width: '220px' }}
            placeholder={t(lang, 'options.subfolderPlaceholder')}
            value={settings.downloadFolder}
            onChange={(e) => updateField('downloadFolder', e.target.value)}
          />
        </div>
      </div>

      {/* Local Files Permission Section */}
      <div className="section-card">
        <div className="section-title">
          <FileText size={18} />
          {t(lang, 'options.localFilesSectionTitle')}
        </div>

        <div className="option-row">
          <div className="option-info">
            <span className="option-label">{t(lang, 'options.localFilesLabel')}</span>
            <span className="option-desc">
              {fileAccessAllowed === true
                ? t(lang, 'options.localFilesActiveDesc')
                : fileAccessAllowed === false
                ? t(lang, 'options.localFilesInactiveDesc')
                : t(lang, 'options.localFilesUnknownDesc')}
            </span>
          </div>
          <button
            type="button"
            className="btn-outline"
            onClick={openExtensionDetails}
          >
            <ExternalLink size={13} />
            {fileAccessAllowed === true ? t(lang, 'options.manageInBrowser') : t(lang, 'options.enableInBrowser')}
          </button>
        </div>
      </div>

      {/* Save Actions */}
      <div className="options-footer">
        {saved ? <span className="save-status">{t(lang, 'options.saveSuccess')}</span> : <span />}
        <button className="btn-save" onClick={handleSave}>
          <Save size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
          {t(lang, 'options.savePreferencesBtn')}
        </button>
      </div>
    </div>
  );
}
