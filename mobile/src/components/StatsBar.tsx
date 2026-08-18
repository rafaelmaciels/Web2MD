import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FileText, FileCode, Clock, Image as ImageIcon, Link as LinkIcon } from 'lucide-react-native';
import { ConversionResult } from '../types';

interface StatsBarProps {
  result: ConversionResult | null;
}

export const StatsBar: React.FC<StatsBarProps> = ({ result }) => {
  if (!result) return null;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statItem}>
          <FileText size={12} color="#818CF8" />
          <Text style={styles.statLabel}>Words:</Text>
          <Text style={styles.statValue}>{result.wordCount}</Text>
        </View>

        <View style={styles.statItem}>
          <FileCode size={12} color="#34D399" />
          <Text style={styles.statLabel}>Chars:</Text>
          <Text style={styles.statValue}>{result.charCount}</Text>
        </View>

        <View style={styles.statItem}>
          <Clock size={12} color="#FBBF24" />
          <Text style={styles.statLabel}>Time:</Text>
          <Text style={styles.statValue}>{result.readingTimeMinutes} min</Text>
        </View>

        <View style={styles.statItem}>
          <ImageIcon size={12} color="#F472B6" />
          <Text style={styles.statValue}>{result.imageCount} imgs</Text>
        </View>

        <View style={styles.statItem}>
          <LinkIcon size={12} color="#60A5FA" />
          <Text style={styles.statValue}>{result.linkCount} links</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  statValue: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '700',
  },
});
