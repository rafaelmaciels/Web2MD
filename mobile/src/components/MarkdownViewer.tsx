import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface MarkdownViewerProps {
  markdown: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ markdown }) => {
  if (!markdown) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No Markdown content to preview.</Text>
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
            <Text style={styles.frontmatterTag}>YAML METADATA</Text>
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
        // End of code block
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
          <Text style={styles.listText}>{line.substring(2)}</Text>
        </View>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+\.)\s(.*)/);
      elements.push(
        <View key={`numli-${i}`} style={styles.listItem}>
          <Text style={styles.listNumber}>{match ? match[1] : '1.'}</Text>
          <Text style={styles.listText}>{match ? match[2] : line}</Text>
        </View>
      );
    } else if (!line.trim()) {
      elements.push(<View key={`spacer-${i}`} style={styles.spacer} />);
    } else {
      elements.push(
        <Text key={`p-${i}`} style={styles.paragraph}>
          {line}
        </Text>
      );
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {elements}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#090D16',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  frontmatterCard: {
    backgroundColor: '#1E1B4B',
    borderColor: '#4338CA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  frontmatterTag: {
    color: '#A5B4FC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  frontmatterText: {
    color: '#E0E7FF',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  h1: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    marginTop: 8,
    lineHeight: 28,
  },
  h2: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 14,
    lineHeight: 24,
  },
  h3: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
  },
  h4: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  paragraph: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  quoteBox: {
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
    paddingLeft: 12,
    paddingVertical: 4,
    marginVertical: 8,
    backgroundColor: '#131B2E',
    borderRadius: 4,
  },
  quoteText: {
    color: '#94A3B8',
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
    color: '#6366F1',
    fontSize: 16,
    width: 14,
    lineHeight: 20,
  },
  listNumber: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '700',
    width: 22,
    lineHeight: 20,
  },
  listText: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  codeBlock: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
  },
  codeText: {
    color: '#38BDF8',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  spacer: {
    height: 8,
  },
});
