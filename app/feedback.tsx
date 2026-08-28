import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignFonts, inkAlpha } from '@/constants/design-system';
import { DailyQuestion, getQuestionById } from '@/src/services/daily';

export default function FeedbackScreen() {
  const router = useRouter();
  const { questionId, selected } = useLocalSearchParams<{ questionId: string; selected: string }>();
  const [question, setQuestion] = useState<DailyQuestion | null>(null);

  useEffect(() => {
    let isActive = true;
    getQuestionById(questionId).then((q) => {
      if (isActive) setQuestion(q);
    });
    return () => {
      isActive = false;
    };
  }, [questionId]);

  function handleContinue() {
    router.dismissTo('/accueil');
  }

  if (!question) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={DesignColors.accent} />
      </View>
    );
  }

  const isCorrect = Number(selected) === question.correctIndex;

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        {isCorrect ? (
          <View style={styles.resultHeader}>
            <Text style={[styles.resultTitle, { color: DesignColors.success }]}>Bonne réponse !</Text>
            <Text style={styles.resultSubtitle}>+10 points</Text>
          </View>
        ) : (
          <View style={styles.resultHeader}>
            <Text style={[styles.resultTitle, { color: DesignColors.danger }]}>Raté, cette fois.</Text>
            <Text style={styles.resultSubtitle}>Ce sera la bonne demain.</Text>
          </View>
        )}

        <View style={styles.explanationCard}>
          <Text style={styles.explanationText}>{question.explanation}</Text>
          <Text style={styles.sourceText}>{question.source}</Text>
        </View>
      </View>

      <Pressable
        onPress={handleContinue}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
        <Text style={styles.buttonText}>Continuer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DesignColors.background,
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 48,
    gap: 20,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: DesignColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 20,
  },
  resultHeader: {
    gap: 6,
  },
  resultTitle: {
    fontFamily: DesignFonts.bold,
    fontSize: 26,
  },
  resultSubtitle: {
    fontSize: 14,
    color: inkAlpha(0.55),
  },
  explanationCard: {
    backgroundColor: DesignColors.surface,
    borderRadius: 18,
    padding: 20,
    gap: 12,
    boxShadow: [{ offsetX: 0, offsetY: 8, blurRadius: 24, color: inkAlpha(0.08) }],
    elevation: 3,
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 24,
    color: DesignColors.ink,
  },
  sourceText: {
    fontSize: 13,
    lineHeight: 19,
    color: inkAlpha(0.5),
    fontStyle: 'italic',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: DesignColors.ink,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#3A2F24',
  },
  buttonText: {
    fontFamily: DesignFonts.semiBold,
    fontSize: 16,
    color: DesignColors.onAccent,
  },
});
