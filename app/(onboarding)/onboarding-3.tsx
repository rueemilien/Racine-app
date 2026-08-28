import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignFonts, inkAlpha } from '@/constants/design-system';
import { useOnboarding } from '@/hooks/use-onboarding';
import { parseTimeLabel, scheduleDailyReminder } from '@/src/services/notifications';
import { supabase } from '@/src/services/supabase';
import { saveNotificationTime } from '@/src/services/user-settings';

const TIME_OPTIONS = ['8h00', '12h00', '18h00', '20h00'];

export default function OnboardingThreeScreen() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const [selectedTime, setSelectedTime] = useState(TIME_OPTIONS[0]);

  async function goToAccueil() {
    await completeOnboarding();
    router.replace('/accueil');
  }

  async function handleFinish() {
    const { hour, minute } = parseTimeLabel(selectedTime);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user.id) {
      await saveNotificationTime(session.user.id, { hour, minute });
    }

    await scheduleDailyReminder(hour, minute);
    await goToAccueil();
  }

  function handleSkip() {
    goToAccueil();
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.copy}>
          <Text style={styles.title}>Personnalisez votre rituel</Text>
          <Text style={styles.paragraph}>Vous pourrez tout modifier plus tard dans Réglages.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Heure préférée</Text>
          <View style={styles.chipsRow}>
            {TIME_OPTIONS.map((time) => {
              const isSelected = time === selectedTime;
              return (
                <Pressable
                  key={time}
                  onPress={() => setSelectedTime(time)}
                  style={[
                    styles.chip,
                    isSelected ? styles.chipSelected : styles.chipUnselected,
                  ]}>
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {time}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        <Pressable
          onPress={handleFinish}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>Terminer</Text>
        </Pressable>

        <Pressable onPress={handleSkip}>
          <Text style={styles.skipText}>Passer, je réglerai plus tard</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DesignColors.background,
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 52,
  },
  content: {
    flex: 1,
    gap: 26,
  },
  copy: {
    gap: 8,
  },
  title: {
    fontFamily: DesignFonts.bold,
    fontSize: 22,
    lineHeight: 29,
    color: DesignColors.ink,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    color: inkAlpha(0.6),
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: inkAlpha(0.5),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  chipSelected: {
    backgroundColor: DesignColors.accent,
    borderColor: DesignColors.accent,
  },
  chipUnselected: {
    backgroundColor: DesignColors.surface,
    borderColor: DesignColors.border,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: DesignColors.ink,
  },
  chipTextSelected: {
    color: DesignColors.onAccent,
  },
  footer: {
    alignItems: 'center',
    gap: 16,
  },
  dots: {
    flexDirection: 'row',
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: DesignColors.border,
  },
  dotActive: {
    width: 20,
    backgroundColor: DesignColors.accent,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: DesignColors.accent,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: DesignColors.accentPressed,
  },
  buttonText: {
    fontFamily: DesignFonts.semiBold,
    fontSize: 16,
    color: DesignColors.onAccent,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: inkAlpha(0.5),
  },
});
