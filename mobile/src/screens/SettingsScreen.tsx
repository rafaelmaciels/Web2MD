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
import { Ionicons, Feather } from '@expo/vector-icons';
import { UserSettings, Language } from '../types';
import { saveMobileSettings } from '../services/storage';
import { THEME } from '../types/theme';

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

  const isPt = localSettings.language === 'pt-BR';

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
          <Ionicons name="checkmark-circle" size={14} color={THEME.colors.success} />
          <Text style={styles.saveBadgeText}>
            {isPt ? 'Preferência salva com sucesso' : 'Preferences saved successfully'}
          </Text>
        </View>
      )}

      {/* Header Info */}
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>
          {isPt ? 'Preferências de Conversão' : 'Conversion Preferences'}
        </Text>
        <Text style={styles.headerDesc}>
          {isPt
            ? 'As configurações são aplicadas diretamente às extrações de URLs e saídas de Markdown no seu smartphone.'
            : 'Settings are applied directly to URL extractions and Markdown outputs on your smartphone.'}
        </Text>
      </View>

      {/* Section 0: Language */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Feather name="globe" size={16} color={THEME.colors.primaryAccent} />
          <Text style={styles.sectionTitle}>
            {isPt ? 'Idioma da Interface' : 'Interface Language'}
          </Text>
        </View>

        <View style={styles.optionBlock}>
          <Text style={styles.rowLabel}>
            {isPt ? 'Idioma' : 'Language'}
          </Text>
          <Text style={styles.rowDesc}>
            {isPt
              ? 'Selecione o idioma de exibição do aplicativo'
              : 'Choose your preferred display language for the application'}
          </Text>
          <View style={styles.pillGroup}>
            <TouchableOpacity
              style={[
                styles.pill,
                localSettings.language !== 'pt-BR' && styles.pillActive,
              ]}
              onPress={() => updateSetting('language', 'en')}
            >
              <Text
                style={[
                  styles.pillText,
                  localSettings.language !== 'pt-BR' && styles.pillTextActive,
                ]}
              >
                {isPt ? 'English (Default) — Inglês (Padrão)' : 'English (Default)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pill,
                localSettings.language === 'pt-BR' && styles.pillActive,
              ]}
              onPress={() => updateSetting('language', 'pt-BR')}
            >
              <Text
                style={[
                  styles.pillText,
                  localSettings.language === 'pt-BR' && styles.pillTextActive,
                ]}
              >
                Português (Brasil)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Section 1: Content & Metadata */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Feather name="sliders" size={16} color={THEME.colors.primaryAccent} />
          <Text style={styles.sectionTitle}>
            {isPt ? 'Padrões de Conteúdo e Metadados' : 'Content & Metadata Defaults'}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>
              {isPt ? 'Incluir YAML Frontmatter' : 'Include YAML Frontmatter'}
            </Text>
            <Text style={styles.rowDesc}>
              {isPt
                ? 'Adiciona cabeçalho com título, URL, data, autor e domínio no topo do arquivo'
                : 'Adds header with title, URL, date, author, and domain at top of file'}
            </Text>
          </View>
          <Switch
            value={localSettings.includeFrontmatter}
            onValueChange={(val) => updateSetting('includeFrontmatter', val)}
            trackColor={{ false: '#3F3F46', true: THEME.colors.primaryDark }}
            thumbColor={localSettings.includeFrontmatter ? THEME.colors.primaryLight : '#A1A1AA'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>
              {isPt ? 'Incluir Imagens' : 'Include Images'}
            </Text>
            <Text style={styles.rowDesc}>
              {isPt
                ? 'Converte tags HTML <img> na sintaxe Markdown ![alt](url)'
                : 'Converts HTML <img> tags to Markdown syntax ![alt](url)'}
            </Text>
          </View>
          <Switch
            value={localSettings.includeImages}
            onValueChange={(val) => updateSetting('includeImages', val)}
            trackColor={{ false: '#3F3F46', true: THEME.colors.primaryDark }}
            thumbColor={localSettings.includeImages ? THEME.colors.primaryLight : '#A1A1AA'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>
              {isPt ? 'Incluir Hiperlinks' : 'Include Hyperlinks'}
            </Text>
            <Text style={styles.rowDesc}>
              {isPt
                ? 'Converte links HTML <a> na sintaxe Markdown [texto](url)'
                : 'Converts HTML <a> links to Markdown syntax [anchor](url)'}
            </Text>
          </View>
          <Switch
            value={localSettings.includeLinks}
            onValueChange={(val) => updateSetting('includeLinks', val)}
            trackColor={{ false: '#3F3F46', true: THEME.colors.primaryDark }}
            thumbColor={localSettings.includeLinks ? THEME.colors.primaryLight : '#A1A1AA'}
          />
        </View>
      </View>

      {/* Section 2: Markdown Syntax Styling */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Feather name="code" size={16} color={THEME.colors.success} />
          <Text style={styles.sectionTitle}>
            {isPt ? 'Estilo de Sintaxe Markdown' : 'Markdown Syntax Styling'}
          </Text>
        </View>

        {/* Heading Style */}
        <View style={styles.optionBlock}>
          <Text style={styles.rowLabel}>
            {isPt ? 'Estilo de Títulos' : 'Heading Style'}
          </Text>
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
                ATX (# {isPt ? 'Título' : 'Heading'})
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
                Setext ({isPt ? 'Sublinhado' : 'Underlined'})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Bullet List Marker */}
        <View style={styles.optionBlock}>
          <Text style={styles.rowLabel}>
            {isPt ? 'Marcador de Lista Não-Ordenada' : 'Bullet List Marker'}
          </Text>
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
          <Text style={styles.rowLabel}>
            {isPt ? 'Delimitador de Blocos de Código' : 'Code Block Fence'}
          </Text>
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
          <Feather name="folder" size={16} color={THEME.colors.warning} />
          <Text style={styles.sectionTitle}>
            {isPt ? 'Regras de Exportação e Armazenamento' : 'Export & Storage Rules'}
          </Text>
        </View>

        <View style={styles.optionBlock}>
          <Text style={styles.rowLabel}>
            {isPt ? 'Subpasta Padrão' : 'Default Subfolder'}
          </Text>
          <Text style={styles.rowDesc}>
            {isPt
              ? 'Usada para salvar ou categorizar os arquivos Markdown exportados'
              : 'Used to store and categorize exported Markdown files'}
          </Text>
          <TextInput
            style={styles.folderInput}
            value={localSettings.downloadFolder}
            onChangeText={(txt) => updateSetting('downloadFolder', txt)}
            placeholder="Web2MD"
            placeholderTextColor={THEME.colors.textMuted}
          />
        </View>
      </View>

      {/* Section 4: Ecosystem & Platform Info */}
      <View style={styles.ecosystemCard}>
        <View style={styles.sectionHeader}>
          <Feather name="shield" size={16} color={THEME.colors.info} />
          <Text style={styles.sectionTitle}>
            {isPt ? 'Ecossistema Multiplataforma Web2MD' : 'Web2MD Multiplatform Ecosystem'}
          </Text>
        </View>

        <View style={styles.platformRow}>
          <View style={styles.platformIconBox}>
            <Ionicons name="logo-chrome" size={18} color="#38BDF8" />
          </View>
          <View style={styles.platformTextCol}>
            <Text style={styles.platformTitle}>
              {isPt ? 'Extensão Chrome' : 'Chrome Extension'}
            </Text>
            <Text style={styles.platformSubtitle}>
              {isPt ? 'Ativa no Desktop / Manifest v3' : 'Active on Desktop / Manifest v3'}
            </Text>
          </View>
          <View style={styles.badgeActive}>
            <Text style={styles.badgeActiveText}>
              {isPt ? 'Ativo' : 'Active'}
            </Text>
          </View>
        </View>

        <View style={styles.platformRow}>
          <View style={styles.platformIconBox}>
            <Feather name="smartphone" size={18} color={THEME.colors.primaryAccent} />
          </View>
          <View style={styles.platformTextCol}>
            <Text style={styles.platformTitle}>
              {isPt ? 'Aplicativo Mobile' : 'Mobile App'}
            </Text>
            <Text style={styles.platformSubtitle}>
              {isPt ? 'Motor Nativo React Native & Expo' : 'Native React Native & Expo Engine'}
            </Text>
          </View>
          <View style={styles.badgeActive}>
            <Text style={styles.badgeActiveText}>
              {isPt ? 'Ativo' : 'Active'}
            </Text>
          </View>
        </View>

        <View style={styles.footerBrandContainer}>
          <Text style={styles.versionFooter}>Web2MD Unified Core Engine v1.0.0</Text>
          <Text style={styles.authorFooter}>
            {isPt ? 'Desenvolvido com ♥ por Rafael Maciel' : 'Developed with ♥ by Rafael Maciel'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  saveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: THEME.colors.successBg,
    borderColor: THEME.colors.success,
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
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerDesc: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 13.5,
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
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  rowDesc: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 12,
  },
  optionBlock: {
    paddingVertical: 4,
  },
  pillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  pill: {
    backgroundColor: THEME.colors.bgButtonSecondary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  pillSmall: {
    backgroundColor: THEME.colors.bgButtonSecondary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  pillActive: {
    backgroundColor: THEME.colors.primaryBadgeBg,
    borderColor: THEME.colors.primary,
  },
  pillText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: THEME.colors.primaryAccent,
  },
  folderInput: {
    backgroundColor: THEME.colors.bgInput,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.sm,
    paddingHorizontal: 12,
    height: 42,
    color: THEME.colors.textPrimary,
    fontSize: 13,
    marginTop: 8,
  },
  ecosystemCard: {
    backgroundColor: THEME.colors.bgCardSecondary,
    borderRadius: THEME.radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    gap: 10,
  },
  platformIconBox: {
    width: 36,
    height: 36,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  platformTextCol: {
    flex: 1,
  },
  platformTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  platformSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
  },
  badgeActive: {
    backgroundColor: THEME.colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeActiveText: {
    color: THEME.colors.success,
    fontSize: 10,
    fontWeight: '700',
  },
  footerBrandContainer: {
    marginTop: 16,
    alignItems: 'center',
    gap: 4,
  },
  versionFooter: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  authorFooter: {
    color: THEME.colors.primaryAccent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
