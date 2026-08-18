import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Edit3,
  Eye,
  Copy,
  Share2,
  Check,
  Globe,
  Download,
} from 'lucide-react-native';
import { ConversionResult, ExtractedPage, UserSettings } from '../types';
import { convertToMarkdown } from '../core/markdown';
import { StatsBar } from '../components/StatsBar';
import { QuickToggles } from '../components/QuickToggles';
import { MarkdownViewer } from '../components/MarkdownViewer';
import { copyToClipboard, shareMarkdownFile } from '../services/exporter';
import { saveMobileSettings } from '../services/storage';

interface EditorScreenProps {
  extracted: ExtractedPage | null;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

export const EditorScreen: React.FC<EditorScreenProps> = ({
  extracted,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [customMarkdown, setCustomMarkdown] = useState<string>('');
  const [filename, setFilename] = useState<string>('web2md_doc.md');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Recalculate markdown whenever extracted data or settings change
  useEffect(() => {
    if (extracted) {
      const res = convertToMarkdown(extracted, settings);
      setResult(res);
      setCustomMarkdown(res.markdown);
      setFilename(res.suggestedFilename);
    }
  }, [extracted, settings]);

  async function handleToggleFrontmatter(val: boolean) {
    const updated = await saveMobileSettings({ includeFrontmatter: val });
    onUpdateSettings(updated);
  }

  async function handleToggleImages(val: boolean) {
    const updated = await saveMobileSettings({ includeImages: val });
    onUpdateSettings(updated);
  }

  async function handleCopy() {
    if (!customMarkdown) return;
    const success = await copyToClipboard(customMarkdown);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }

  async function handleShare() {
    if (!customMarkdown) return;
    await shareMarkdownFile(customMarkdown, filename);
  }

  if (!extracted) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBadge}>
          <Edit3 size={32} color="#6366F1" />
        </View>
        <Text style={styles.emptyTitle}>No Document Loaded</Text>
        <Text style={styles.emptyDesc}>
          Convert a web URL or paste HTML content in the "Convert" tab to view and edit Markdown here.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* URL & Domain Bar */}
      <View style={styles.urlBar}>
        <Globe size={13} color="#818CF8" />
        <Text style={styles.urlDomain} numberOfLines={1}>
          {extracted.domain}
        </Text>
        <Text style={styles.urlPath} numberOfLines={1}>
          {extracted.url}
        </Text>
      </View>

      {/* Stats Bar */}
      <StatsBar result={result} />

      {/* Controls Bar: Tabs & Quick Toggles */}
      <View style={styles.controlsBar}>
        <View style={styles.tabButtons}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'editor' && styles.tabBtnActive]}
            onPress={() => setActiveTab('editor')}
            activeOpacity={0.7}
          >
            <Edit3 size={13} color={activeTab === 'editor' ? '#818CF8' : '#94A3B8'} />
            <Text style={[styles.tabBtnText, activeTab === 'editor' && styles.tabBtnTextActive]}>
              Editor
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'preview' && styles.tabBtnActive]}
            onPress={() => setActiveTab('preview')}
            activeOpacity={0.7}
          >
            <Eye size={13} color={activeTab === 'preview' ? '#818CF8' : '#94A3B8'} />
            <Text style={[styles.tabBtnText, activeTab === 'preview' && styles.tabBtnTextActive]}>
              Preview
            </Text>
          </TouchableOpacity>
        </View>

        <QuickToggles
          includeFrontmatter={settings.includeFrontmatter}
          includeImages={settings.includeImages}
          onToggleFrontmatter={handleToggleFrontmatter}
          onToggleImages={handleToggleImages}
        />
      </View>

      {/* Main View Area */}
      <View style={styles.mainArea}>
        {activeTab === 'editor' ? (
          <TextInput
            style={styles.editorInput}
            value={customMarkdown}
            onChangeText={(txt) => {
              setCustomMarkdown(txt);
              // Recalculate word counts locally
              const words = txt.match(/\S+/g) || [];
              if (result) {
                setResult({
                  ...result,
                  markdown: txt,
                  wordCount: words.length,
                  charCount: txt.length,
                  readingTimeMinutes: Math.max(1, Math.ceil(words.length / 200)),
                });
              }
            }}
            multiline
            placeholder="Markdown content will appear here..."
            placeholderTextColor="#64748B"
            textAlignVertical="top"
          />
        ) : (
          <MarkdownViewer markdown={customMarkdown} />
        )}

        {copied && (
          <View style={styles.toast}>
            <Check size={14} color="#10B981" />
            <Text style={styles.toastText}>Copied to Clipboard!</Text>
          </View>
        )}
      </View>

      {/* Footer Controls */}
      <View style={styles.footer}>
        <View style={styles.filenameWrapper}>
          <TextInput
            style={styles.filenameInput}
            value={filename}
            onChangeText={setFilename}
            placeholder="filename.md"
            placeholderTextColor="#64748B"
          />
        </View>

        <TouchableOpacity style={styles.btnSecondary} onPress={handleCopy} activeOpacity={0.7}>
          {copied ? <Check size={15} color="#10B981" /> : <Copy size={15} color="#F1F5F9" />}
          <Text style={[styles.btnSecondaryText, copied && { color: '#10B981' }]}>
            {copied ? 'Copied' : 'Copy'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleShare} activeOpacity={0.8}>
          <Share2 size={15} color="#FFFFFF" />
          <Text style={styles.btnPrimaryText}>Share / Save</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#090D16',
  },
  emptyIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDesc: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  urlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F19',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  urlDomain: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '700',
  },
  urlPath: {
    color: '#64748B',
    fontSize: 12,
    flex: 1,
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  tabButtons: {
    flexDirection: 'row',
    backgroundColor: '#090D16',
    borderRadius: 8,
    padding: 3,
    gap: 4,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 5,
  },
  tabBtnActive: {
    backgroundColor: '#1E293B',
  },
  tabBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#F8FAFC',
  },
  mainArea: {
    flex: 1,
    position: 'relative',
  },
  editorInput: {
    flex: 1,
    backgroundColor: '#090D16',
    color: '#E2E8F0',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    padding: 16,
    lineHeight: 20,
  },
  toast: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    borderColor: '#059669',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  toastText: {
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 8,
  },
  filenameWrapper: {
    flex: 1,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    justifyContent: 'center',
  },
  filenameInput: {
    color: '#F8FAFC',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnSecondaryText: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
