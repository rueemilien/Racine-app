import { Sora_500Medium, Sora_600SemiBold, Sora_700Bold, useFonts } from '@expo-google-fonts/sora';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { OnboardingProvider, useOnboarding } from '@/hooks/use-onboarding';
import { supabase } from '@/src/services/supabase';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <RootNavigator />
    </OnboardingProvider>
  );
}

function RootNavigator() {
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
      }

      setIsAuthReady(true);
    }

    ensureAnonymousSession();
  }, []);

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
        <Stack.Protected guard={!hasCompletedOnboarding}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={hasCompletedOnboarding}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="question-du-jour" options={{ headerShown: true, title: 'Question du jour' }} />
          <Stack.Screen name="feedback" options={{ headerShown: true, title: 'Résultat' }} />
        </Stack.Protected>
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
