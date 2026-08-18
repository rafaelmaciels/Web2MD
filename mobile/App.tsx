import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, Platform, SafeAreaView } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ExtractedPage, UserSettings, DEFAULT_SETTINGS } from './src/types';
import { getMobileSettings } from './src/services/storage';
import { Header } from './src/components/Header';
import { ConvertScreen } from './src/screens/ConvertScreen';
import { EditorScreen } from './src/screens/EditorScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

type TabType = 'convert' | 'editor' | 'history' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('convert');
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [extractedPage, setExtractedPage] = useState<ExtractedPage | null>(null);

  useEffect(() => {
    getMobileSettings()
      .then((s) => setSettings(s))
      .catch((e) => console.warn('Settings load fallback:', e));
  }, []);

  function handleConversionSuccess(extracted: ExtractedPage) {
    setExtractedPage(extracted);
    setActiveTab('editor');
  }

  function handleSelectHistoryItem(extracted: ExtractedPage) {
    setExtractedPage(extracted);
    setActiveTab('editor');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Top Brand Header */}
      <Header
        onOpenSettings={() => setActiveTab('settings')}
        onRefresh={activeTab === 'convert' ? undefined : () => setActiveTab('convert')}
      />

      {/* Main Tab Screen Content */}
      <View style={styles.content}>
        {activeTab === 'convert' && (
          <ConvertScreen
            settings={settings}
            onConversionSuccess={handleConversionSuccess}
          />
        )}

        {activeTab === 'editor' && (
          <EditorScreen
            extracted={extractedPage}
            settings={settings}
            onUpdateSettings={setSettings}
          />
        )}

        {activeTab === 'history' && (
          <HistoryScreen onSelectItem={handleSelectHistoryItem} />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={setSettings}
          />
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'convert' && styles.navItemActive]}
          onPress={() => setActiveTab('convert')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'convert' ? 'sparkles' : 'sparkles-outline'}
            size={20}
            color={activeTab === 'convert' ? '#818CF8' : '#64748B'}
          />
          <Text style={[styles.navLabel, activeTab === 'convert' && styles.navLabelActive]}>
            Convert
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'editor' && styles.navItemActive]}
          onPress={() => setActiveTab('editor')}
          activeOpacity={0.7}
        >
          <Feather
            name="edit-3"
            size={20}
            color={activeTab === 'editor' ? '#818CF8' : '#64748B'}
          />
          <Text style={[styles.navLabel, activeTab === 'editor' && styles.navLabelActive]}>
            Editor
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'history' && styles.navItemActive]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'history' ? 'time' : 'time-outline'}
            size={20}
            color={activeTab === 'history' ? '#818CF8' : '#64748B'}
          />
          <Text style={[styles.navLabel, activeTab === 'history' && styles.navLabelActive]}>
            History
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'settings' && styles.navItemActive]}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
            size={20}
            color={activeTab === 'settings' ? '#818CF8' : '#64748B'}
          />
          <Text style={[styles.navLabel, activeTab === 'settings' && styles.navLabelActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0,
  },
  content: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 14 : 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navItemActive: {},
  navLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#818CF8',
    fontWeight: '700',
  },
});
