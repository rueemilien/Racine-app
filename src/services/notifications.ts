import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Local, on-device scheduled reminder only — never push/remote (see project conventions).
const DAILY_REMINDER_ID = 'daily-question-reminder';
const ANDROID_CHANNEL_ID = 'daily-reminder';

// Exported so app/_layout.tsx can tell this notification apart from the daily
// one when the user taps it, and route to /historique instead of doing nothing.
export const WEEKLY_RECAP_ID = 'weekly-recap-reminder';
const WEEKLY_RECAP_CHANNEL_ID = 'weekly-recap';

export function parseTimeLabel(label: string): { hour: number; minute: number } {
  const [hourPart, minutePart] = label.replace('h', ':').split(':');
  return { hour: Number(hourPart), minute: Number(minutePart) || 0 };
}

export function formatTimeLabel(time: { hour: number; minute: number }): string {
  return `${time.hour}h${String(time.minute).padStart(2, '0')}`;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Rappel quotidien',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function scheduleDailyReminder(hour: number, minute: number) {
  try {
    await ensureAndroidChannel();
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_ID,
      content: {
        title: 'Racine',
        body: 'Votre mot du jour est prêt. Une minute pour le deviner ?',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
      },
    });
  } catch (error) {
    console.error('Failed to schedule the daily reminder:', (error as Error).message);
  }
}

export async function cancelDailyReminder() {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
  } catch (error) {
    console.error('Failed to cancel the daily reminder:', (error as Error).message);
  }
}

async function ensureWeeklyRecapChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(WEEKLY_RECAP_CHANNEL_ID, {
    name: 'Récap hebdomadaire',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

// `weekday` follows expo-notifications' convention: 1-7, 1 = Sunday.
export async function scheduleWeeklyRecap(weekday: number, hour: number, minute: number, body: string) {
  try {
    await ensureWeeklyRecapChannel();
    await Notifications.cancelScheduledNotificationAsync(WEEKLY_RECAP_ID);
    await Notifications.scheduleNotificationAsync({
      identifier: WEEKLY_RECAP_ID,
      content: {
        title: 'Racine — Récap de la semaine',
        body,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour,
        minute,
        channelId: Platform.OS === 'android' ? WEEKLY_RECAP_CHANNEL_ID : undefined,
      },
    });
  } catch (error) {
    console.error('Failed to schedule the weekly recap:', (error as Error).message);
  }
}

export async function cancelWeeklyRecap() {
  try {
    await Notifications.cancelScheduledNotificationAsync(WEEKLY_RECAP_ID);
  } catch (error) {
    console.error('Failed to cancel the weekly recap:', (error as Error).message);
  }
}
