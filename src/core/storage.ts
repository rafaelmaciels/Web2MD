import { DEFAULT_SETTINGS, UserSettings } from '../shared/types';

export async function getStoredSettings(): Promise<UserSettings> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
        if (chrome.runtime.lastError) {
          console.warn('[Web2MD Storage] Read error, falling back to defaults:', chrome.runtime.lastError);
          resolve(DEFAULT_SETTINGS);
        } else {
          resolve({ ...DEFAULT_SETTINGS, ...items });
        }
      });
    } else {
      // LocalStorage fallback for dev environment or non-extension contexts
      try {
        const stored = localStorage.getItem('web2md_settings');
        if (stored) {
          resolve({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
          return;
        }
      } catch (e) {
        console.warn('[Web2MD Storage] Local storage read error:', e);
      }
      resolve(DEFAULT_SETTINGS);
    }
  });
}

export async function saveStoredSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getStoredSettings();
  const updated: UserSettings = { ...current, ...settings };

  return new Promise((resolve, reject) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set(updated, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(updated);
        }
      });
    } else {
      try {
        localStorage.setItem('web2md_settings', JSON.stringify(updated));
        resolve(updated);
      } catch (e) {
        reject(e);
      }
    }
  });
}
