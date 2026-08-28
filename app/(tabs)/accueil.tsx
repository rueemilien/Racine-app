import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignFonts, inkAlpha } from '@/constants/design-system';

const BADGE_STEPS = [3, 7, 14, 30];

// Mock data until the questions/answers backend lands (streak, score and
// "answered today" will then come from Supabase instead of being hardcoded).
const streak = 6;
const score = 340;
const answeredToday = false;
const category = 'Histoire';

function getBadgeProgress(currentStreak: number) {
  const nextStep = BADGE_STEPS.find((n) => n > currentStreak) ?? BADGE_STEPS[BADGE_STEPS.length - 1];
  const prevStep = [0, ...BADGE_STEPS].reverse().find((n) => n <= currentStreak) ?? 0;
  const progressPct = Math.min(100, Math.round(((currentStreak - prevStep) / (nextStep - prevStep || 1)) * 100));
  return { nextStep, progressPct };
}

export default function AccueilScreen() {
  const router = useRouter();
  const { nextStep, progressPct } = getBadgeProgress(streak);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour !</Text>
        <Text style={styles.appName}>iKnow</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.streakValue}>{streak}</Text>
            <Text style={styles.streakLabel}>jours d&apos;affilée</Text>
          </View>
          <View style={styles.scoreBlock}>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreLabel}>points</Text>
          </View>
        </View>

        <View style={styles.badgeSection}>
          <View style={styles.badgeRow}>
            {BADGE_STEPS.map((n) => {
              const active = streak >= n;
              return (
                <View
                  key={n}
                  style={[styles.badge, { backgroundColor: active ? DesignColors.accent : DesignColors.surfaceAlt }]}>
                  <Text style={[styles.badgeText, { color: active ? DesignColors.onAccent : inkAlpha(0.55) }]}>
                    {n}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.nextStepLabel}>Prochain palier : {nextStep} jours</Text>
        </View>
      </View>

      {answeredToday ? (
        <View style={styles.answeredCard}>
          <View>
            <Text style={styles.answeredTitle}>Question du jour</Text>
            <Text style={styles.answeredSubtitle}>Répondu — revenez demain</Text>
          </View>
          <Text style={styles.answeredCheck}>✓</Text>
        </View>
      ) : (
        <Pressable
          onPress={() => router.push('/question-du-jour')}
          style={({ pressed }) => [styles.questionCard, pressed && styles.questionCardPressed]}>
          <View>
            <Text style={styles.questionTitle}>Question du jour</Text>
            <Text style={styles.questionSubtitle}>{category} · pas encore répondu</Text>
          </View>
          <Text style={styles.questionChevron}>›</Text>
        </Pressable>
      )}

      <View style={styles.linksRow}>
        <Pressable onPress={() => router.push('/historique')} style={styles.linkCard}>
          <Text style={styles.linkTitle}>Historique</Text>
          <Text style={styles.linkSubtitle}>Vos réponses</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/reglages')} style={styles.linkCard}>
          <Text style={styles.linkTitle}>Réglages</Text>
          <Text style={styles.linkSubtitle}>Notifs, catégories</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DesignColors.background,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
    gap: 26,
  },
  header: {
    gap: 4,
  },
  greeting: {
    fontSize: 13,
    color: inkAlpha(0.5),
  },
  appName: {
    fontFamily: DesignFonts.bold,
    fontSize: 22,
    color: DesignColors.ink,
  },
  statsCard: {
    backgroundColor: DesignColors.surface,
    borderRadius: 22,
    padding: 22,
    gap: 16,
    boxShadow: [{ offsetX: 0, offsetY: 8, blurRadius: 24, color: inkAlpha(0.08) }],
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  streakValue: {
    fontFamily: DesignFonts.bold,
    fontSize: 40,
    lineHeight: 40,
    color: DesignColors.ink,
  },
  streakLabel: {
    fontSize: 13,
    color: inkAlpha(0.55),
  },
  scoreBlock: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontFamily: DesignFonts.bold,
    fontSize: 18,
    color: DesignColors.accent,
  },
  scoreLabel: {
    fontSize: 12,
    color: inkAlpha(0.5),
  },
  badgeSection: {
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: DesignFonts.bold,
    fontSize: 12,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: DesignColors.progressTrack,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: DesignColors.accent,
  },
  nextStepLabel: {
    fontSize: 12,
    color: inkAlpha(0.5),
  },
  answeredCard: {
    backgroundColor: DesignColors.surfaceAlt,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  answeredTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignColors.ink,
  },
  answeredSubtitle: {
    fontSize: 13,
    color: inkAlpha(0.55),
    marginTop: 2,
  },
  answeredCheck: {
    fontSize: 16,
    fontWeight: '700',
    color: DesignColors.success,
  },
  questionCard: {
    backgroundColor: DesignColors.ink,
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionCardPressed: {
    backgroundColor: '#3A2F24',
  },
  questionTitle: {
    fontFamily: DesignFonts.semiBold,
    fontSize: 14,
    color: DesignColors.onAccent,
  },
  questionSubtitle: {
    fontSize: 13,
    color: 'rgba(255,249,242,0.65)',
    marginTop: 2,
  },
  questionChevron: {
    fontSize: 20,
    fontWeight: '600',
    color: DesignColors.onAccent,
  },
  linksRow: {
    flexDirection: 'row',
    gap: 12,
  },
  linkCard: {
    flex: 1,
    backgroundColor: DesignColors.surface,
    borderWidth: 1.5,
    borderColor: DesignColors.cardBorder,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  linkTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: DesignColors.ink,
  },
  linkSubtitle: {
    fontSize: 12,
    color: inkAlpha(0.5),
  },
});
