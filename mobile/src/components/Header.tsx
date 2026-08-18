import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  onRefresh?: () => void;
  onOpenSettings?: () => void;
  activeTabTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, onOpenSettings }) => {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
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
            <Ionicons name="refresh-outline" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
        {onOpenSettings && (
          <TouchableOpacity style={styles.actionBtn} onPress={onOpenSettings} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={18} color="#94A3B8" />
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 6,
  },
  brandTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  versionBadge: {
    backgroundColor: '#312E81',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  versionText: {
    color: '#A5B4FC',
    fontSize: 10,
    fontWeight: '700',
  },
  brandSubtitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
