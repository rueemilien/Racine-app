import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignFonts, inkAlpha } from '@/constants/design-system';
import {
  formatWeeklyRecapSummary,
  getAnswerHistory,
  getCurrentUserId,
  getWeeklyRecapStats,
  HistoryEntry,
  WeeklyRecapStats,
} from '@/src/services/daily';

export default function HistoriqueScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyRecapStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function load() {
        const userId = await getCurrentUserId();
        const [entries, stats] = userId
          ? await Promise.all([getAnswerHistory(userId), getWeeklyRecapStats(userId)])
          : [[], null];
        if (isActive) {
          setHistory(entries);
          setWeeklyStats(stats);
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

      {weeklyStats && weeklyStats.totalAnswered > 0 && (
        <View style={styles.recapBanner}>
          <Text style={styles.recapText}>{formatWeeklyRecapSummary(weeklyStats)}</Text>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator size="large" color={DesignColors.accent} />
      ) : history.length === 0 ? (
        <Text style={styles.emptyText}>Pas encore de réponse — répondez au mot du jour pour commencer.</Text>
      ) : (
        <View style={styles.list}>
          {history.map((entry, index) => (
            <View key={`${entry.date}-${index}`} style={styles.row}>
              <View style={styles.rowBody}>
                <View style={styles.rowHeader}>
                  <Text style={styles.word}>{entry.word}</Text>
                  <Text style={styles.category}>{entry.category}</Text>
                </View>
                <Text style={styles.snippet} numberOfLines={1}>
                  {entry.snippet}
                </Text>
                <Text style={styles.date}>{entry.date}</Text>
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
  recapBanner: {
    backgroundColor: DesignColors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recapText: {
    fontSize: 13,
    fontWeight: '600',
    color: DesignColors.ink,
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
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  category: {
    fontSize: 10,
    fontWeight: '600',
    color: inkAlpha(0.35),
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  date: {
    fontSize: 11,
    color: inkAlpha(0.4),
    marginTop: 2,
  },
  snippet: {
    fontSize: 13,
    lineHeight: 18,
    color: DesignColors.ink,
  },
  word: {
    fontFamily: DesignFonts.semiBold,
    fontSize: 15,
    color: DesignColors.ink,
  },
  mark: {
    fontSize: 15,
    fontWeight: '700',
  },
});
