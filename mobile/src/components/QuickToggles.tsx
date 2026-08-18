import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { THEME } from '../types/theme';

interface QuickTogglesProps {
  includeFrontmatter: boolean;
  includeImages: boolean;
  onToggleFrontmatter: (val: boolean) => void;
  onToggleImages: (val: boolean) => void;
}

export const QuickToggles: React.FC<QuickTogglesProps> = ({
  includeFrontmatter,
  includeImages,
  onToggleFrontmatter,
  onToggleImages,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.toggleItem}>
        <Text style={styles.label}>Frontmatter</Text>
        <Switch
          value={includeFrontmatter}
          onValueChange={onToggleFrontmatter}
          trackColor={{ false: '#3F3F46', true: THEME.colors.primaryDark }}
          thumbColor={includeFrontmatter ? THEME.colors.primaryLight : '#A1A1AA'}
          style={styles.switchSmall}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.toggleItem}>
        <Text style={styles.label}>Imagens</Text>
        <Switch
          value={includeImages}
          onValueChange={onToggleImages}
          trackColor={{ false: '#3F3F46', true: THEME.colors.primaryDark }}
          thumbColor={includeImages ? THEME.colors.primaryLight : '#A1A1AA'}
          style={styles.switchSmall}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    color: THEME.colors.textSecondary,
    fontSize: 11.5,
    fontWeight: '500',
  },
  switchSmall: {
    transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }],
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: THEME.colors.border,
  },
});
