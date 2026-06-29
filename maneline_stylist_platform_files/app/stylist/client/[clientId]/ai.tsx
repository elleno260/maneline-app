import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { useClientStore } from '@/store/clientStore';

export default function ClientAiScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const { latestRecommendation, getAiRecommendation, shareLatestRegimen, status } = useClientStore();
  const [goal, setGoal] = useState('Create a simple at-home routine based on the client profile and last visits.');

  const generate = async () => {
    if (!clientId || !goal.trim()) {
      Alert.alert('Missing goal', 'Tell AI what you want help with today.');
      return;
    }
    await getAiRecommendation(clientId, goal.trim());
  };

  const share = async () => {
    if (!clientId) return;
    await shareLatestRegimen(clientId);
    Alert.alert('Shared', 'The regimen is now saved to the client profile.');
  };

  return (
    <Screen>
      <Text style={styles.title}>AI Recommendation</Text>
      <Text style={styles.note}>Use this as a stylist assistant. Review before sharing with a client.</Text>

      <AppTextInput label="Stylist goal" value={goal} onChangeText={setGoal} multiline />
      <PrimaryButton title={status === 'ai' ? 'Generating...' : 'Generate Recommendation'} disabled={status === 'ai'} onPress={generate} />

      {latestRecommendation ? (
        <Card>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.line}>{latestRecommendation.summary}</Text>

          {latestRecommendation.formulaSuggestion ? (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>Formula / Service Suggestion</Text>
              <Text style={styles.line}>{latestRecommendation.formulaSuggestion}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Products</Text>
          {latestRecommendation.recommendedProducts.map((product, index) => (
            <View key={`${product.type}-${index}`} style={styles.block}>
              <Text style={styles.bold}>{product.type}</Text>
              <Text style={styles.line}>{product.reason}</Text>
              {product.caution ? <Text style={styles.caution}>Caution: {product.caution}</Text> : null}
            </View>
          ))}

          <Text style={styles.sectionTitle}>Client Regimen Steps</Text>
          {latestRecommendation.regimenSteps.map((step, index) => (
            <View key={`${step.title}-${index}`} style={styles.block}>
              <Text style={styles.bold}>{step.title}</Text>
              <Text style={styles.line}>{step.instructions}</Text>
              {step.frequency ? <Text style={styles.meta}>{step.frequency}</Text> : null}
            </View>
          ))}

          {latestRecommendation.cautions.length ? (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>Cautions</Text>
              {latestRecommendation.cautions.map((caution, index) => <Text key={index} style={styles.caution}>• {caution}</Text>)}
            </View>
          ) : null}

          {latestRecommendation.nextVisitTip ? <Text style={styles.line}>Next visit: {latestRecommendation.nextVisitTip}</Text> : null}
          <PrimaryButton title="Share Regimen with Client" onPress={share} />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '900', color: '#1E1A17' },
  note: { color: '#5F534D', lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1E1A17' },
  line: { color: '#4F4540', lineHeight: 20 },
  bold: { fontWeight: '800', color: '#1E1A17' },
  meta: { color: '#7B6E67' },
  caution: { color: '#9A3412', lineHeight: 20 },
  block: { gap: 4, marginTop: 10 },
});
