import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConversionHistoryItem, DEFAULT_SETTINGS, UserSettings } from '../types';

const SETTINGS_KEY = '@web2md_settings_v1';
const HISTORY_KEY = '@web2md_history_v1';

// In-memory fallback for environments where native storage isn't initialized yet
let inMemorySettings: UserSettings = { ...DEFAULT_SETTINGS };
let inMemoryHistory: ConversionHistoryItem[] = [];

export async function getMobileSettings(): Promise<UserSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      inMemorySettings = { ...DEFAULT_SETTINGS, ...parsed };
      return inMemorySettings;
    }
  } catch (err) {
    console.warn('[Web2MD Storage] Failed to load settings from AsyncStorage:', err);
  }
  return inMemorySettings;
}

export async function saveMobileSettings(partial: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getMobileSettings();
  const updated: UserSettings = { ...current, ...partial };
  inMemorySettings = updated;

  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[Web2MD Storage] Failed to save settings to AsyncStorage:', err);
  }
  return updated;
}

export async function getMobileHistory(): Promise<ConversionHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        inMemoryHistory = list;
        return inMemoryHistory;
      }
    }
  } catch (err) {
    console.warn('[Web2MD Storage] Failed to load history:', err);
  }
  return inMemoryHistory;
}

export async function addHistoryItem(item: Omit<ConversionHistoryItem, 'id' | 'convertedAt'>): Promise<ConversionHistoryItem[]> {
  const history = await getMobileHistory();
  const newItem: ConversionHistoryItem = {
    ...item,
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    convertedAt: new Date().toISOString(),
  };

  // Keep latest 50 entries, filter out duplicate URLs if existing
  const filtered = history.filter((h) => h.url !== item.url || h.title !== item.title);
  const updated = [newItem, ...filtered].slice(0, 50);
  inMemoryHistory = updated;

  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[Web2MD Storage] Failed to add history item:', err);
  }
  return updated;
}

export async function deleteHistoryItem(id: string): Promise<ConversionHistoryItem[]> {
  const history = await getMobileHistory();
  const updated = history.filter((h) => h.id !== id);
  inMemoryHistory = updated;

  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[Web2MD Storage] Failed to delete history item:', err);
  }
  return updated;
}

export async function clearMobileHistory(): Promise<void> {
  inMemoryHistory = [];
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.warn('[Web2MD Storage] Failed to clear history:', err);
  }
}
