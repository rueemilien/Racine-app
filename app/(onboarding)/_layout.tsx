import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: 'onboarding-1',
};

export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
