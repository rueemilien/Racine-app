import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from './supabase';

// Supabase `user_settings` is the source of truth; this cache exists purely so
// notification scheduling still works offline (no network needed to read it back).
const NOTIFICATION_TIME_CACHE_KEY = 'iknow.notificationTime';

export type NotificationTime = { hour: number; minute: number };

async function cacheNotificationTime(time: NotificationTime) {
  await AsyncStorage.setItem(NOTIFICATION_TIME_CACHE_KEY, JSON.stringify(time));
}

export async function getCachedNotificationTime(): Promise<NotificationTime | null> {
  const raw = await AsyncStorage.getItem(NOTIFICATION_TIME_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as NotificationTime;
  } catch {
    return null;
  }
}

function toTimeColumn(time: NotificationTime): string {
  return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}:00`;
}

function fromTimeColumn(raw: string): NotificationTime {
  const [hour, minute] = raw.split(':').map(Number);
  return { hour, minute };
}

export async function saveNotificationTime(userId: string, time: NotificationTime) {
  // Cache first: scheduling must succeed even if the Supabase write below fails offline.
  await cacheNotificationTime(time);

  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: userId,
      notification_time: toTimeColumn(time),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.error('Failed to sync notification time to Supabase (kept in local cache):', error.message);
  }
}

export async function getNotificationTime(userId: string): Promise<NotificationTime | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('notification_time')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data?.notification_time) {
    if (error) {
      console.error('Failed to fetch notification time from Supabase, falling back to cache:', error.message);
    }
    return getCachedNotificationTime();
  }

  const time = fromTimeColumn(data.notification_time);
  await cacheNotificationTime(time);
  return time;
}

const RECAP_DAY_CACHE_KEY = 'iknow.recapDay';

// `weekly_recap_day` (pre-existing column) stores the English day name
// ('Monday'..'Sunday') — callers translate to/from the French UI labels.
export async function getCachedRecapDay(): Promise<string | null> {
  return AsyncStorage.getItem(RECAP_DAY_CACHE_KEY);
}

export async function saveRecapDay(userId: string, day: string) {
  await AsyncStorage.setItem(RECAP_DAY_CACHE_KEY, day);

  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, weekly_recap_day: day }, { onConflict: 'user_id' });

  if (error) {
    console.error('Failed to sync recap day to Supabase (kept in local cache):', error.message);
  }
}

export async function getRecapDay(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('weekly_recap_day')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error('Failed to fetch recap day from Supabase, falling back to cache:', error.message);
    }
    return getCachedRecapDay();
  }

  await AsyncStorage.setItem(RECAP_DAY_CACHE_KEY, data.weekly_recap_day);
  return data.weekly_recap_day;
}
