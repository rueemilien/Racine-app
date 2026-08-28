import { StyleSheet, Text, View } from 'react-native';

export default function QuestionDuJourScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>question-du-jour</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 20, fontWeight: '600' },
});
