import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { useClientStore } from '@/store/clientStore';
import type { CreateClientInput, Density, HairType, Porosity, ScalpCondition } from '@/types/client.types';

function splitList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export default function NewClientScreen() {
  const { createNewClient, status } = useClientStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [hairType, setHairType] = useState<HairType>('unknown');
  const [curlPattern, setCurlPattern] = useState('');
  const [porosity, setPorosity] = useState<Porosity>('unknown');
  const [density, setDensity] = useState<Density>('unknown');
  const [scalp, setScalp] = useState<ScalpCondition>('unknown');
  const [naturalColor, setNaturalColor] = useState('');
  const [currentColor, setCurrentColor] = useState('');
  const [goals, setGoals] = useState('');
  const [chemicalHistory, setChemicalHistory] = useState('');
  const [allergies, setAllergies] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');

  const save = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing name', 'Add the client first and last name.');
      return;
    }

    const input: CreateClientInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      hairProfile: {
        hairType,
        curlPattern: curlPattern.trim() || undefined,
        porosity,
        density,
        scalp,
        naturalColor: naturalColor.trim() || undefined,
        currentColor: currentColor.trim() || undefined,
      },
      goals: splitList(goals),
      chemicalHistory: splitList(chemicalHistory),
      allergies: splitList(allergies),
      privateNotes: privateNotes.trim() || undefined,
    };

    const id = await createNewClient(input);
    router.replace(`/stylist/client/${id}`);
  };

  return (
    <Screen>
      <Text style={styles.title}>Add Client</Text>
      <Text style={styles.note}>Use comma-separated values for goals, allergies, and chemical history.</Text>

      <AppTextInput label="First name" value={firstName} onChangeText={setFirstName} />
      <AppTextInput label="Last name" value={lastName} onChangeText={setLastName} />
      <AppTextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <AppTextInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <AppTextInput label="Hair type" value={hairType} onChangeText={(v) => setHairType(v as HairType)} placeholder="coily, curly, wavy, straight, locs" />
      <AppTextInput label="Curl pattern / style notes" value={curlPattern} onChangeText={setCurlPattern} placeholder="4C, 3B, silk press, locs, etc." />
      <AppTextInput label="Porosity" value={porosity} onChangeText={(v) => setPorosity(v as Porosity)} placeholder="low, medium, high" />
      <AppTextInput label="Density" value={density} onChangeText={(v) => setDensity(v as Density)} placeholder="low, medium, high" />
      <AppTextInput label="Scalp" value={scalp} onChangeText={(v) => setScalp(v as ScalpCondition)} placeholder="normal, dry, oily, flaky, sensitive" />
      <AppTextInput label="Natural color" value={naturalColor} onChangeText={setNaturalColor} />
      <AppTextInput label="Current color" value={currentColor} onChangeText={setCurrentColor} />
      <AppTextInput label="Goals" value={goals} onChangeText={setGoals} placeholder="length retention, moisture, color repair" />
      <AppTextInput label="Chemical history" value={chemicalHistory} onChangeText={setChemicalHistory} placeholder="relaxer, bleach, keratin, color" />
      <AppTextInput label="Allergies / sensitivities" value={allergies} onChangeText={setAllergies} placeholder="fragrance, coconut oil, aloe" />
      <AppTextInput label="Private stylist notes" value={privateNotes} onChangeText={setPrivateNotes} multiline />

      <PrimaryButton title={status === 'saving' ? 'Saving...' : 'Save Client'} disabled={status === 'saving'} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '900', color: '#1E1A17' },
  note: { color: '#5F534D', lineHeight: 20 },
});
