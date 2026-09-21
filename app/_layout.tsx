import { Sora_500Medium, Sora_600SemiBold, Sora_700Bold, useFonts } from '@expo-google-fonts/sora';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, LogBox, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { OnboardingProvider, useOnboarding } from '@/hooks/use-onboarding';
import { resetExpiredStreak } from '@/src/services/daily';
import { WEEKLY_RECAP_ID } from '@/src/services/notifications';
import { supabase } from '@/src/services/supabase';

export const unstable_settings = {
  anchor: '(tabs)',
};

// expo-notifications auto-subscribes to push token changes on import (its own
// server-registration side effect) and warns that remote push isn't supported
// in Expo Go — harmless here since we only use local scheduled notifications.
LogBox.ignoreLogs([
  'Android Push notifications (remote notifications)',
  'Listening to push token changes',
]);

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <RootNavigator />
    </OnboardingProvider>
  );
}

function RootNavigator() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { isLoading: isOnboardingLoading, hasCompletedOnboarding } = useOnboarding();
  const [fontsLoaded] = useFonts({ Sora_500Medium, Sora_600SemiBold, Sora_700Bold });

  useEffect(() => {
    async function ensureAnonymousSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      let userId = session?.user.id;

      if (!userId) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error('Anonymous sign-in failed:', error.message);
          setIsAuthReady(true);
          return;
        }
        userId = data.user?.id;
      }

      if (userId) {
        // ignoreDuplicates makes this safe to run on every app start:
        // it only inserts when the row is missing, no read-then-write race.
        const { error } = await supabase
          .from('profiles')
          .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });
        if (error) {
          console.error('Profile upsert failed:', error.message);
        }

        // A missed day only naturally resets the streak the next time the
        // user answers — do it here too so the UI doesn't show a stale
        // streak on a cold start after 2+ missed days.
        await resetExpiredStreak(userId);
      }

      setIsAuthReady(true);
    }

    ensureAnonymousSession();
  }, []);

  // Tapping the weekly recap notification should land on Historique (its
  // content already summarizes the week; no dedicated recap screen). Only
  // act once onboarding is done — the recap is never scheduled before then.
  useEffect(() => {
    if (!hasCompletedOnboarding) return;

    function handleResponse(response: Notifications.NotificationResponse) {
      if (response.notification.request.identifier === WEEKLY_RECAP_ID) {
        router.push('/historique');
      }
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });
    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => subscription.remove();
  }, [hasCompletedOnboarding, router]);

  if (!isAuthReady || isOnboardingLoading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={!hasCompletedOnboarding}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={hasCompletedOnboarding}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="question-du-jour" options={{ headerShown: false }} />
          <Stack.Screen name="feedback" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
