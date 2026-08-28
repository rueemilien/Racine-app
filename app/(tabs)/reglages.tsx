import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useOnboarding } from '@/hooks/use-onboarding';

export default function ReglagesScreen() {
  const router = useRouter();
  const { resetOnboarding } = useOnboarding();

  async function handleReplayOnboarding() {
    await resetOnboarding();
    router.replace('/onboarding-1');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>reglages</Text>
      <Pressable onPress={handleReplayOnboarding} style={styles.button}>
        <Text style={styles.buttonText}>Revoir l&apos;introduction</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  text: { fontSize: 20, fontWeight: '600' },
  button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, backgroundColor: '#2f6feb' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
