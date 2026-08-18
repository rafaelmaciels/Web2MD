import { Share, Alert, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch (err) {
    console.warn('[Web2MD Mobile] Clipboard copy failed:', err);
    return false;
  }
}

export async function pasteFromClipboard(): Promise<string> {
  try {
    return await Clipboard.getStringAsync();
  } catch (err) {
    console.warn('[Web2MD Mobile] Clipboard read failed:', err);
    return '';
  }
}

export async function shareMarkdownFile(markdown: string, filename: string): Promise<void> {
  const safeFilename = filename.endsWith('.md') ? filename : `${filename}.md`;

  try {
    // If running in Expo / React Native environment with FileSystem
    if (FileSystem && FileSystem.documentDirectory) {
      const fileUri = `${FileSystem.documentDirectory}${safeFilename}`;
      await FileSystem.writeAsStringAsync(fileUri, markdown, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/markdown',
          dialogTitle: `Export ${safeFilename}`,
          UTI: 'net.daringfireball.markdown',
        });
        return;
      }
    }

    // Fallback to React Native text Share dialog
    await Share.share({
      title: safeFilename,
      message: markdown,
    });
  } catch (err: any) {
    console.error('[Web2MD Mobile] Share error:', err);
    Alert.alert('Export Error', err?.message || 'Could not export or share Markdown file.');
  }
}
