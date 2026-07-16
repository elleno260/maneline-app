import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PAGE_HORIZONTAL_PADDING,
  PAGE_TOP_PADDING,
  TAB_BOTTOM_PADDING,
} from '../../constants/layout';
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

type ActionItem = {
  title: string;
  subtitle: string;
  icon: IconName;
  onPress: () => void;
};

const STORAGE_KEY = 'MANELINE_PROFILE_V1';

const hairTypes = ['1A-2C', '3A', '3B', '3C', '4A', '4B', '4C'];
const porosityOptions = ['Low', 'Medium', 'High', 'Unsure'];
const densityOptions = ['Fine', 'Medium', 'Thick', 'Unsure'];
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
    note: 'Only refresh if your hair feels dry. Do not add product just to add product.',
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

export default function ProfileScreen() {
  const [profile, setProfile] = useState<HairProfile>(defaultProfile);
  const [draft, setDraft] = useState<HairProfile>(defaultProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [routineReminders, setRoutineReminders] = useState(true);
  const [ingredientAlerts, setIngredientAlerts] = useState(true);
  const [marketplacePersonalization, setMarketplacePersonalization] =
    useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      setProfile(defaultProfile);
      setDraft(defaultProfile);
      return;
    }

    try {
      const savedProfile = JSON.parse(raw) as Partial<HairProfile>;

      const mergedProfile: HairProfile = {
        ...defaultProfile,
        ...savedProfile,
        goals: savedProfile.goals ?? defaultProfile.goals,
        routineSteps: savedProfile.routineSteps ?? defaultProfile.routineSteps,
        routineCompatibilityScore:
          savedProfile.routineCompatibilityScore ??
          defaultProfile.routineCompatibilityScore,
      };

      setProfile(mergedProfile);
      setDraft(mergedProfile);
    } catch {
      setProfile(defaultProfile);
      setDraft(defaultProfile);
    }
  }

  async function saveProfile(nextProfile: HairProfile) {
    setProfile(nextProfile);
    setDraft(nextProfile);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
  }

  function openEditor() {
    setDraft(profile);
    setIsEditing(true);
  }

  async function handleSaveDraft() {
    await saveProfile(draft);
    setIsEditing(false);
  }

  function toggleGoal(goal: string) {
    setDraft((current) => {
      const alreadySelected = current.goals.includes(goal);

      return {
        ...current,
        goals: alreadySelected
          ? current.goals.filter((item) => item !== goal)
          : [...current.goals, goal],
      };
    });
  }

  function updateRoutineStep(
    stepId: string,
    field: keyof Omit<RoutineStep, 'id'>,
    value: string
  ) {
    setDraft((current) => ({
      ...current,
      routineSteps: current.routineSteps.map((step) =>
        step.id === stepId ? { ...step, [field]: value } : step
      ),
    }));
  }

  function resetDemoProfile() {
    Alert.alert(
      'Reset profile?',
      'This will reset the demo profile back to the default ManeLine profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await saveProfile(defaultProfile);
          },
        },
      ]
    );
  }

  function goTo(path: string) {
    router.push(path as never);
  }

  const profileCompletion = useMemo(() => {
    const fields = [
      profile.displayName,
      profile.email,
      profile.hairType,
      profile.porosity,
      profile.density,
      profile.scalp,
      profile.routineFocus,
    ];

    const completedFields = fields.filter(Boolean).length;
    const hasGoals = profile.goals.length > 0 ? 1 : 0;
    const hasRoutine = profile.routineSteps.length > 0 ? 1 : 0;

    return Math.round(((completedFields + hasGoals + hasRoutine) / 9) * 100);
  }, [profile]);

  const actionItems: ActionItem[] = [
    {
      title: 'Edit Avatar',
      subtitle: 'Update your ManeLine look',
      icon: 'person-circle-outline',
      onPress: () => goTo('/editAvatar'),
    },
    {
      title: 'Hair Profile Setup',
      subtitle: 'Retake profile questions',
      icon: 'sparkles-outline',
      onPress: () => goTo('/hairProfileSetup'),
    },
    {
      title: 'Scan History',
      subtitle: 'View products you scanned',
      icon: 'time-outline',
      onPress: () => goTo('/(tabs)/results'),
    },
    {
      title: 'Product Library',
      subtitle: 'Shop routine-matched products',
      icon: 'bag-outline',
      onPress: () => goTo('/(tabs)/search'),
    },
    {
      title: 'Review Scan',
      subtitle: 'Demo the review flow',
      icon: 'document-text-outline',
      onPress: () => goTo('/review-scan'),
    },
    {
      title: 'Login Screen',
      subtitle: 'Preview auth flow',
      icon: 'log-in-outline',
      onPress: () => goTo('/login'),
    },
  ];
const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
contentContainerStyle={[
  styles.content,
  {
    paddingTop: insets.top + PAGE_TOP_PADDING,
    paddingBottom: TAB_BOTTOM_PADDING,
  },
]}      >
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.displayName.slice(0, 1).toUpperCase()}
              </Text>
            </View>

            <View style={styles.headerTextWrap}>
              <Text style={styles.eyebrow}>Your ManeLine profile</Text>
              <Text style={styles.name}>{profile.displayName}</Text>
              <Text style={styles.email}>{profile.email}</Text>
            </View>

            <Pressable style={styles.editButton} onPress={openEditor}>
              <Ionicons name="create-outline" size={20} color="#111827" />
            </Pressable>
          </View>

          <View style={styles.completionWrap}>
            <View style={styles.completionTop}>
              <Text style={styles.completionText}>Profile strength</Text>
              <Text style={styles.completionPercent}>{profileCompletion}%</Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${profileCompletion}%` },
                ]}
              />
            </View>

            <Text style={styles.completionHint}>
              The more complete your profile is, the better your scan results
              and product matches become.
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <MiniStat
            icon="scan-outline"
            label="Scans"
            value="12"
            helper="saved"
          />
          <MiniStat
            icon="heart-outline"
            label="Saved"
            value="8"
            helper="products"
          />
          <MiniStat
            icon="sparkles-outline"
            label="Routine"
            value={`${profile.routineCompatibilityScore}%`}
            helper="match"
          />
        </View>

        <SectionTitle
          title="Hair identity"
          subtitle="This powers your scan results and product recommendations."
        />

        <View style={styles.identityGrid}>
          <ProfileChip
            icon="flower-outline"
            label="Hair type"
            value={profile.hairType}
          />
          <ProfileChip
            icon="water-outline"
            label="Porosity"
            value={profile.porosity}
          />
          <ProfileChip
            icon="layers-outline"
            label="Density"
            value={profile.density}
          />
          <ProfileChip
            icon="leaf-outline"
            label="Scalp"
            value={profile.scalp}
          />
        </View>

        <SectionTitle
          title="Hair goals"
          subtitle="What your routine is built around."
        />

        <View style={styles.goalWrap}>
          {profile.goals.map((goal) => (
            <View key={goal} style={styles.goalChip}>
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
              <Text style={styles.goalText}>{goal}</Text>
            </View>
          ))}
        </View>

        <View style={styles.routineCard}>
          <View style={styles.routineIcon}>
            <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.routineTitle}>Routine focus</Text>
            <Text style={styles.routineText}>{profile.routineFocus}</Text>

            <Pressable onPress={() => router.push('/routine' as never)}>
              <Text style={styles.editRoutineText}>Edit routine</Text>
              </Pressable>
          </View>
        </View>

        <View style={styles.compatibilityCard}>
          <View>
            <Text style={styles.compatibilityLabel}>Routine compatibility</Text>
            <Text style={styles.compatibilityScore}>
              {profile.routineCompatibilityScore}%
            </Text>
          </View>

          <Text style={styles.compatibilityText}>
            This score reflects how well your current routine supports your hair type,
  porosity, scalp needs, and goals. It will become smarter as you scan more
  products.
          </Text>
        </View>

        <SectionTitle
          title="My routine"
          subtitle="The routine ManeLine uses to shape product matches and scan recommendations."
        />

        <View style={styles.routineList}>
          {profile.routineSteps.map((step, index) => (
            <View key={step.id} style={styles.routineStepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepFrequency}>{step.frequency}</Text>
                <Text style={styles.stepProduct}>{step.productType}</Text>
                <Text style={styles.stepNote}>{step.note}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.marketplaceCard}>
          <View style={styles.marketplaceTop}>
            <View>
              <Text style={styles.marketplaceEyebrow}>Coming marketplace</Text>
              <Text style={styles.marketplaceTitle}>Products picked for you</Text>
            </View>

            <View style={styles.marketplaceIcon}>
              <Ionicons name="bag-handle-outline" size={24} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.marketplaceText}>
            Your marketplace can use this profile, scan history, and routine to
            recommend products that actually match your hair needs.
          </Text>

          <Pressable
            style={styles.marketplaceButton}
            onPress={() => goTo('/(tabs)/search')}
          >
            <Text style={styles.marketplaceButtonText}>Explore product library</Text>
            <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
          </Pressable>
        </View>

        <SectionTitle
          title="Demo shortcuts"
          subtitle="Quick access while presenting the app."
        />

        <View style={styles.actionGrid}>
          {actionItems.map((item) => (
            <Pressable
              key={item.title}
              style={styles.actionCard}
              onPress={item.onPress}
            >
              <View style={styles.actionIcon}>
                <Ionicons name={item.icon} size={22} color="#111827" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>{item.title}</Text>
                <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>
          ))}
        </View>

        <SectionTitle title="Settings" subtitle="Personalize the app experience." />

        <View style={styles.settingsCard}>
          <SettingRow
            icon="notifications-outline"
            title="Routine reminders"
            subtitle="Get nudges for wash day, deep conditioning, and product use."
            value={routineReminders}
            onValueChange={setRoutineReminders}
          />

          <View style={styles.divider} />

          <SettingRow
            icon="warning-outline"
            title="Ingredient alerts"
            subtitle="Flag ingredients that may not fit your profile."
            value={ingredientAlerts}
            onValueChange={setIngredientAlerts}
          />

          <View style={styles.divider} />

          <SettingRow
            icon="bag-outline"
            title="Marketplace personalization"
            subtitle="Use your profile to improve product matches."
            value={marketplacePersonalization}
            onValueChange={setMarketplacePersonalization}
          />
        </View>

        <Pressable style={styles.resetButton} onPress={resetDemoProfile}>
          <Ionicons name="refresh-outline" size={18} color="#B91C1C" />
          <Text style={styles.resetText}>Reset demo profile</Text>
        </Pressable>
      </ScrollView>

      <EditProfileModal
        visible={isEditing}
        draft={draft}
        setDraft={setDraft}
        onClose={() => setIsEditing(false)}
        onSave={handleSaveDraft}
        toggleGoal={toggleGoal}
        updateRoutineStep={updateRoutineStep}
      />
    </View>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

function MiniStat({
  icon,
  label,
  value,
  helper,
}: {
  icon: IconName;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={21} color="#D97706" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statHelper}>{helper}</Text>
    </View>
  );
}

function ProfileChip({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.profileChip}>
      <View style={styles.profileChipIcon}>
        <Ionicons name={icon} size={20} color="#111827" />
      </View>

      <Text style={styles.profileChipLabel}>{label}</Text>
      <Text style={styles.profileChipValue}>{value}</Text>
    </View>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={21} color="#111827" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>

      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function EditProfileModal({
  visible,
  draft,
  setDraft,
  onClose,
  onSave,
  toggleGoal,
  updateRoutineStep,
}: {
  visible: boolean;
  draft: HairProfile;
  setDraft: React.Dispatch<React.SetStateAction<HairProfile>>;
  onClose: () => void;
  onSave: () => void;
  toggleGoal: (goal: string) => void;
  updateRoutineStep: (
    stepId: string,
    field: keyof Omit<RoutineStep, 'id'>,
    value: string
  ) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Edit hair profile</Text>
              <Text style={styles.modalSubtitle}>
                Update the details that shape your product matches.
              </Text>
            </View>

            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={26} color="#111827" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              value={draft.displayName}
              onChangeText={(text) =>
                setDraft((current) => ({ ...current, displayName: text }))
              }
              placeholder="Your name"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              value={draft.email}
              onChangeText={(text) =>
                setDraft((current) => ({ ...current, email: text }))
              }
              placeholder="Your email"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <OptionGroup
              label="Hair type"
              options={hairTypes}
              selected={draft.hairType}
              onSelect={(value) =>
                setDraft((current) => ({ ...current, hairType: value }))
              }
            />

            <OptionGroup
              label="Porosity"
              options={porosityOptions}
              selected={draft.porosity}
              onSelect={(value) =>
                setDraft((current) => ({ ...current, porosity: value }))
              }
            />

            <OptionGroup
              label="Density"
              options={densityOptions}
              selected={draft.density}
              onSelect={(value) =>
                setDraft((current) => ({ ...current, density: value }))
              }
            />

            <OptionGroup
              label="Scalp"
              options={scalpOptions}
              selected={draft.scalp}
              onSelect={(value) =>
                setDraft((current) => ({ ...current, scalp: value }))
              }
            />

            <Text style={styles.inputLabel}>Hair goals</Text>
            <View style={styles.modalGoalWrap}>
              {goalOptions.map((goal) => {
                const isSelected = draft.goals.includes(goal);

                return (
                  <Pressable
                    key={goal}
                    onPress={() => toggleGoal(goal)}
                    style={[
                      styles.modalGoalChip,
                      isSelected && styles.modalGoalChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalGoalText,
                        isSelected && styles.modalGoalTextActive,
                      ]}
                    >
                      {goal}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Routine focus</Text>
            <TextInput
              value={draft.routineFocus}
              onChangeText={(text) =>
                setDraft((current) => ({ ...current, routineFocus: text }))
              }
              placeholder="Describe your current routine focus"
              multiline
              style={[styles.input, styles.textArea]}
            />

            <Text style={styles.inputLabel}>Routine compatibility score</Text>
            <TextInput
              value={String(draft.routineCompatibilityScore)}
              onChangeText={(text) => {
                const numericValue = Number(text.replace(/[^0-9]/g, ''));
                const safeValue = Math.max(0, Math.min(100, numericValue || 0));

                setDraft((current) => ({
                  ...current,
                  routineCompatibilityScore: safeValue,
                }));
              }}
              keyboardType="number-pad"
              placeholder="0-100"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Full routine</Text>

            {draft.routineSteps.map((step, index) => (
              <View key={step.id} style={styles.editRoutineCard}>
                <Text style={styles.editRoutineTitle}>
                  Step {index + 1}: {step.title}
                </Text>

                <Text style={styles.smallInputLabel}>Step name</Text>
                <TextInput
                  value={step.title}
                  onChangeText={(text) =>
                    updateRoutineStep(step.id, 'title', text)
                  }
                  style={styles.input}
                />

                <Text style={styles.smallInputLabel}>Frequency</Text>
                <TextInput
                  value={step.frequency}
                  onChangeText={(text) =>
                    updateRoutineStep(step.id, 'frequency', text)
                  }
                  style={styles.input}
                />

                <Text style={styles.smallInputLabel}>Product type</Text>
                <TextInput
                  value={step.productType}
                  onChangeText={(text) =>
                    updateRoutineStep(step.id, 'productType', text)
                  }
                  multiline
                  style={[styles.input, styles.smallTextArea]}
                />

                <Text style={styles.smallInputLabel}>Routine note</Text>
                <TextInput
                  value={step.note}
                  onChangeText={(text) =>
                    updateRoutineStep(step.id, 'note', text)
                  }
                  multiline
                  style={[styles.input, styles.smallTextArea]}
                />
              </View>
            ))}

            <Text style={styles.inputLabel}>Allergies or sensitivities</Text>
            <TextInput
              value={draft.allergies}
              onChangeText={(text) =>
                setDraft((current) => ({ ...current, allergies: text }))
              }
              placeholder="Optional"
              multiline
              style={[styles.input, styles.textArea]}
            />

            <Pressable style={styles.saveButton} onPress={onSave}>
              <Text style={styles.saveButtonText}>Save profile</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function OptionGroup({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View>
      <Text style={styles.inputLabel}>{label}</Text>

      <View style={styles.optionWrap}>
        {options.map((option) => {
          const isSelected = selected === option;

          return (
            <Pressable
              key={option}
              onPress={() => onSelect(option)}
              style={[styles.optionChip, isSelected && styles.optionChipActive]}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextActive,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
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
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
  },
  headerCard: {
    backgroundColor: '#111827',
    borderRadius: 30,
    padding: 22,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerTextWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FBBF24',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  name: {
    marginTop: 4,
    fontSize: 27,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  email: {
    marginTop: 3,
    fontSize: 14,
    color: '#D1D5DB',
  },
  editButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionWrap: {
    marginTop: 22,
  },
  completionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  completionText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '800',
  },
  completionPercent: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  progressTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: '#374151',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#FBBF24',
  },
  completionHint: {
    marginTop: 9,
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3D5C0',
  },
  statValue: {
    marginTop: 9,
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  statHelper: {
    marginTop: 2,
    fontSize: 11,
    color: '#6B7280',
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#111827',
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  identityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  profileChip: {
    width: '47.8%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 15,
    borderWidth: 1,
    borderColor: '#F3D5C0',
  },
  profileChipIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  profileChipLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
  },
  profileChipValue: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  goalWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 18,
  },
  goalChip: {
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  routineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F3D5C0',
    flexDirection: 'row',
    gap: 14,
    marginBottom: 22,
  },
  routineIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
  },
  routineText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#4B5563',
  },
  editRoutineText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '900',
    color: '#D97706',
    textDecorationLine: 'underline',
  },
  compatibilityCard: {
    backgroundColor: '#D97706',
    borderRadius: 28,
    padding: 18,
    marginBottom: 24,
  },
  compatibilityLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFF7ED',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  compatibilityScore: {
    marginTop: 5,
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  compatibilityText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  routineList: {
    gap: 12,
    marginBottom: 24,
  },
  routineStepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3D5C0',
    flexDirection: 'row',
    gap: 13,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  stepFrequency: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '900',
    color: '#D97706',
  },
  stepProduct: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
  },
  stepNote: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
  },
  marketplaceCard: {
    backgroundColor: '#111827',
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
  },
  marketplaceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  marketplaceEyebrow: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FBBF24',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  marketplaceTitle: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  marketplaceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketplaceText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    color: '#E5E7EB',
  },
  marketplaceButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    backgroundColor: '#D97706',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  marketplaceButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  actionGrid: {
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 15,
    borderWidth: 1,
    borderColor: '#F3D5C0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },
  actionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#6B7280',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3D5C0',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  settingSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  resetButton: {
    marginTop: 18,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  resetText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 22,
    maxHeight: '92%',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
    marginBottom: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  inputLabel: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
  },
  smallInputLabel: {
    marginTop: 12,
    marginBottom: 7,
    fontSize: 12,
    fontWeight: '900',
    color: '#4B5563',
  },
  input: {
    backgroundColor: '#FFF7F0',
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
  },
  smallTextArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    backgroundColor: '#FFF7F0',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F3D5C0',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  optionChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  optionText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '800',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  modalGoalWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalGoalChip: {
    backgroundColor: '#FFF7F0',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F3D5C0',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalGoalChipActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  modalGoalText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '800',
  },
  modalGoalTextActive: {
    color: '#FFFFFF',
  },
  editRoutineCard: {
    backgroundColor: '#FFF7F0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3D5C0',
    padding: 14,
    marginBottom: 12,
  },
  editRoutineTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
  },
  saveButton: {
    marginTop: 22,
    marginBottom: 28,
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