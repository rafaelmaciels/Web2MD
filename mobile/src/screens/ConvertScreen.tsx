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
import { Ionicons } from '@expo/vector-icons';
import { ExtractedPage, UserSettings } from '../types';
import { fetchAndExtractUrl, extractFromHtmlString, extractFromRawText } from '../services/fetcher';
import { pasteFromClipboard } from '../services/exporter';
import { convertToMarkdown } from '../core/markdown';
import { addHistoryItem } from '../services/storage';

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

  const sampleUrls = [
    { title: 'Wikipedia (Markdown)', url: 'https://en.wikipedia.org/wiki/Markdown' },
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
        setErrorMsg('Please enter or paste a valid web URL.');
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
        setErrorMsg(err?.message || 'Failed to fetch and convert the web page.');
      }
    } else {
      if (!rawInput.trim()) {
        setErrorMsg('Please paste HTML or text content to convert.');
        return;
      }

      setLoading(true);
      try {
        let extracted: ExtractedPage;
        if (rawInput.includes('<') && rawInput.includes('>')) {
          extracted = extractFromHtmlString(rawInput, 'manual://html', 'HTML Input');
          if (rawTitle.trim()) {
            extracted.title = rawTitle.trim();
            extracted.metadata.title = rawTitle.trim();
          }
        } else {
          extracted = extractFromRawText(rawInput, rawTitle || 'Manual Note');
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
        setErrorMsg(err?.message || 'Failed to process manual content.');
      }
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Mode Switcher */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'url' && styles.modeTabActive]}
            onPress={() => {
              setMode('url');
              setErrorMsg(null);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="globe-outline" size={15} color={mode === 'url' ? '#818CF8' : '#64748B'} />
            <Text style={[styles.modeTabText, mode === 'url' && styles.modeTabTextActive]}>
              Web URL
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, mode === 'raw' && styles.modeTabActive]}
            onPress={() => {
              setMode('raw');
              setErrorMsg(null);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="code-slash-outline" size={15} color={mode === 'raw' ? '#818CF8' : '#64748B'} />
            <Text style={[styles.modeTabText, mode === 'raw' && styles.modeTabTextActive]}>
              HTML / Text
            </Text>
          </TouchableOpacity>
        </View>

        {/* URL Mode */}
        {mode === 'url' ? (
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Enter Web Article URL</Text>
            <View style={styles.inputRow}>
              <Ionicons name="globe-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="https://example.com/article..."
                placeholderTextColor="#64748B"
                value={urlInput}
                onChangeText={setUrlInput}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="go"
                onSubmitEditing={handleConvert}
              />
              <TouchableOpacity style={styles.pasteBtn} onPress={handlePaste} activeOpacity={0.7}>
                <Ionicons name="clipboard-outline" size={14} color="#A5B4FC" />
                <Text style={styles.pasteBtnText}>Paste</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Samples */}
            <View style={styles.samplesSection}>
              <Text style={styles.samplesLabel}>Quick Samples:</Text>
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
            <Text style={styles.inputLabel}>Document Title (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.titleInput]}
              placeholder="e.g. My Saved Note"
              placeholderTextColor="#64748B"
              value={rawTitle}
              onChangeText={setRawTitle}
            />

            <View style={styles.rawHeaderRow}>
              <Text style={styles.inputLabel}>Paste HTML or Text Content</Text>
              <TouchableOpacity style={styles.pasteBtnSmall} onPress={handlePaste}>
                <Ionicons name="clipboard-outline" size={12} color="#A5B4FC" />
                <Text style={styles.pasteBtnTextSmall}>Paste</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Paste HTML tags or raw text here..."
              placeholderTextColor="#64748B"
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
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Convert Action Button */}
        <TouchableOpacity
          style={[styles.convertBtn, loading && styles.convertBtnDisabled]}
          onPress={handleConvert}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="sparkles" size={17} color="#FFFFFF" />
              <Text style={styles.convertBtnText}>Convert to Markdown</Text>
              <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        {/* Feature Highlights Card */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>What Web2MD does automatically:</Text>
          <View style={styles.featureItem}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>Cleans clutter, ads, navigation bars, and modals</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>Extracts YAML Frontmatter metadata (Author, URL, Date)</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>Formats Tables, Code Blocks with syntax & Lists (GFM)</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>Calculates reading time, word count & character metrics</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  modeTabActive: {
    backgroundColor: '#1E293B',
  },
  modeTabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: '#F8FAFC',
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    height: '100%',
  },
  titleInput: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 14,
  },
  textArea: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
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
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  pasteBtnText: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '600',
  },
  pasteBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  pasteBtnTextSmall: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '600',
  },
  samplesSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  samplesLabel: {
    color: '#64748B',
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
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sampleChipText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '500',
  },
  errorBox: {
    backgroundColor: '#450A0A',
    borderColor: '#DC2626',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  convertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 20,
  },
  convertBtnDisabled: {
    opacity: 0.6,
  },
  convertBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  featuresCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  featuresTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  featureCheck: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  featureText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
