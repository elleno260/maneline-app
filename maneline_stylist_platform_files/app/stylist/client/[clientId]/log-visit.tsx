import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { useClientStore } from '@/store/clientStore';

function splitProducts(value: string) {
  return value.split(',').map((name) => ({ name: name.trim() })).filter((product) => product.name);
}

export default function LogVisitScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const { createVisit, status } = useClientStore();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [serviceName, setServiceName] = useState('');
  const [formulaUsed, setFormulaUsed] = useState('');
  const [productsUsed, setProductsUsed] = useState('');
  const [resultNotes, setResultNotes] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [clientVisibleSummary, setClientVisibleSummary] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');

  const save = async () => {
    if (!clientId || !serviceName.trim() || !resultNotes.trim()) {
      Alert.alert('Missing visit details', 'Add at least a service name and result notes.');
      return;
    }

    await createVisit(clientId, {
      date,
      services: [
        {
          name: serviceName.trim(),
          formulaUsed: formulaUsed.trim() || undefined,
          productsUsed: splitProducts(productsUsed),
        },
      ],
      resultNotes: resultNotes.trim(),
      conditionNotes: conditionNotes.trim() || undefined,
      clientVisibleSummary: clientVisibleSummary.trim() || undefined,
      privateNotes: privateNotes.trim() || undefined,
      isSharedWithClient: Boolean(clientVisibleSummary.trim()),
    });

    router.replace(`/stylist/client/${clientId}`);
  };

  return (
    <Screen>
      <Text style={styles.title}>Log Visit</Text>
      <Text style={styles.note}>This creates the history AI will use later. Keep formulas and internal observations in private notes when needed.</Text>

      <AppTextInput label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
      <AppTextInput label="Service" value={serviceName} onChangeText={setServiceName} placeholder="Trim, silk press, color, wash day, loc retwist" />
      <AppTextInput label="Formula used" value={formulaUsed} onChangeText={setFormulaUsed} placeholder="Optional stylist-facing formula" />
      <AppTextInput label="Products used" value={productsUsed} onChangeText={setProductsUsed} placeholder="Comma-separated product names" />
      <AppTextInput label="Result notes" value={resultNotes} onChangeText={setResultNotes} multiline />
      <AppTextInput label="Condition notes" value={conditionNotes} onChangeText={setConditionNotes} multiline placeholder="Dryness, breakage, scalp, elasticity, shedding" />
      <AppTextInput label="Client-visible summary" value={clientVisibleSummary} onChangeText={setClientVisibleSummary} multiline placeholder="What the client can see after the appointment" />
      <AppTextInput label="Private stylist notes" value={privateNotes} onChangeText={setPrivateNotes} multiline />

      <PrimaryButton title={status === 'saving' ? 'Saving...' : 'Save Visit'} disabled={status === 'saving'} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '900', color: '#1E1A17' },
  note: { color: '#5F534D', lineHeight: 20 },
});
