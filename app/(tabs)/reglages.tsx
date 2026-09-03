import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignFonts, inkAlpha } from '@/constants/design-system';
import { useOnboarding } from '@/hooks/use-onboarding';
import { formatWeeklyRecapSummary, getWeeklyRecapStats } from '@/src/services/daily';
import { formatTimeLabel, parseTimeLabel, scheduleDailyReminder, scheduleWeeklyRecap } from '@/src/services/notifications';
import { supabase } from '@/src/services/supabase';
import {
  getCachedNotificationTime,
  getCachedRecapDay,
  getNotificationTime,
  getRecapDay,
  NotificationTime,
  saveNotificationTime,
  saveRecapDay,
} from '@/src/services/user-settings';

const TIME_OPTIONS = ['8h00', '12h00', '18h00', '20h00'];
const DAY_OPTIONS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// expo-notifications' WEEKLY trigger numbers weekdays 1-7 with 1 = Sunday.
const EXPO_WEEKDAY_BY_FRENCH: Record<string, number> = {
  Dimanche: 1,
  Lundi: 2,
  Mardi: 3,
  Mercredi: 4,
  Jeudi: 5,
  Vendredi: 6,
  Samedi: 7,
};

// `user_settings.weekly_recap_day` stores the English day name — the UI
// stays in French, so translate at the edges rather than in the service.
const ENGLISH_DAY_BY_FRENCH: Record<string, string> = {
  Lundi: 'Monday',
  Mardi: 'Tuesday',
  Mercredi: 'Wednesday',
  Jeudi: 'Thursday',
  Vendredi: 'Friday',
  Samedi: 'Saturday',
  Dimanche: 'Sunday',
};
const FRENCH_DAY_BY_ENGLISH: Record<string, string> = Object.fromEntries(
  Object.entries(ENGLISH_DAY_BY_FRENCH).map(([fr, en]) => [en, fr])
);

// The DB column's default value is lowercase ('sunday'), but rows written by
// this screen use the capitalized form ('Sunday') — normalize before lookup
// so a never-touched row still resolves to a valid option.
function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export default function ReglagesScreen() {
  const router = useRouter();
  const { resetOnboarding } = useOnboarding();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState('8h00');
  const [recapDay, setRecapDay] = useState('Dimanche');
  // Only reschedule the weekly recap once the user has actually opted in by
  // picking a day (either just now, or previously — reflected in the DB) —
  // `recapDay`'s "Dimanche" default alone shouldn't trigger a schedule.
  const [hasRecapDaySet, setHasRecapDaySet] = useState(false);

  async function rescheduleWeeklyRecap(uid: string, frenchDay: string, time: NotificationTime) {
    const stats = await getWeeklyRecapStats(uid);
    await scheduleWeeklyRecap(EXPO_WEEKDAY_BY_FRENCH[frenchDay], time.hour, time.minute, formatWeeklyRecapSummary(stats));
  }

  useEffect(() => {
    let isActive = true;

    async function loadSettings() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user.id ?? null;
      if (!isActive) return;
      setUserId(uid);

      const [time, day] = await Promise.all([
        uid ? getNotificationTime(uid) : getCachedNotificationTime(),
        uid ? getRecapDay(uid) : getCachedRecapDay(),
      ]);
      if (!isActive) return;
      if (time) setSelectedTime(formatTimeLabel(time));
      if (day) {
        const frenchDay = FRENCH_DAY_BY_ENGLISH[capitalize(day)] ?? day;
        setRecapDay(frenchDay);
        setHasRecapDaySet(true);
        if (uid) await rescheduleWeeklyRecap(uid, frenchDay, time ?? parseTimeLabel('8h00'));
      }
    }

    loadSettings();
    return () => {
      isActive = false;
    };
  }, []);

  async function handleSelectTime(label: string) {
    setSelectedTime(label);
    const time = parseTimeLabel(label);
    if (userId) {
      await saveNotificationTime(userId, time);
    }
    await scheduleDailyReminder(time.hour, time.minute);
    if (userId && hasRecapDaySet) {
      await rescheduleWeeklyRecap(userId, recapDay, time);
    }
  }

  async function handleSelectRecapDay(day: string) {
    setRecapDay(day);
    setHasRecapDaySet(true);
    if (userId) {
      await saveRecapDay(userId, ENGLISH_DAY_BY_FRENCH[day]);
      await rescheduleWeeklyRecap(userId, day, parseTimeLabel(selectedTime));
    }
  }

  async function handleReplayOnboarding() {
    await resetOnboarding();
    router.replace('/onboarding-1');
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/accueil')} hitSlop={8}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Réglages</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Notification quotidienne</Text>
        <View style={styles.chipsRow}>
          {TIME_OPTIONS.map((time) => {
            const isSelected = time === selectedTime;
            return (
              <Pressable
                key={time}
                onPress={() => handleSelectTime(time)}
                style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]}>
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{time}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Jour du récap hebdo</Text>
        <View style={styles.dayRow}>
          {DAY_OPTIONS.map((day) => {
            const isSelected = day === recapDay;
            return (
              <Pressable
                key={day}
                onPress={() => handleSelectRecapDay(day)}
                style={[styles.dayChip, isSelected ? styles.chipSelected : styles.chipUnselected]}>
                <Text style={[styles.dayChipText, isSelected && styles.chipTextSelected]}>{day[0]}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable onPress={handleReplayOnboarding}>
        <Text style={styles.replayLink}>Revoir l&apos;introduction</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DesignColors.background,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 52,
    gap: 26,
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
  dayRow: {
    flexDirection: 'row',
    gap: 7,
  },
  dayChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignColors.ink,
  },
  replayLink: {
    fontSize: 13,
    fontWeight: '600',
    color: inkAlpha(0.5),
    textAlign: 'center',
    marginTop: 6,
  },
});
