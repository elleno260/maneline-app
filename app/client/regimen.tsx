import { StyleSheet, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';

export default function ClientRegimenScreen() {
  return (
    <Screen>
      <Text style={styles.title}>My Regimen</Text>
      <Card>
        <Text style={styles.sectionTitle}>Coming next</Text>
        <Text style={styles.line}>Connect this screen after you add client invitations or clientUserId linking. The stylist side already saves sharedRegimen on each client profile.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '900', color: '#1E1A17' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1E1A17' },
  line: { color: '#4F4540', lineHeight: 20 },
});
