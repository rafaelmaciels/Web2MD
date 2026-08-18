import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { THEME } from '../types/theme';

interface MarkdownViewerProps {
  markdown: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ markdown }) => {
  if (!markdown) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhum conteúdo Markdown para visualizar.</Text>
      </View>
    );
  }

  const lines = markdown.split('\n');
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let inFrontmatter = false;
  let frontmatterBuffer: string[] = [];

  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Frontmatter parsing
    if (i === 0 && line.trim() === '---') {
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter) {
      if (line.trim() === '---') {
        inFrontmatter = false;
        elements.push(
          <View key={`frontmatter-${i}`} style={styles.frontmatterCard}>
            <Text style={styles.frontmatterTag}>METADADOS YAML</Text>
            {frontmatterBuffer.map((fLine, fIdx) => (
              <Text key={`fline-${fIdx}`} style={styles.frontmatterText}>
                {fLine}
              </Text>
            ))}
          </View>
        );
        frontmatterBuffer = [];
        continue;
      }
      frontmatterBuffer.push(line);
      continue;
    }

    // Code block handling
    if (line.startsWith('```') || line.startsWith('~~~')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        elements.push(
          <View key={`code-${i}`} style={styles.codeBlock}>
            <Text style={styles.codeText}>{codeBuffer.join('\n')}</Text>
          </View>
        );
        codeBuffer = [];
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Linked image matching: [![alt](imgUrl)](linkUrl)
    const linkedImgMatch = line.trim().match(/^\[!\[(.*?)\]\((https?:\/\/[^\s\)]+)\)\]\((https?:\/\/[^\s\)]+)\)$/);
    if (linkedImgMatch) {
      const altText = linkedImgMatch[1];
      const imgUrl = linkedImgMatch[2];
      const linkUrl = linkedImgMatch[3];
      elements.push(
        <MarkdownImage key={`linked-img-${i}`} uri={imgUrl} alt={altText} linkUrl={linkUrl} />
      );
      continue;
    }

    // Image matching: ![alt](url)
    const imgMatch = line.trim().match(/^!\[(.*?)\]\((https?:\/\/[^\s\)]+)\)$/);
    if (imgMatch) {
      const altText = imgMatch[1];
      const imgUrl = imgMatch[2];
      elements.push(
        <MarkdownImage key={`img-${i}`} uri={imgUrl} alt={altText} />
      );
      continue;
    }

    // Headers
    if (line.startsWith('# ')) {
      elements.push(
        <Text key={`h1-${i}`} style={styles.h1}>
          {line.substring(2)}
        </Text>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <Text key={`h2-${i}`} style={styles.h2}>
          {line.substring(3)}
        </Text>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <Text key={`h3-${i}`} style={styles.h3}>
          {line.substring(4)}
        </Text>
      );
    } else if (line.startsWith('#### ')) {
      elements.push(
        <Text key={`h4-${i}`} style={styles.h4}>
          {line.substring(5)}
        </Text>
      );
    } else if (line.startsWith('> ')) {
      elements.push(
        <View key={`quote-${i}`} style={styles.quoteBox}>
          <Text style={styles.quoteText}>{line.substring(2)}</Text>
        </View>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ')) {
      elements.push(
        <View key={`li-${i}`} style={styles.listItem}>
          <Text style={styles.listBullet}>•</Text>
          <View style={styles.listTextContainer}>
            {renderFormattedInline(line.substring(2))}
          </View>
        </View>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+\.)\s(.*)/);
      elements.push(
        <View key={`numli-${i}`} style={styles.listItem}>
          <Text style={styles.listNumber}>{match ? match[1] : '1.'}</Text>
          <View style={styles.listTextContainer}>
            {renderFormattedInline(match ? match[2] : line)}
          </View>
        </View>
      );
    } else if (line.startsWith('|') && line.endsWith('|')) {
      // Table row
      elements.push(
        <View key={`tr-${i}`} style={styles.tableRow}>
          <Text style={styles.tableRowText}>{line}</Text>
        </View>
      );
    } else if (!line.trim()) {
      elements.push(<View key={`spacer-${i}`} style={styles.spacer} />);
    } else {
      elements.push(
        <View key={`p-${i}`} style={styles.paragraphContainer}>
          {renderFormattedInline(line)}
        </View>
      );
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {elements}
    </ScrollView>
  );
};

// Component for rendering visual images with loading state, link click & error fallback
const MarkdownImage: React.FC<{ uri: string; alt?: string; linkUrl?: string }> = ({
  uri,
  alt,
  linkUrl,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function handlePress() {
    if (linkUrl) {
      Linking.openURL(linkUrl).catch(() => {});
    }
  }

  if (error) {
    return (
      <View style={styles.imgErrorCard}>
        <Feather name="image" size={18} color={THEME.colors.textMuted} />
        <Text style={styles.imgErrorText} numberOfLines={1}>
          {alt || uri}
        </Text>
      </View>
    );
  }

  const isBadgeOrSmall = uri.includes('shields.io') || uri.includes('badge') || (alt && alt.length < 15);

  const content = (
    <View style={[styles.imgContainer, isBadgeOrSmall && styles.badgeContainer]}>
      <Image
        source={{ uri }}
        style={isBadgeOrSmall ? styles.badgeElement : styles.imgElement}
        resizeMode="contain"
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
      {loading && (
        <View style={styles.imgLoadingOverlay}>
          <ActivityIndicator size="small" color={THEME.colors.primaryAccent} />
        </View>
      )}
      {!isBadgeOrSmall && alt ? <Text style={styles.imgCaption}>{alt}</Text> : null}
    </View>
  );

  if (linkUrl) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// Formats inline bold, italic, code, images and hyperlinks: [text](url)
function renderFormattedInline(text: string) {
  // Regex to split on [![(.*?)](imgUrl)](linkUrl) or [anchor](url) or ![alt](url)
  const pattern = /(\[!\[(.*?)\]\((https?:\/\/[^\s\)]+)\)\]\((https?:\/\/[^\s\)]+)\))|(!\[(.*?)\]\((https?:\/\/[^\s\)]+)\))|(\[(.*?)\]\((https?:\/\/[^\s\)]+)\))/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const preText = text.substring(lastIndex, match.index);
    if (preText) {
      parts.push(
        <Text key={`pre-${lastIndex}`} style={styles.paragraph}>
          {preText}
        </Text>
      );
    }

    if (match[1]) {
      // Linked image: [![alt](imgUrl)](linkUrl)
      const alt = match[2];
      const imgUrl = match[3];
      const linkUrl = match[4];
      parts.push(
        <MarkdownImage key={`inl-limg-${match.index}`} uri={imgUrl} alt={alt} linkUrl={linkUrl} />
      );
    } else if (match[5]) {
      // Standalone inline image: ![alt](imgUrl)
      const alt = match[6];
      const imgUrl = match[7];
      parts.push(
        <MarkdownImage key={`inl-img-${match.index}`} uri={imgUrl} alt={alt} />
      );
    } else if (match[8]) {
      // Hyperlink: [anchor](url)
      const anchor = match[9] || match[10];
      const url = match[10];
      parts.push(
        <TouchableOpacity
          key={`link-${match.index}`}
          onPress={() => Linking.openURL(url).catch(() => {})}
          activeOpacity={0.7}
        >
          <Text style={styles.hyperlink}>
            {anchor} <Feather name="external-link" size={11} color={THEME.colors.primaryAccent} />
          </Text>
        </TouchableOpacity>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  const remaining = text.substring(lastIndex);
  if (remaining) {
    parts.push(
      <Text key={`rem-${lastIndex}`} style={styles.paragraph}>
        {remaining}
      </Text>
    );
  }

  if (parts.length === 0) {
    return <Text style={styles.paragraph}>{text}</Text>;
  }

  return <Text style={styles.inlineWrapper}>{parts}</Text>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 44,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: THEME.colors.bg,
  },
  emptyText: {
    color: THEME.colors.textMuted,
    fontSize: 14,
  },
  frontmatterCard: {
    backgroundColor: '#251838',
    borderColor: 'rgba(123, 31, 162, 0.5)',
    borderWidth: 1,
    borderRadius: THEME.radius.sm,
    padding: 12,
    marginBottom: 16,
  },
  frontmatterTag: {
    color: THEME.colors.primaryAccent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  frontmatterText: {
    color: '#F3E8FF',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  h1: {
    color: THEME.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    marginTop: 8,
    lineHeight: 28,
  },
  h2: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 14,
    lineHeight: 24,
  },
  h3: {
    color: '#E4E4E7',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
  },
  h4: {
    color: '#D4D4D8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  paragraphContainer: {
    marginBottom: 10,
  },
  paragraph: {
    color: '#D4D4D8',
    fontSize: 14,
    lineHeight: 22,
  },
  inlineWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hyperlink: {
    color: THEME.colors.primaryAccent,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  quoteBox: {
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.primary,
    paddingLeft: 12,
    paddingVertical: 4,
    marginVertical: 8,
    backgroundColor: '#1E1E28',
    borderRadius: 4,
  },
  quoteText: {
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 4,
  },
  listBullet: {
    color: THEME.colors.primaryAccent,
    fontSize: 16,
    width: 14,
    lineHeight: 20,
  },
  listNumber: {
    color: THEME.colors.primaryAccent,
    fontSize: 13,
    fontWeight: '700',
    width: 22,
    lineHeight: 20,
  },
  listTextContainer: {
    flex: 1,
  },
  codeBlock: {
    backgroundColor: THEME.colors.bgInput,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.radius.sm,
    padding: 12,
    marginVertical: 10,
  },
  codeText: {
    color: '#38BDF8',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  tableRow: {
    backgroundColor: THEME.colors.bgCard,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  tableRowText: {
    color: '#D4D4D8',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  imgContainer: {
    marginVertical: 10,
    borderRadius: THEME.radius.md,
    overflow: 'hidden',
    backgroundColor: THEME.colors.bgCard,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  badgeContainer: {
    marginVertical: 4,
    padding: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  imgElement: {
    width: '100%',
    height: 190,
    backgroundColor: THEME.colors.bgCard,
  },
  badgeElement: {
    width: 130,
    height: 32,
  },
  imgLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 18, 20, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgCaption: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
    padding: 8,
    textAlign: 'center',
    backgroundColor: THEME.colors.bgHeader,
  },
  imgErrorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgCard,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.radius.sm,
    padding: 10,
    gap: 8,
    marginVertical: 8,
  },
  imgErrorText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    flex: 1,
  },
  spacer: {
    height: 8,
  },
});
