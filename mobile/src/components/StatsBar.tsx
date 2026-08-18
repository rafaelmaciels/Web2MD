import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ConversionResult } from '../types';
import { THEME } from '../types/theme';

interface StatsBarProps {
  result: ConversionResult | null;
}

export const StatsBar: React.FC<StatsBarProps> = ({ result }) => {
  if (!result) return null;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statItem}>
          <Feather name="file-text" size={13} color={THEME.colors.primaryAccent} />
          <Text style={styles.statLabel}>Palavras:</Text>
          <Text style={styles.statValue}>{result.wordCount}</Text>
        </View>

        <View style={styles.statItem}>
          <Feather name="code" size={13} color={THEME.colors.success} />
          <Text style={styles.statLabel}>Caracteres:</Text>
          <Text style={styles.statValue}>{result.charCount}</Text>
        </View>

        <View style={styles.statItem}>
          <Feather name="clock" size={13} color={THEME.colors.warning} />
          <Text style={styles.statLabel}>Tempo:</Text>
          <Text style={styles.statValue}>{result.readingTimeMinutes} min</Text>
        </View>

        <View style={styles.statItem}>
          <Feather name="image" size={13} color="#F472B6" />
          <Text style={styles.statValue}>{result.imageCount} imgs</Text>
        </View>

        <View style={styles.statItem}>
          <Feather name="link" size={13} color={THEME.colors.info} />
          <Text style={styles.statValue}>{result.linkCount} links</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.bgHeader,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingVertical: 9,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radius.sm,
    gap: 5,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  statLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  statValue: {
    color: THEME.colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
});
