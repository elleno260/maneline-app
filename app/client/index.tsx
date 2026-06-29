import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';

export default function ClientHomeScreen() {
  return (
    <Screen>
      <Text style={styles.title}>My ManeLine</Text>
      <Text style={styles.subtitle}>Your stylist-shared routine, recommended products, and aftercare notes live here.</Text>
      <PrimaryButton title="View My Regimen" onPress={() => router.push('/client/regimen')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: '900', color: '#1E1A17' },
  subtitle: { color: '#5F534D', fontSize: 16, lineHeight: 22 },
});
