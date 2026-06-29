import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { useClientStore } from '@/store/clientStore';

export default function ClientsScreen() {
  const { clients, loadClients, status, error } = useClientStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const filteredClients = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return clients;
    return clients.filter((client) => `${client.firstName} ${client.lastName}`.toLowerCase().includes(term));
  }, [clients, search]);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Clients</Text>
          <Text style={styles.subtitle}>Search, review history, and manage regimens.</Text>
        </View>
      </View>

      <PrimaryButton title="Add Client" onPress={() => router.push('/stylist/client/new')} />
      <AppTextInput label="Search clients" value={search} onChangeText={setSearch} placeholder="Search by name" />

      {status === 'loading' && <Text>Loading clients...</Text>}
      {error && <Text style={styles.error}>{error}</Text>}

      {filteredClients.map((client) => (
        <Pressable key={client.id} onPress={() => router.push(`/stylist/client/${client.id}`)}>
          <Card>
            <Text style={styles.clientName}>{client.firstName} {client.lastName}</Text>
            <Text style={styles.meta}>{client.hairProfile.hairType} • {client.hairProfile.porosity} porosity • {client.hairProfile.density} density</Text>
            <Text style={styles.meta}>Goals: {client.goals.join(', ') || 'None added'}</Text>
            {client.lastFormulaUsed ? <Text style={styles.formula}>Last formula: {client.lastFormulaUsed}</Text> : null}
          </Card>
        </Pressable>
      ))}

      {!filteredClients.length && status !== 'loading' && <Text style={styles.empty}>No clients found.</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 30, fontWeight: '900', color: '#1E1A17' },
  subtitle: { fontSize: 15, color: '#5F534D' },
  clientName: { fontSize: 20, fontWeight: '800', color: '#1E1A17' },
  meta: { color: '#5F534D', lineHeight: 20 },
  formula: { color: '#8A4B2B', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#5F534D', marginTop: 20 },
  error: { color: '#B42318', fontWeight: '700' },
});
