import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { waitForAuthUser } from '../services/authService';
import { saveUserHairProfile } from '../services/profileFirebaseService';

const hairTypeOptions = ['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C', '4A', '4B', '4C'];
const porosityOptions = ['Low', 'Medium', 'High', 'Unsure'];
const densityOptions = ['Fine', 'Medium', 'Coarse', 'Unsure'];
const scalpOptions = ['Balanced', 'Dry', 'Oily', 'Sensitive', 'Flaky'];

const goalOptions = [
  'Moisture',
  'Length retention',
  'Growth',
  'Thickness',
  'Scalp health',
  'Definition',
  'Repair',
  'Heat protection',
  'Color care',
];

const defaultRoutineSteps = [
  {
    id: 'cleanse',
    title: 'Cleanse',
    frequency: 'Every 7–10 days',
    productType: 'Gentle shampoo or clarifying shampoo as needed',
    note: 'Focus on removing buildup without stripping your hair.',
  },
  {
    id: 'deep-condition',
    title: 'Deep condition',
    frequency: 'Weekly',
    productType: 'Moisturizing deep conditioner',
    note: 'Use heat or steam if your hair struggles to absorb moisture.',
  },
  {
    id: 'leave-in',
    title: 'Leave-in',
    frequency: 'After every wash',
    productType: 'Lightweight leave-in conditioner',
    note: 'Apply in sections so product distributes evenly.',
  },
  {
    id: 'seal-style',
    title: 'Seal + style',
    frequency: 'After moisturizing',
    productType: 'Light cream, gel, or styler depending on your routine',
    note: 'Avoid over-layering heavy products to reduce buildup.',
  },
  {
    id: 'refresh',
    title: 'Refresh',
    frequency: 'Midweek or as needed',
    productType: 'Water-based mist or light moisturizer',
    note: 'Refresh only when your hair feels dry.',
  },
];

export default function HairProfileSetupScreen() {
  const insets = useSafeAreaInsets();

  const [hairType, setHairType] = useState('4C');
  const [porosity, setPorosity] = useState('Low');
  const [density, setDensity] = useState('Fine');
  const [scalp, setScalp] = useState('Dry');
  const [goals, setGoals] = useState<string[]>([
    'Moisture',
    'Length retention',
  ]);
  const [allergies, setAllergies] = useState('');
  const [saving, setSaving] = useState(false);

  function toggleGoal(goal: string) {
    setGoals((currentGoals) => {
      if (currentGoals.includes(goal)) {
        return currentGoals.filter((item) => item !== goal);
      }

      return [...currentGoals, goal];
    });
  }

  async function handleSaveProfile() {
    if (!hairType || !porosity || !density || !scalp) {
      Alert.alert(
        'Missing information',
        'Please complete your hair type, porosity, strand thickness, and scalp profile.'
      );
      return;
    }

    if (goals.length === 0) {
      Alert.alert(
        'Choose at least one goal',
        'Select at least one hair goal so ManeLine can personalize your product matches.'
      );
      return;
    }

    setSaving(true);

    try {
      const user = await waitForAuthUser();

      if (!user) {
        Alert.alert(
          'Could not start ManeLine',
          'Maneline could not create guest session. Please check your connection and try again.'
        );
        return;
      }

      await saveUserHairProfile({
        displayName: user.displayName ?? user.email?.split('@')[0] ?? 'User',
        email: user.email ?? '',
        hairType,
        porosity,
        density,
        scalp,
        goals,
        allergies: allergies.trim(),
        routineFocus:
          'Build a routine that supports my hair goals and helps ManeLine recommend better products.',
        routineCompatibilityScore: 0,
        routineSteps: defaultRoutineSteps,
      });

      Alert.alert('Profile saved', 'Your hair profile is ready.', [
        {
          text: 'Continue',
          onPress: () => router.replace('/(tabs)/scan' as never),
        },
      ]);
    } catch (error) {
      console.warn('Could not save hair profile:', error);

      Alert.alert(
        'Profile not saved',
        'We could not save your hair profile. Please make sure you are signed in and try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 18,
            paddingBottom: 130,
          },
        ]}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Hair Profile</Text>
          <Text style={styles.title}>Tell ManeLine about your hair.</Text>
          <Text style={styles.subtitle}>
            Your profile helps ManeLine score products, explain ingredients, and
            build better recommendations for your actual routine.
          </Text>
        </View>

        <Section title="Hair type" subtitle="Choose the pattern closest to your hair.">
          <ChipGroup
            options={hairTypeOptions}
            selectedValue={hairType}
            onSelect={setHairType}
          />
        </Section>

        <Section
          title="Porosity"
          subtitle="This helps ManeLine understand how your hair absorbs moisture."
        >
          <ChipGroup
            options={porosityOptions}
            selectedValue={porosity}
            onSelect={setPorosity}
          />
        </Section>

        <Section
          title="Strand Thickness"
          subtitle="How thick each individual strand feels. This helps ManeLine avoid products that may feel too heavy or too light for your hair."
        >
          <ChipGroup
            options={densityOptions}
            selectedValue={density}
            onSelect={setDensity}
          />
        </Section>

        <Section
          title="Scalp"
          subtitle="Your scalp needs matter when recommending shampoos, oils, and treatments."
        >
          <ChipGroup
            options={scalpOptions}
            selectedValue={scalp}
            onSelect={setScalp}
          />
        </Section>

        <Section
          title="Hair goals"
          subtitle="Pick everything you want ManeLine to consider."
        >
          <View style={styles.chipWrap}>
            {goalOptions.map((goal) => {
              const selected = goals.includes(goal);

              return (
                <Pressable
                  key={goal}
                  onPress={() => toggleGoal(goal)}
                  style={[styles.chip, selected && styles.chipActive]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextActive,
                    ]}
                  >
                    {goal}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section
          title="Allergies or sensitivities"
          subtitle="Optional. Add anything ManeLine should avoid."
        >
          <TextInput
            value={allergies}
            onChangeText={setAllergies}
            placeholder="Example: coconut oil, glycerin sensitivity, protein sensitivity"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            multiline
          />
        </Section>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="sparkles-outline" size={24} color="#111827" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>What happens next?</Text>
            <Text style={styles.summaryText}>
              After saving, scan a product barcode. ManeLine will compare the
              product to this profile and save your result to History.
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.saveButtonText}>Save hair profile</Text>
              <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      {children}
    </View>
  );
}

function ChipGroup({
  options,
  selectedValue,
  onSelect,
}: {
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.chipWrap}>
      {options.map((option) => {
        const selected = selectedValue === option;

        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={[styles.chip, selected && styles.chipActive]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextActive]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF7F0',
  },
  content: {
    paddingHorizontal: 20,
  },
  hero: {
    backgroundColor: '#111827',
    borderRadius: 34,
    padding: 22,
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FBBF24',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    marginTop: 8,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#E5E7EB',
    fontWeight: '700',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3D5C0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  sectionSubtitle: {
    marginTop: 4,
    marginBottom: 14,
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F3D5C0',
    backgroundColor: '#FFF7F0',
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  input: {
    minHeight: 86,
    backgroundColor: '#FFF7F0',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F3D5C0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 20,
    color: '#111827',
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: '#F3D5C0',
    borderRadius: 28,
    padding: 17,
    marginTop: 4,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 13,
    alignItems: 'flex-start',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
  },
  summaryText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 20,
    color: '#4B5563',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#D97706',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});