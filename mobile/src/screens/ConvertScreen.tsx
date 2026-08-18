import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ExtractedPage, UserSettings } from '../types';
import { fetchAndExtractUrl, extractFromHtmlString, extractFromRawText } from '../services/fetcher';
import { pasteFromClipboard } from '../services/exporter';
import { convertToMarkdown } from '../core/markdown';
import { addHistoryItem } from '../services/storage';
import { THEME } from '../types/theme';

interface ConvertScreenProps {
  settings: UserSettings;
  onConversionSuccess: (extracted: ExtractedPage) => void;
}

export const ConvertScreen: React.FC<ConvertScreenProps> = ({ settings, onConversionSuccess }) => {
  const [mode, setMode] = useState<'url' | 'raw'>('url');
  const [urlInput, setUrlInput] = useState<string>('');
  const [rawInput, setRawInput] = useState<string>('');
  const [rawTitle, setRawTitle] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  const sampleUrls = [
    { title: 'Wikipedia (Markdown)', url: 'https://pt.wikipedia.org/wiki/Markdown' },
    { title: 'GitHub Blog', url: 'https://github.blog/news-insights/' },
  ];

  async function handlePaste() {
    const text = await pasteFromClipboard();
    if (text) {
      if (mode === 'url') {
        setUrlInput(text.trim());
      } else {
        setRawInput(text);
      }
    }
  }

  async function handleConvert() {
    setErrorMsg(null);

    if (mode === 'url') {
      if (!urlInput.trim()) {
        setErrorMsg('Por favor, digite ou cole uma URL válida.');
        return;
      }

      setLoading(true);
      try {
        const extracted = await fetchAndExtractUrl(urlInput.trim());
        const result = convertToMarkdown(extracted, settings);

        // Save to conversion history
        await addHistoryItem({
          title: extracted.title,
          url: extracted.url,
          domain: extracted.domain,
          markdown: result.markdown,
          filename: result.suggestedFilename,
          wordCount: result.wordCount,
          readingTimeMinutes: result.readingTimeMinutes,
        });

        setLoading(false);
        onConversionSuccess(extracted);
      } catch (err: any) {
        setLoading(false);
        setErrorMsg(err?.message || 'Falha ao buscar e converter a página da web.');
      }
    } else {
      if (!rawInput.trim()) {
        setErrorMsg('Por favor, cole conteúdo HTML ou texto para converter.');
        return;
      }

      setLoading(true);
      try {
        let extracted: ExtractedPage;
        if (rawInput.includes('<') && rawInput.includes('>')) {
          extracted = extractFromHtmlString(rawInput, 'manual://html', 'Entrada HTML');
          if (rawTitle.trim()) {
            extracted.title = rawTitle.trim();
            extracted.metadata.title = rawTitle.trim();
          }
        } else {
          extracted = extractFromRawText(rawInput, rawTitle || 'Nota Manual');
        }

        const result = convertToMarkdown(extracted, settings);

        await addHistoryItem({
          title: extracted.title,
          url: extracted.url,
          domain: extracted.domain,
          markdown: result.markdown,
          filename: result.suggestedFilename,
          wordCount: result.wordCount,
          readingTimeMinutes: result.readingTimeMinutes,
        });

        setLoading(false);
        onConversionSuccess(extracted);
      } catch (err: any) {
        setLoading(false);
        setErrorMsg(err?.message || 'Falha ao processar o conteúdo manual.');
      }
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* A. Modern Segmented Control */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, mode === 'url' && styles.segmentBtnActive]}
            onPress={() => {
              setMode('url');
              setErrorMsg(null);
            }}
            activeOpacity={0.8}
          >
            <Feather
              name="globe"
              size={15}
              color={mode === 'url' ? THEME.colors.primaryAccent : THEME.colors.textMuted}
            />
            <Text style={[styles.segmentBtnText, mode === 'url' && styles.segmentBtnTextActive]}>
              URL da Web
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, mode === 'raw' && styles.segmentBtnActive]}
            onPress={() => {
              setMode('raw');
              setErrorMsg(null);
            }}
            activeOpacity={0.8}
          >
            <Feather
              name="code"
              size={15}
              color={mode === 'raw' ? THEME.colors.primaryAccent : THEME.colors.textMuted}
            />
            <Text style={[styles.segmentBtnText, mode === 'raw' && styles.segmentBtnTextActive]}>
              HTML / Texto
            </Text>
          </TouchableOpacity>
        </View>

        {/* B. Input Card */}
        {mode === 'url' ? (
          <View style={styles.card}>
            <Text style={styles.inputLabel}>DIGITE A URL DA PÁGINA OU ARTIGO</Text>
            <View
              style={[
                styles.inputRow,
                isInputFocused && styles.inputRowFocused,
              ]}
            >
              <Feather name="link" size={16} color={THEME.colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="https://exemplo.com/artigo..."
                placeholderTextColor={THEME.colors.textMuted}
                value={urlInput}
                onChangeText={setUrlInput}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="go"
                onSubmitEditing={handleConvert}
              />
              <TouchableOpacity style={styles.pasteBtn} onPress={handlePaste} activeOpacity={0.7}>
                <Feather name="clipboard" size={13} color={THEME.colors.primaryAccent} />
                <Text style={styles.pasteBtnText}>Colar</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Samples */}
            <View style={styles.samplesSection}>
              <Text style={styles.samplesLabel}>Exemplos Rápidos:</Text>
              <View style={styles.sampleChips}>
                {sampleUrls.map((s, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.sampleChip}
                    onPress={() => setUrlInput(s.url)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sampleChipText}>{s.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : (
          /* Raw HTML / Text Mode */
          <View style={styles.card}>
            <Text style={styles.inputLabel}>TÍTULO DO DOCUMENTO (OPCIONAL)</Text>
            <TextInput
              style={[styles.textInput, styles.titleInput]}
              placeholder="Ex: Minha Anotação Salva"
              placeholderTextColor={THEME.colors.textMuted}
              value={rawTitle}
              onChangeText={setRawTitle}
            />

            <View style={styles.rawHeaderRow}>
              <Text style={styles.inputLabel}>CONTEÚDO EM HTML OU TEXTO</Text>
              <TouchableOpacity style={styles.pasteBtnSmall} onPress={handlePaste}>
                <Feather name="clipboard" size={12} color={THEME.colors.primaryAccent} />
                <Text style={styles.pasteBtnTextSmall}>Colar</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Cole tags HTML ou texto bruto aqui..."
              placeholderTextColor={THEME.colors.textMuted}
              value={rawInput}
              onChangeText={setRawInput}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color="#FCA5A5" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* C. Primary Action CTA Button */}
        <TouchableOpacity
          style={[styles.convertBtn, loading && styles.convertBtnDisabled]}
          onPress={handleConvert}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="file-text" size={18} color="#FFFFFF" />
              <Text style={styles.convertBtnText}>Converter para Markdown</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        {/* D. Features Card */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>O que o Web2MD faz automaticamente:</Text>
          <View style={styles.featureItem}>
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={12} color={THEME.colors.success} />
            </View>
            <Text style={styles.featureText}>Remove poluição visual, anúncios, menus de navegação e popups</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={12} color={THEME.colors.success} />
            </View>
            <Text style={styles.featureText}>Extrai cabeçalho YAML Frontmatter com metadados (Autor, URL, Data)</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={12} color={THEME.colors.success} />
            </View>
            <Text style={styles.featureText}>Formata Tabelas, Blocos de Código com sintaxe e Listas (GFM)</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={12} color={THEME.colors.success} />
            </View>
            <Text style={styles.featureText}>Calcula tempo estimado de leitura, contagem de palavras e caracteres</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radius.lg,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    gap: 7,
  },
  segmentBtnActive: {
    backgroundColor: THEME.colors.bgButtonSecondary,
    borderWidth: 1,
    borderColor: 'rgba(123, 31, 162, 0.4)',
  },
  segmentBtnText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentBtnTextActive: {
    color: THEME.colors.textPrimary,
  },
  card: {
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
  },
  inputLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgInput,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 12,
    height: 50,
  },
  inputRowFocused: {
    borderColor: THEME.colors.primaryLight,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: THEME.colors.textPrimary,
    fontSize: 14,
    height: '100%',
  },
  titleInput: {
    backgroundColor: THEME.colors.bgInput,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 14,
  },
  textArea: {
    backgroundColor: THEME.colors.bgInput,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    padding: 12,
    height: 120,
  },
  rawHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgButtonSecondary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: THEME.radius.sm,
    gap: 5,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  pasteBtnText: {
    color: THEME.colors.primaryAccent,
    fontSize: 12,
    fontWeight: '600',
  },
  pasteBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgButtonSecondary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: THEME.radius.sm,
    gap: 4,
  },
  pasteBtnTextSmall: {
    color: THEME.colors.primaryAccent,
    fontSize: 11,
    fontWeight: '600',
  },
  samplesSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  samplesLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  sampleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sampleChip: {
    backgroundColor: THEME.colors.bgCardSecondary,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  sampleChipText: {
    color: '#E4E4E7',
    fontSize: 12,
    fontWeight: '500',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.dangerBg,
    borderColor: THEME.colors.danger,
    borderWidth: 1,
    borderRadius: THEME.radius.md,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    flex: 1,
  },
  convertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.lg,
    paddingVertical: 15,
    gap: 10,
    marginBottom: 20,
    shadowColor: THEME.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  convertBtnDisabled: {
    opacity: 0.6,
  },
  convertBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  featuresCard: {
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  featuresTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  checkBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: THEME.colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    borderWidth: 1,
    borderColor: THEME.colors.success,
  },
  featureText: {
    color: THEME.colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 19,
    flex: 1,
  },
});
