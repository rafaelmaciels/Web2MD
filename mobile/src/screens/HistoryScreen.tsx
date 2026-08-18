import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ConversionHistoryItem, ExtractedPage } from '../types';
import { getMobileHistory, deleteHistoryItem, clearMobileHistory } from '../services/storage';
import { copyToClipboard } from '../services/exporter';
import { THEME } from '../types/theme';

interface HistoryScreenProps {
  onSelectItem: (extracted: ExtractedPage) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onSelectItem }) => {
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const list = await getMobileHistory();
    setHistory(list);
  }

  async function handleDelete(id: string) {
    const updated = await deleteHistoryItem(id);
    setHistory(updated);
  }

  function handleClearAll() {
    Alert.alert(
      'Limpar Histórico',
      'Tem certeza de que deseja apagar todo o histórico de conversões salvas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar Tudo',
          style: 'destructive',
          onPress: async () => {
            await clearMobileHistory();
            setHistory([]);
          },
        },
      ]
    );
  }

  async function handleCopy(item: ConversionHistoryItem) {
    const success = await copyToClipboard(item.markdown);
    if (success) {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  function handleOpen(item: ConversionHistoryItem) {
    const extracted: ExtractedPage = {
      title: item.title,
      contentHtml: `<p>${item.markdown}</p>`,
      textContent: item.markdown,
      url: item.url,
      domain: item.domain,
      metadata: {
        title: item.title,
        url: item.url,
        domain: item.domain,
        extractedAt: item.convertedAt,
      },
    };
    onSelectItem(extracted);
  }

  function formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  return (
    <View style={styles.container}>
      {history.length > 0 && (
        <View style={styles.topBar}>
          <Text style={styles.topBarCount}>{history.length} conversões salvas</Text>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
            <Feather name="trash-2" size={13} color="#EF4444" />
            <Text style={styles.clearBtnText}>Limpar Tudo</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={history.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBadge}>
              <Feather name="clock" size={30} color={THEME.colors.primaryAccent} />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma Conversão Ainda</Text>
            <Text style={styles.emptyDesc}>
              As páginas da web e notas que você converter no Web2MD aparecerão aqui automaticamente para acesso rápido.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardContent}
              onPress={() => handleOpen(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.domainTag}>{item.domain}</Text>
                <Text style={styles.dateTag}>{formatDate(item.convertedAt)}</Text>
              </View>

              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.metaBadge}>
                  <Feather name="file-text" size={11} color={THEME.colors.textSecondary} />
                  <Text style={styles.metaText}>{item.wordCount} palavras</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Feather name="clock" size={11} color={THEME.colors.textSecondary} />
                  <Text style={styles.metaText}>{item.readingTimeMinutes} min de leitura</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleCopy(item)}
                activeOpacity={0.7}
              >
                <Feather
                  name={copiedId === item.id ? 'check' : 'copy'}
                  size={14}
                  color={copiedId === item.id ? THEME.colors.success : THEME.colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleOpen(item)}
                activeOpacity={0.7}
              >
                <Feather name="external-link" size={14} color={THEME.colors.primaryAccent} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleDelete(item.id)}
                activeOpacity={0.7}
              >
                <Feather name="trash-2" size={14} color={THEME.colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: THEME.colors.bgHeader,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  topBarCount: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.dangerBg,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: THEME.radius.sm,
  },
  clearBtnText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIconBadge: {
    width: 64,
    height: 64,
    borderRadius: THEME.radius.xl,
    backgroundColor: THEME.colors.primaryBadgeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(123, 31, 162, 0.4)',
  },
  emptyTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDesc: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardContent: {
    padding: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  domainTag: {
    color: THEME.colors.primaryAccent,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: THEME.colors.primaryBadgeBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dateTag: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  title: {
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.bgButtonSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    backgroundColor: THEME.colors.bgInput,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 12,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 6,
  },
});
