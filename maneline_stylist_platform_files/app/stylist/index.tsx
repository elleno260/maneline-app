import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { useClientStore } from '@/store/clientStore';

export default function StylistDashboardScreen() {
  const { clients, loadClients, status } = useClientStore();

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const clientsWithRecentVisit = clients.filter((client) => client.lastVisitAt).length;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>MANELINE PRO</Text>
        <Text style={styles.title}>Your client hair intelligence hub</Text>
        <Text style={styles.subtitle}>Track client history, log formulas, and create AI-supported regimens your clients can follow.</Text>
      </View>

      <View style={styles.grid}>
        <Card>
          <Text style={styles.metric}>{clients.length}</Text>
          <Text style={styles.label}>Total clients</Text>
        </Card>
        <Card>
          <Text style={styles.metric}>{clientsWithRecentVisit}</Text>
          <Text style={styles.label}>With visit history</Text>
        </Card>
      </View>

      <PrimaryButton title="View Clients" onPress={() => router.push('/stylist/clients')} />
      <PrimaryButton title="Add New Client" variant="secondary" onPress={() => router.push('/stylist/client/new')} />

      {status === 'loading' && <Text style={styles.loading}>Loading your dashboard...</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 8 },
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5, color: '#8A4B2B' },
  title: { fontSize: 32, fontWeight: '900', color: '#1E1A17', lineHeight: 36 },
  subtitle: { fontSize: 16, color: '#5F534D', lineHeight: 22 },
  grid: { flexDirection: 'row', gap: 12 },
  metric: { fontSize: 34, fontWeight: '900', color: '#1E1A17' },
  label: { color: '#5F534D', fontWeight: '600' },
  loading: { color: '#5F534D' },
});
