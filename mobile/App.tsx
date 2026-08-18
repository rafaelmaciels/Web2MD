import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, Platform, ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Edit3, History as HistoryIcon, Settings as SettingsIcon, AlertCircle, RefreshCw } from 'lucide-react-native';
import { ExtractedPage, UserSettings, DEFAULT_SETTINGS } from './src/types';
import { getMobileSettings } from './src/services/storage';
import { Header } from './src/components/Header';
import { ConvertScreen } from './src/screens/ConvertScreen';
import { EditorScreen } from './src/screens/EditorScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

type TabType = 'convert' | 'editor' | 'history' | 'settings';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Web2MD Mobile Crash]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <ScrollView style={styles.errorScroll}>
            <Text style={styles.errorDetail}>
              {this.state.error?.message || 'Unknown error occurred'}
            </Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <RefreshCw size={16} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>Reload Web2MD</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

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
          <Sparkles
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
          <Edit3
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
          <HistoryIcon
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
          <SettingsIcon
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

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <MainApp />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F19',
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
  errorContainer: {
    flex: 1,
    backgroundColor: '#090D16',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
  },
  errorScroll: {
    maxHeight: 180,
    backgroundColor: '#1E1B4B',
    borderRadius: 8,
    padding: 12,
    marginVertical: 14,
    width: '100%',
  },
  errorDetail: {
    color: '#E0E7FF',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
