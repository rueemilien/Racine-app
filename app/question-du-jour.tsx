import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignFonts, inkAlpha } from '@/constants/design-system';
import { DailyQuestion, getAnswerFor, getCurrentUserId, getTodayQuestion, getUserStats, submitAnswer } from '@/src/services/daily';

const LETTERS = ['A', 'B', 'C', 'D'];
// Mirrors the design's two-step reveal: highlight the pick, then show
// right/wrong after a beat, then hand off to the feedback screen.
const REVEAL_DELAY_MS = 300;
const NAVIGATE_DELAY_MS = 700;

export default function QuestionDuJourScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [question, setQuestion] = useState<DailyQuestion | null>(null);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function load() {
      const uid = await getCurrentUserId();
      const [todayQuestion, stats] = await Promise.all([getTodayQuestion(), uid ? getUserStats(uid) : null]);
      if (!isActive) return;

      setUserId(uid);
      setQuestion(todayQuestion);
      if (stats) setStreak(stats.streak);

      // Already answered today (e.g. back-navigated here): don't let the
      // unique (user_id, question_id) constraint reject a second insert —
      // send them straight to the result instead.
      if (uid && todayQuestion) {
        const existing = await getAnswerFor(uid, todayQuestion.id);
        if (isActive && existing) {
          router.replace({
            pathname: '/feedback',
            params: { questionId: todayQuestion.id, selected: String(existing.selectedIndex) },
          });
          return;
        }
      }

      if (isActive) setIsLoading(false);
    }

    load();
    return () => {
      isActive = false;
    };
  }, [router]);

  function handleSelect(index: number) {
    if (selectedAnswer != null || !question || !userId) return;
    setSelectedAnswer(index);
    setTimeout(() => {
      setRevealed(true);
      setTimeout(async () => {
        await submitAnswer(userId, question.id, index, index === question.correctIndex);
        router.push({ pathname: '/feedback', params: { questionId: question.id, selected: String(index) } });
      }, NAVIGATE_DELAY_MS);
    }, REVEAL_DELAY_MS);
  }

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={DesignColors.accent} />
      </View>
    );
  }

  if (!question) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.backChevron}>‹</Text>
          </Pressable>
        </View>
        <Text style={styles.emptyText}>Pas de question disponible aujourd&apos;hui. Revenez demain !</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryPillText}>{question.category}</Text>
        </View>
        <Text style={styles.streakLabel}>{streak} j.</Text>
      </View>

      <Text style={styles.questionText}>{question.text}</Text>

      <View style={styles.options}>
        {question.options.map((label, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrectOption = index === question.correctIndex;

          let borderColor: string = DesignColors.border;
          let backgroundColor: string = DesignColors.surface;
          let textColor: string = DesignColors.ink;
          let mark = '';
          let opacity = 1;

          if (selectedAnswer != null) {
            if (revealed) {
              if (isCorrectOption) {
                borderColor = DesignColors.success;
                backgroundColor = DesignColors.surfaceAlt;
                textColor = DesignColors.success;
                mark = '✓';
              } else if (isSelected) {
                borderColor = DesignColors.danger;
                backgroundColor = DesignColors.surfaceAlt;
                textColor = DesignColors.danger;
                mark = '✕';
              } else {
                opacity = 0.4;
              }
            } else if (isSelected) {
              borderColor = DesignColors.accent;
              backgroundColor = DesignColors.surfaceAlt;
            }
          }

          return (
            <Pressable
              key={label}
              onPress={() => handleSelect(index)}
              disabled={selectedAnswer != null}
              style={[styles.option, { borderColor, backgroundColor, opacity }]}>
              <View style={styles.optionLetter}>
                <Text style={[styles.optionLetterText, { color: textColor }]}>{LETTERS[index]}</Text>
              </View>
              <Text style={[styles.optionLabel, { color: textColor }]}>{label}</Text>
              <Text style={[styles.optionMark, { color: textColor }]}>{mark}</Text>
            </Pressable>
          );
        })}
      </View>
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
    gap: 26,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: DesignColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backChevron: {
    fontSize: 20,
    fontWeight: '600',
    color: DesignColors.ink,
  },
  categoryPill: {
    backgroundColor: DesignColors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignColors.onAccent,
  },
  streakLabel: {
    fontSize: 12,
    color: inkAlpha(0.5),
  },
  questionText: {
    fontFamily: DesignFonts.bold,
    fontSize: 22,
    lineHeight: 31,
    color: DesignColors.ink,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: inkAlpha(0.55),
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: inkAlpha(0.06),
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: {
    fontSize: 13,
    fontWeight: '700',
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
  },
  optionMark: {
    fontSize: 15,
    fontWeight: '700',
  },
});
