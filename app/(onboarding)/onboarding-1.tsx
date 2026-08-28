import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DesignColors, DesignFonts, inkAlpha } from '@/constants/design-system';

export default function OnboardingOneScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.illustration}>
          <View style={styles.illustrationCircle} />
          <View style={styles.illustrationSquare} />
          <View style={styles.illustrationDot} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>1 question,{'\n'}1 minute,{'\n'}chaque jour.</Text>
          <Text style={styles.paragraph}>
            iKnow vous glisse une question de culture générale par jour — de quoi apprendre un
            truc nouveau, sans y passer votre temps.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <Pressable
          onPress={() => router.push('/onboarding-2')}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>Suivant</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DesignColors.background,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  illustration: {
    width: 200,
    height: 170,
  },
  illustrationCircle: {
    position: 'absolute',
    left: 14,
    top: 0,
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: DesignColors.accent,
  },
  illustrationSquare: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 104,
    height: 104,
    borderRadius: 26,
    backgroundColor: DesignColors.cream,
    borderWidth: 2,
    borderColor: DesignColors.ink,
  },
  illustrationDot: {
    position: 'absolute',
    left: 76,
    top: 56,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: DesignColors.ink,
  },
  copy: {
    alignItems: 'center',
    gap: 14,
  },
  title: {
    fontFamily: DesignFonts.bold,
    fontSize: 28,
    lineHeight: 35,
    color: DesignColors.ink,
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 23,
    color: inkAlpha(0.62),
    textAlign: 'center',
    maxWidth: 260,
  },
  footer: {
    alignItems: 'center',
    gap: 22,
  },
  dots: {
    flexDirection: 'row',
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: DesignColors.border,
  },
  dotActive: {
    width: 20,
    backgroundColor: DesignColors.accent,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: DesignColors.accent,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: DesignColors.accentPressed,
  },
  buttonText: {
    fontFamily: DesignFonts.semiBold,
    fontSize: 16,
    color: DesignColors.onAccent,
  },
});
