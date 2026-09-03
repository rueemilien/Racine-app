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
          <View style={styles.logoStem} />
          <View style={[styles.logoBranch, styles.logoBranchLeft]} />
          <View style={styles.logoBranch} />
          <View style={[styles.logoBranch, styles.logoBranchRight]} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>1 mot,{'\n'}1 minute,{'\n'}chaque jour.</Text>
          <Text style={styles.paragraph}>
            Racine vous glisse un mot de vocabulaire par jour — devinez-le à partir de sa
            définition, et enrichissez votre vocabulaire sans y passer votre temps.
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
    paddingTop: 56,
    paddingBottom: 52,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  illustration: {
    width: 200,
    height: 190,
  },
  // The Racine mark: one straight stem on top, three straight strokes
  // fanning out at the bottom — mirrors assets/images/icon.png.
  logoStem: {
    position: 'absolute',
    left: 92,
    top: 20,
    width: 16,
    height: 70,
    borderRadius: 8,
    backgroundColor: DesignColors.accent,
  },
  logoBranch: {
    position: 'absolute',
    left: 92,
    top: 90,
    width: 16,
    height: 100,
    borderRadius: 8,
    backgroundColor: DesignColors.accent,
    transformOrigin: 'top',
  },
  logoBranchLeft: {
    transform: [{ rotate: '-34deg' }],
  },
  logoBranchRight: {
    transform: [{ rotate: '34deg' }],
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
