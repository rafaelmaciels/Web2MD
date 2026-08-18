import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ConversionResult, ExtractedPage, UserSettings } from '../types';
import { convertToMarkdown } from '../core/markdown';
import { StatsBar } from '../components/StatsBar';
import { QuickToggles } from '../components/QuickToggles';
import { MarkdownViewer } from '../components/MarkdownViewer';
import { copyToClipboard, shareMarkdownFile } from '../services/exporter';
import { saveMobileSettings } from '../services/storage';
import { THEME } from '../types/theme';

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
          <Feather name="edit-3" size={30} color={THEME.colors.primaryAccent} />
        </View>
        <Text style={styles.emptyTitle}>Nenhum Documento Carregado</Text>
        <Text style={styles.emptyDesc}>
          Converta uma URL da Web ou cole código HTML na aba "Converter" para visualizar e editar o Markdown aqui.
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
        <Feather name="globe" size={13} color={THEME.colors.primaryAccent} />
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
            <Feather
              name="edit-3"
              size={13}
              color={activeTab === 'editor' ? THEME.colors.primaryAccent : THEME.colors.textMuted}
            />
            <Text style={[styles.tabBtnText, activeTab === 'editor' && styles.tabBtnTextActive]}>
              Editor
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'preview' && styles.tabBtnActive]}
            onPress={() => setActiveTab('preview')}
            activeOpacity={0.7}
          >
            <Feather
              name="eye"
              size={13}
              color={activeTab === 'preview' ? THEME.colors.primaryAccent : THEME.colors.textMuted}
            />
            <Text style={[styles.tabBtnText, activeTab === 'preview' && styles.tabBtnTextActive]}>
              Prévia
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
            placeholder="O conteúdo em Markdown aparecerá aqui..."
            placeholderTextColor={THEME.colors.textMuted}
            textAlignVertical="top"
          />
        ) : (
          <MarkdownViewer markdown={customMarkdown} />
        )}

        {copied && (
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={16} color={THEME.colors.success} />
            <Text style={styles.toastText}>Copiado para a Área de Transferência!</Text>
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
            placeholder="nome_do_arquivo.md"
            placeholderTextColor={THEME.colors.textMuted}
          />
        </View>

        <TouchableOpacity style={styles.btnSecondary} onPress={handleCopy} activeOpacity={0.7}>
          <Feather
            name={copied ? 'check' : 'copy'}
            size={14}
            color={copied ? THEME.colors.success : THEME.colors.textPrimary}
          />
          <Text style={[styles.btnSecondaryText, copied && { color: THEME.colors.success }]}>
            {copied ? 'Copiado' : 'Copiar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleShare} activeOpacity={0.85}>
          <Feather name="share-2" size={14} color="#FFFFFF" />
          <Text style={styles.btnPrimaryText}>Compartilhar / Salvar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: THEME.colors.bg,
  },
  emptyIconBadge: {
    width: 64,
    height: 64,
    borderRadius: THEME.radius.xl,
    backgroundColor: THEME.colors.primaryBadgeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(123, 31, 162, 0.4)',
  },
  emptyTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDesc: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  urlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgHeader,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  urlDomain: {
    color: THEME.colors.primaryAccent,
    fontSize: 12,
    fontWeight: '700',
  },
  urlPath: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    flex: 1,
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgCard,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  tabButtons: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.bgInput,
    borderRadius: THEME.radius.sm,
    padding: 3,
    gap: 4,
    borderWidth: 1,
    borderColor: THEME.colors.border,
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
    backgroundColor: THEME.colors.bgButtonSecondary,
  },
  tabBtnText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: THEME.colors.textPrimary,
  },
  mainArea: {
    flex: 1,
    position: 'relative',
  },
  editorInput: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
    color: THEME.colors.textPrimary,
    fontSize: 13.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    padding: 16,
    lineHeight: 21,
  },
  toast: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.successBg,
    borderColor: THEME.colors.success,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  toastText: {
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgHeader,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    gap: 8,
  },
  filenameWrapper: {
    flex: 1,
    backgroundColor: THEME.colors.bgInput,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.sm,
    paddingHorizontal: 10,
    height: 40,
    justifyContent: 'center',
  },
  filenameInput: {
    color: THEME.colors.textPrimary,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgButtonSecondary,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: THEME.radius.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  btnSecondaryText: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: THEME.radius.sm,
    gap: 6,
    shadowColor: THEME.colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
