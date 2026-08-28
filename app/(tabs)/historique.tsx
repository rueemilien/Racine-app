import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignFonts, inkAlpha } from '@/constants/design-system';
import { getAnswerHistory, getCurrentUserId, HistoryEntry } from '@/src/services/daily';

export default function HistoriqueScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function load() {
        const userId = await getCurrentUserId();
        const entries = userId ? await getAnswerHistory(userId) : [];
        if (isActive) {
          setHistory(entries);
          setIsLoading(false);
        }
      }

      load();
      return () => {
        isActive = false;
      };
    }, [])
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/accueil')} hitSlop={8}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Historique</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={DesignColors.accent} />
      ) : history.length === 0 ? (
        <Text style={styles.emptyText}>Pas encore de réponse — répondez à la question du jour pour commencer.</Text>
      ) : (
        <View style={styles.list}>
          {history.map((entry, index) => (
            <View key={`${entry.date}-${index}`} style={styles.row}>
              <View style={styles.rowBody}>
                <View style={styles.rowMeta}>
                  <Text style={styles.category}>{entry.category}</Text>
                  <Text style={styles.date}>{entry.date}</Text>
                </View>
                <Text style={styles.snippet} numberOfLines={1}>
                  {entry.snippet}
                </Text>
              </View>
              <Text style={[styles.mark, { color: entry.correct ? DesignColors.success : DesignColors.danger }]}>
                {entry.correct ? '✓' : '✕'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DesignColors.background,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 48,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backChevron: {
    fontSize: 20,
    fontWeight: '600',
    color: DesignColors.ink,
  },
  title: {
    fontFamily: DesignFonts.bold,
    fontSize: 19,
    color: DesignColors.ink,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: inkAlpha(0.5),
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: DesignColors.surface,
    borderRadius: 14,
    padding: 14,
    boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 14, color: inkAlpha(0.06) }],
    elevation: 2,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  category: {
    fontSize: 11,
    fontWeight: '600',
    color: DesignColors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  date: {
    fontSize: 11,
    color: inkAlpha(0.4),
  },
  snippet: {
    fontSize: 13,
    lineHeight: 18,
    color: DesignColors.ink,
  },
  mark: {
    fontSize: 15,
    fontWeight: '700',
  },
});
