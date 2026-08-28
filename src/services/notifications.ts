import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Local, on-device scheduled reminder only — never push/remote (see project conventions).
const DAILY_REMINDER_ID = 'daily-question-reminder';
const ANDROID_CHANNEL_ID = 'daily-reminder';

export function parseTimeLabel(label: string): { hour: number; minute: number } {
  const [hourPart, minutePart] = label.replace('h', ':').split(':');
  return { hour: Number(hourPart), minute: Number(minutePart) || 0 };
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
        title: 'iKnow',
        body: 'Votre question du jour est prête. Une minute pour la tenter ?',
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
