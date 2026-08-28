import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignFonts, inkAlpha } from '@/constants/design-system';

export default function OnboardingTwoScreen() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  function goToOnboardingThree() {
    setIsDialogOpen(false);
    router.push('/onboarding-3');
  }

  async function handleAllow() {
    try {
      await Notifications.requestPermissionsAsync();
    } catch (error) {
      console.error('Notification permission request failed:', (error as Error).message);
    }
    goToOnboardingThree();
  }

  function handleDeny() {
    goToOnboardingThree();
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.copy}>
          <Text style={styles.title}>On vous prévient chaque jour</Text>
          <Text style={styles.paragraph}>
            Une notification vous rappelle votre question. Vous choisissez l&apos;heure, et vous
            pouvez tout changer dans Réglages quand vous voulez.
          </Text>
        </View>

        <View style={styles.notifCard}>
          <View style={styles.notifIcon} />
          <View style={styles.notifBody}>
            <View style={styles.notifHeaderRow}>
              <Text style={styles.notifApp}>iKnow</Text>
              <Text style={styles.notifTime}>maintenant</Text>
            </View>
            <Text style={styles.notifText}>
              Votre question du jour est prête. Une minute pour la tenter ?
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        <Pressable
          onPress={() => setIsDialogOpen(true)}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>Activer les notifications</Text>
        </Pressable>
      </View>

      {isDialogOpen && (
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>
              « iKnow » souhaite vous envoyer des notifications
            </Text>
            <Text style={styles.dialogBody}>
              Les notifications peuvent inclure des alertes, sons et badges. Réglable à tout
              moment.
            </Text>
            <View style={styles.dialogActions}>
              <Pressable
                onPress={handleAllow}
                style={({ pressed }) => [styles.dialogButton, pressed && styles.buttonPressed]}>
                <Text style={styles.dialogButtonText}>Autoriser</Text>
              </Pressable>
              <Pressable onPress={handleDeny} style={styles.dialogButtonSecondary}>
                <Text style={styles.dialogButtonSecondaryText}>Ne pas autoriser</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
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
    justifyContent: 'center',
    gap: 28,
  },
  copy: {
    gap: 12,
  },
  title: {
    fontFamily: DesignFonts.bold,
    fontSize: 24,
    lineHeight: 31,
    color: DesignColors.ink,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 23,
    color: inkAlpha(0.62),
  },
  notifCard: {
    width: '100%',
    backgroundColor: DesignColors.surface,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    boxShadow: [{ offsetX: 0, offsetY: 8, blurRadius: 24, color: inkAlpha(0.12) }],
    elevation: 4,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: DesignColors.accent,
  },
  notifBody: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  notifApp: {
    fontFamily: DesignFonts.semiBold,
    fontSize: 13,
    color: DesignColors.ink,
  },
  notifTime: {
    fontSize: 11,
    color: inkAlpha(0.4),
  },
  notifText: {
    fontSize: 13,
    lineHeight: 18,
    color: inkAlpha(0.75),
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: DesignColors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  dialog: {
    width: '100%',
    backgroundColor: DesignColors.dialogSurface,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    alignItems: 'center',
  },
  dialogTitle: {
    fontFamily: DesignFonts.semiBold,
    fontSize: 15,
    color: DesignColors.ink,
    textAlign: 'center',
  },
  dialogBody: {
    fontSize: 13,
    lineHeight: 19,
    color: inkAlpha(0.6),
    textAlign: 'center',
  },
  dialogActions: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  dialogButton: {
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: DesignColors.accent,
    alignItems: 'center',
  },
  dialogButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignColors.onAccent,
  },
  dialogButtonSecondary: {
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  dialogButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: inkAlpha(0.55),
  },
});
