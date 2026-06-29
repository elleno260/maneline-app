import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { useClientStore } from '@/store/clientStore';

export default function ClientDetailScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const { selectedClient, visits, loadClientDetail, status, error } = useClientStore();

  useEffect(() => {
    if (clientId) loadClientDetail(clientId);
  }, [clientId, loadClientDetail]);

  if (status === 'loading' && !selectedClient) {
    return <Screen><Text>Loading client...</Text></Screen>;
  }

  if (error) {
    return <Screen><Text style={styles.error}>{error}</Text></Screen>;
  }

  if (!selectedClient) {
    return <Screen><Text>Client not found.</Text></Screen>;
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{selectedClient.firstName} {selectedClient.lastName}</Text>
        <Text style={styles.subtitle}>{selectedClient.hairProfile.hairType} • {selectedClient.hairProfile.porosity} porosity • {selectedClient.hairProfile.density} density</Text>
      </View>

      <View style={styles.buttonRow}>
        <PrimaryButton title="Log Visit" onPress={() => router.push(`/stylist/client/${clientId}/log-visit`)} />
        <PrimaryButton title="AI Rec" variant="secondary" onPress={() => router.push(`/stylist/client/${clientId}/ai`)} />
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Hair Profile</Text>
        <Text style={styles.line}>Scalp: {selectedClient.hairProfile.scalp}</Text>
        <Text style={styles.line}>Current color: {selectedClient.hairProfile.currentColor || 'Not added'}</Text>
        <Text style={styles.line}>Goals: {selectedClient.goals.join(', ') || 'None added'}</Text>
        <Text style={styles.line}>Chemical history: {selectedClient.chemicalHistory.join(', ') || 'None added'}</Text>
        <Text style={styles.line}>Allergies: {selectedClient.allergies.join(', ') || 'None added'}</Text>
      </Card>

      {selectedClient.sharedRegimen ? (
        <Card>
          <Text style={styles.sectionTitle}>Shared Client Regimen</Text>
          <Text style={styles.line}>{selectedClient.sharedRegimen.summary}</Text>
          {selectedClient.sharedRegimen.steps.map((step, index) => (
            <View key={`${step.title}-${index}`} style={styles.visitItem}>
              <Text style={styles.bold}>{step.title}</Text>
              <Text style={styles.line}>{step.instructions}</Text>
              {step.frequency ? <Text style={styles.meta}>Frequency: {step.frequency}</Text> : null}
            </View>
          ))}
        </Card>
      ) : null}

      <Text style={styles.sectionTitle}>Visit History</Text>
      {visits.map((visit) => (
        <Card key={visit.id}>
          <Text style={styles.bold}>{String(visit.date)}</Text>
          <Text style={styles.line}>Services: {visit.services.map((service) => service.name).join(', ')}</Text>
          <Text style={styles.line}>Results: {visit.resultNotes}</Text>
          {visit.conditionNotes ? <Text style={styles.line}>Condition: {visit.conditionNotes}</Text> : null}
        </Card>
      ))}

      {!visits.length && <Text style={styles.meta}>No visits logged yet.</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4 },
  title: { fontSize: 30, fontWeight: '900', color: '#1E1A17' },
  subtitle: { color: '#5F534D', fontSize: 15 },
  buttonRow: { gap: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#1E1A17' },
  line: { color: '#4F4540', lineHeight: 20 },
  meta: { color: '#7B6E67' },
  bold: { fontWeight: '800', color: '#1E1A17' },
  visitItem: { gap: 4, paddingTop: 8 },
  error: { color: '#B42318', fontWeight: '700' },
});
