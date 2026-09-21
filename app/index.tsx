import { Redirect } from 'expo-router';

import { useOnboarding } from '@/hooks/use-onboarding';

// expo-router needs at least one literal index route to resolve the initial
// path correctly in a standalone build (this was missing app-wide, and was
// the cause of the "Unmatched Route" screen seen on a fresh install).
//
// This decides the destination itself instead of redirecting to the anchor
// group and letting Stack.Protected's own fallback figure it out: on a fresh
// install `(tabs)` (the anchor) is itself guarded out just like `(onboarding)`
// isn't, so redirecting to a screen inside the anchor produced a dead end
// (blank screen) rather than falling through to onboarding.
export default function Index() {
  const { hasCompletedOnboarding } = useOnboarding();
  return <Redirect href={hasCompletedOnboarding ? '/accueil' : '/onboarding-1'} />;
}
