import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../types/theme';

interface HeaderProps {
  onRefresh?: () => void;
  onOpenSettings?: () => void;
  activeTabTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, onOpenSettings }) => {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        {/* Geometric Squircle Brand Icon */}
        <View style={styles.iconBadge}>
          <Text style={styles.iconText}>M↓</Text>
        </View>
        
        <View style={styles.titleCol}>
          <View style={styles.titleRow}>
            <Text style={styles.brandTitle}>Web2MD</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v1.0</Text>
            </View>
          </View>
          <Text style={styles.brandSubtitle}>Conversor Web para Markdown</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {onRefresh && (
          <TouchableOpacity style={styles.actionBtn} onPress={onRefresh} activeOpacity={0.7}>
            <Ionicons name="refresh-outline" size={18} color={THEME.colors.textSecondary} />
          </TouchableOpacity>
        )}
        {onOpenSettings && (
          <TouchableOpacity style={styles.actionBtn} onPress={onOpenSettings} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={18} color={THEME.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: THEME.colors.bgHeader,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: -0.5,
  },
  titleCol: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  versionBadge: {
    backgroundColor: THEME.colors.primaryBadgeBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  versionText: {
    color: THEME.colors.primaryAccent,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  brandSubtitle: {
    color: '#9E9E9E',
    fontSize: 11.5,
    fontWeight: '400',
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.bgCard,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
