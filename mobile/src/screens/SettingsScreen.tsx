import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserSettings } from '../types';
import { saveMobileSettings } from '../services/storage';

interface SettingsScreenProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [saved, setSaved] = useState<boolean>(false);

  async function updateSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    const savedResult = await saveMobileSettings({ [key]: value });
    onUpdateSettings(savedResult);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Toast */}
      {saved && (
        <View style={styles.saveBadge}>
          <Ionicons name="checkmark" size={13} color="#10B981" />
          <Text style={styles.saveBadgeText}>Preferência salva com sucesso</Text>
        </View>
      )}

      {/* Header Info */}
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>Preferências de Conversão</Text>
        <Text style={styles.headerDesc}>
          As configurações são aplicadas diretamente às extrações de URLs e saídas de Markdown no seu smartphone.
        </Text>
      </View>

      {/* Section 1: Content & Metadata */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="options-outline" size={16} color="#818CF8" />
          <Text style={styles.sectionTitle}>Padrões de Conteúdo e Metadados</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Incluir YAML Frontmatter</Text>
            <Text style={styles.rowDesc}>
              Adiciona cabeçalho com título, URL, data, autor e domínio no topo do arquivo
            </Text>
          </View>
          <Switch
            value={localSettings.includeFrontmatter}
            onValueChange={(val) => updateSetting('includeFrontmatter', val)}
            trackColor={{ false: '#334155', true: '#4338CA' }}
            thumbColor={localSettings.includeFrontmatter ? '#818CF8' : '#94A3B8'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Incluir Imagens</Text>
            <Text style={styles.rowDesc}>
              Converte tags HTML &lt;img&gt; na sintaxe Markdown ![alt](url)
            </Text>
          </View>
          <Switch
            value={localSettings.includeImages}
            onValueChange={(val) => updateSetting('includeImages', val)}
            trackColor={{ false: '#334155', true: '#4338CA' }}
            thumbColor={localSettings.includeImages ? '#818CF8' : '#94A3B8'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Incluir Hiperlinks</Text>
            <Text style={styles.rowDesc}>
              Converte links HTML &lt;a&gt; na sintaxe Markdown [texto](url)
            </Text>
          </View>
          <Switch
            value={localSettings.includeLinks}
            onValueChange={(val) => updateSetting('includeLinks', val)}
            trackColor={{ false: '#334155', true: '#4338CA' }}
            thumbColor={localSettings.includeLinks ? '#818CF8' : '#94A3B8'}
          />
        </View>
      </View>

      {/* Section 2: Markdown Syntax Styling */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="code-slash-outline" size={16} color="#34D399" />
          <Text style={styles.sectionTitle}>Estilo de Sintaxe Markdown</Text>
        </View>

        {/* Heading Style */}
        <View style={styles.optionBlock}>
          <Text style={styles.rowLabel}>Estilo de Títulos</Text>
          <View style={styles.pillGroup}>
            <TouchableOpacity
              style={[
                styles.pill,
                localSettings.headingStyle === 'atx' && styles.pillActive,
              ]}
              onPress={() => updateSetting('headingStyle', 'atx')}
            >
              <Text
                style={[
                  styles.pillText,
                  localSettings.headingStyle === 'atx' && styles.pillTextActive,
                ]}
              >
                ATX (# Título)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pill,
                localSettings.headingStyle === 'setext' && styles.pillActive,
              ]}
              onPress={() => updateSetting('headingStyle', 'setext')}
            >
              <Text
                style={[
                  styles.pillText,
                  localSettings.headingStyle === 'setext' && styles.pillTextActive,
                ]}
              >
                Setext (Sublinhado)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Bullet List Marker */}
        <View style={styles.optionBlock}>
          <Text style={styles.rowLabel}>Marcador de Lista Não-Ordenada</Text>
          <View style={styles.pillGroup}>
            {(['-', '*', '+'] as const).map((marker) => (
              <TouchableOpacity
                key={marker}
                style={[
                  styles.pillSmall,
                  localSettings.bulletListMarker === marker && styles.pillActive,
                ]}
                onPress={() => updateSetting('bulletListMarker', marker)}
              >
                <Text
                  style={[
                    styles.pillText,
                    localSettings.bulletListMarker === marker && styles.pillTextActive,
                  ]}
                >
                  {marker}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Code Block Fence */}
        <View style={styles.optionBlock}>
          <Text style={styles.rowLabel}>Delimitador de Blocos de Código</Text>
          <View style={styles.pillGroup}>
            {(['```', '~~~'] as const).map((fence) => (
              <TouchableOpacity
                key={fence}
                style={[
                  styles.pill,
                  localSettings.fence === fence && styles.pillActive,
                ]}
                onPress={() => updateSetting('fence', fence)}
              >
                <Text
                  style={[
                    styles.pillText,
                    localSettings.fence === fence && styles.pillTextActive,
                  ]}
                >
                  {fence}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Section 3: Subfolder / Export */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="folder-outline" size={16} color="#FBBF24" />
          <Text style={styles.sectionTitle}>Regras de Exportação e Armazenamento</Text>
        </View>

        <View style={styles.optionBlock}>
          <Text style={styles.rowLabel}>Subpasta Padrão</Text>
          <Text style={styles.rowDesc}>
            Usada para salvar ou categorizar os arquivos Markdown exportados
          </Text>
          <TextInput
            style={styles.folderInput}
            value={localSettings.downloadFolder}
            onChangeText={(txt) => updateSetting('downloadFolder', txt)}
            placeholder="Web2MD"
            placeholderTextColor="#64748B"
          />
        </View>
      </View>

      {/* Section 4: Ecosystem & Platform Info */}
      <View style={styles.ecosystemCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#60A5FA" />
          <Text style={styles.sectionTitle}>Ecossistema Multiplataforma Web2MD</Text>
        </View>

        <View style={styles.platformRow}>
          <View style={styles.platformIconBox}>
            <Ionicons name="logo-chrome" size={18} color="#38BDF8" />
          </View>
          <View style={styles.platformTextCol}>
            <Text style={styles.platformTitle}>Extensão Chrome</Text>
            <Text style={styles.platformSubtitle}>Ativa no Desktop / Manifest v3</Text>
          </View>
          <View style={styles.badgeActive}>
            <Text style={styles.badgeActiveText}>Ativo</Text>
          </View>
        </View>

        <View style={styles.platformRow}>
          <View style={styles.platformIconBox}>
            <Ionicons name="phone-portrait-outline" size={18} color="#818CF8" />
          </View>
          <View style={styles.platformTextCol}>
            <Text style={styles.platformTitle}>Aplicativo Mobile</Text>
            <Text style={styles.platformSubtitle}>Motor Nativo React Native & Expo</Text>
          </View>
          <View style={styles.badgeActive}>
            <Text style={styles.badgeActiveText}>Ativo</Text>
          </View>
        </View>

        <View style={styles.footerBrandContainer}>
          <Text style={styles.versionFooter}>Web2MD Unified Core Engine v1.0.0</Text>
          <Text style={styles.authorFooter}>Desenvolvido com ♥ por Rafael Maciel</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  saveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#064E3B',
    borderColor: '#059669',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
    marginBottom: 12,
  },
  saveBadgeText: {
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: '600',
  },
  headerBox: {
    marginBottom: 16,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerDesc: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowInfo: {
    flex: 1,
    paddingRight: 12,
  },
  rowLabel: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  rowDesc: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 12,
  },
  optionBlock: {
    paddingVertical: 4,
  },
  pillGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  pill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pillSmall: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pillActive: {
    backgroundColor: '#1E1B4B',
    borderColor: '#6366F1',
  },
  pillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#A5B4FC',
  },
  folderInput: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    color: '#F8FAFC',
    fontSize: 13,
    marginTop: 8,
  },
  ecosystemCard: {
    backgroundColor: '#0B1120',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 10,
  },
  platformIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformTextCol: {
    flex: 1,
  },
  platformTitle: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
  },
  platformSubtitle: {
    color: '#64748B',
    fontSize: 11,
  },
  badgeActive: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeActiveText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
  },
  footerBrandContainer: {
    marginTop: 16,
    alignItems: 'center',
    gap: 4,
  },
  versionFooter: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '500',
  },
  authorFooter: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
