import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = ComponentProps<typeof Ionicons>['name'];

type RoutineStep = {
  id: string;
  title: string;
  frequency: string;
  productType: string;
  note: string;
};

type HairProfile = {
  displayName: string;
  email: string;
  hairType: string;
  porosity: string;
  density: string;
  scalp: string;
  goals: string[];
  routineFocus: string;
  routineSteps: RoutineStep[];
  routineCompatibilityScore: number;
  allergies: string;
};

const STORAGE_KEY = 'MANELINE_PROFILE_V1';

const defaultRoutineSteps: RoutineStep[] = [
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
    note: 'Apply in sections so the product distributes evenly.',
  },
  {
    id: 'seal-style',
    title: 'Seal + style',
    frequency: 'After moisturizing',
    productType: 'Light cream or gel depending on the style',
    note: 'Avoid over-layering heavy products to reduce buildup.',
  },
  {
    id: 'refresh',
    title: 'Refresh',
    frequency: 'Midweek or as needed',
    productType: 'Water-based mist or light moisturizer',
    note: 'Only refresh if your hair feels dry.',
  },
];

const defaultProfile: HairProfile = {
  displayName: 'Ellen',
  email: 'ellen@example.com',
  hairType: '4C',
  porosity: 'Low',
  density: 'Fine',
  scalp: 'Dry',
  goals: ['Moisture', 'Length retention', 'Growth', 'Thickness'],
  routineFocus:
    'Moisture-first routine with lightweight products and buildup control.',
  routineCompatibilityScore: 91,
  allergies: '',
  routineSteps: defaultRoutineSteps,
};

export default function RoutineScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<HairProfile>(defaultProfile);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      setProfile(defaultProfile);
      return;
    }

    try {
      const saved = JSON.parse(raw) as Partial<HairProfile>;

      setProfile({
        ...defaultProfile,
        ...saved,
        goals: saved.goals ?? defaultProfile.goals,
        routineSteps: saved.routineSteps ?? defaultProfile.routineSteps,
        routineCompatibilityScore:
          saved.routineCompatibilityScore ??
          defaultProfile.routineCompatibilityScore,
      });
    } catch {
      setProfile(defaultProfile);
    }
  }

  async function saveRoutine() {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));

    Alert.alert('Routine saved', 'Your routine has been updated.', [
      {
        text: 'Done',
        onPress: () => router.back(),
      },
    ]);
  }

  function updateStep(
    stepId: string,
    field: keyof Omit<RoutineStep, 'id'>,
    value: string
  ) {
    setProfile((current) => ({
      ...current,
      routineSteps: current.routineSteps.map((step) =>
        step.id === stepId ? { ...step, [field]: value } : step
      ),
    }));
  }

  function addRoutineStep() {
    const nextStep: RoutineStep = {
      id: `step-${Date.now()}`,
      title: 'New step',
      frequency: 'As needed',
      productType: '',
      note: '',
    };

    setProfile((current) => ({
      ...current,
      routineSteps: [...current.routineSteps, nextStep],
    }));
  }

  function removeRoutineStep(stepId: string) {
    setProfile((current) => ({
      ...current,
      routineSteps: current.routineSteps.filter((step) => step.id !== stepId),
    }));
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 18,
            paddingBottom: 140,
          },
        ]}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Routine builder</Text>
          <Text style={styles.title}>Edit your hair routine</Text>
          <Text style={styles.subtitle}>
            ManeLine uses your routine to make better product matches, scan
            insights, and marketplace recommendations.
          </Text>
        </View>

        <View style={styles.scoreCard}>
          <View>
            <Text style={styles.scoreLabel}>Routine compatibility</Text>
            <Text style={styles.score}>{profile.routineCompatibilityScore}%</Text>
          </View>

          <Text style={styles.scoreExplanation}>
            This score reflects how well your routine supports your hair type,
            porosity, scalp needs, and goals. It can improve as your routine and
            scan history become more complete.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Routine focus</Text>

        <TextInput
          value={profile.routineFocus}
          onChangeText={(text) =>
            setProfile((current) => ({ ...current, routineFocus: text }))
          }
          multiline
          style={[styles.input, styles.textArea]}
          placeholder="Describe your routine focus"
          placeholderTextColor="#9CA3AF"
        />

        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.sectionTitle}>Routine steps</Text>
            <Text style={styles.sectionSubtitle}>
              Add the steps you actually follow.
            </Text>
          </View>

          <Pressable style={styles.addButton} onPress={addRoutineStep}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {profile.routineSteps.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={30} color="#111827" />
            <Text style={styles.emptyTitle}>No routine yet</Text>
            <Text style={styles.emptyText}>
              Add your cleanse, condition, moisturize, style, or refresh steps
              so ManeLine can personalize your recommendations.
            </Text>

            <Pressable style={styles.emptyButton} onPress={addRoutineStep}>
              <Text style={styles.emptyButtonText}>Add first step</Text>
            </Pressable>
          </View>
        ) : (
          profile.routineSteps.map((step, index) => (
            <View key={step.id} style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>Routine step</Text>
                  <Text style={styles.stepSubtitle}>
                    Update the name, frequency, product type, and notes.
                  </Text>
                </View>

                <Pressable
                  onPress={() => removeRoutineStep(step.id)}
                  hitSlop={10}
                >
                  <Ionicons name="trash-outline" size={20} color="#B91C1C" />
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Step name</Text>
              <TextInput
                value={step.title}
                onChangeText={(text) => updateStep(step.id, 'title', text)}
                style={styles.input}
                placeholder="Cleanse, condition, moisturize..."
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Frequency</Text>
              <TextInput
                value={step.frequency}
                onChangeText={(text) => updateStep(step.id, 'frequency', text)}
                style={styles.input}
                placeholder="Weekly, every 7–10 days, daily..."
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Product type</Text>
              <TextInput
                value={step.productType}
                onChangeText={(text) => updateStep(step.id, 'productType', text)}
                multiline
                style={[styles.input, styles.smallTextArea]}
                placeholder="Leave-in conditioner, gel, clarifying shampoo..."
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                value={step.note}
                onChangeText={(text) => updateStep(step.id, 'note', text)}
                multiline
                style={[styles.input, styles.smallTextArea]}
                placeholder="What should ManeLine remember about this step?"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.saveButton} onPress={saveRoutine}>
          <Text style={styles.saveButtonText}>Save routine</Text>
        </Pressable>
      </View>
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
    borderRadius: 32,
    padding: 22,
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FBBF24',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
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
    lineHeight: 23,
    color: '#E5E7EB',
  },
  scoreCard: {
    backgroundColor: '#D97706',
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFF7ED',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  score: {
    marginTop: 5,
    fontSize: 50,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scoreExplanation: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionRow: {
    marginTop: 22,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  addButton: {
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  inputLabel: {
    marginTop: 12,
    marginBottom: 7,
    fontSize: 12,
    fontWeight: '900',
    color: '#4B5563',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3D5C0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 4,
  },
  smallTextArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3D5C0',
    marginBottom: 14,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },
  stepSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3D5C0',
    marginBottom: 18,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 19,
    fontWeight: '900',
    color: '#111827',
  },
  emptyText: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 15,
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    backgroundColor: 'rgba(255, 247, 240, 0.96)',
    borderTopWidth: 1,
    borderTopColor: '#F3D5C0',
  },
  saveButton: {
    backgroundColor: '#111827',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});