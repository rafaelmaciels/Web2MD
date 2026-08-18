import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';

interface QuickTogglesProps {
  includeFrontmatter: boolean;
  includeImages: boolean;
  onToggleFrontmatter: (value: boolean) => void;
  onToggleImages: (value: boolean) => void;
}

export const QuickToggles: React.FC<QuickTogglesProps> = ({
  includeFrontmatter,
  includeImages,
  onToggleFrontmatter,
  onToggleImages,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.chip, includeFrontmatter && styles.chipActive]}
        onPress={() => onToggleFrontmatter(!includeFrontmatter)}
        activeOpacity={0.8}
      >
        <Text style={[styles.chipText, includeFrontmatter && styles.chipTextActive]}>
          Frontmatter
        </Text>
        <View style={[styles.dot, includeFrontmatter && styles.dotActive]} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.chip, includeImages && styles.chipActive]}
        onPress={() => onToggleImages(!includeImages)}
        activeOpacity={0.8}
      >
        <Text style={[styles.chipText, includeImages && styles.chipTextActive]}>Images</Text>
        <View style={[styles.dot, includeImages && styles.dotActive]} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: {
    backgroundColor: '#1E1B4B',
    borderColor: '#6366F1',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#A5B4FC',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748B',
  },
  dotActive: {
    backgroundColor: '#10B981',
  },
});
