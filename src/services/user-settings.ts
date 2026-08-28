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

export async function saveNotificationTime(userId: string, time: NotificationTime) {
  // Cache first: scheduling must succeed even if the Supabase write below fails offline.
  await cacheNotificationTime(time);

  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: userId,
      notification_hour: time.hour,
      notification_minute: time.minute,
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
    .select('notification_hour, notification_minute')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error('Failed to fetch notification time from Supabase, falling back to cache:', error.message);
    }
    return getCachedNotificationTime();
  }

  const time = { hour: data.notification_hour, minute: data.notification_minute };
  await cacheNotificationTime(time);
  return time;
}
