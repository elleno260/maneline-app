import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import type { ComponentProps } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
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

const COLORS = {
  lemonCream: '#FFF9C7',
  brown: '#3D2920',
  lightBlue: '#95BFFF',
  oxfordBlue: '#20314B',
  green: '#667D41',
  white: '#FFFFFF',
  background: '#FFFDF2',
  mutedText: '#6B7280',
  lightBorder: '#E7E2CB',
  danger: '#B91C1C',
};

type RoutineStepType =
  | 'Pre-Poo'
  | 'Shampoo'
  | 'Co-Wash'
  | 'Conditioner'
  | 'Deep Conditioner'
  | 'Protein Treatment'
  | 'Leave-In'
  | 'Cream'
  | 'Mousse / Foam'
  | 'Gel'
  | 'Serum'
  | 'Oil'
  | 'Scalp Treatment'
  | 'Heat Protectant'
  | 'Other';

type RoutineStep = {
  id: string;
  order: number;
  stepType: RoutineStepType;
  productName: string;
  productId?: string | null;
  productBrand?: string | null;
};

type RoutineActivity = Record<string, boolean>;

type RoutineProfile = {
  hairstyleEnabled: boolean;
  hairstyle: string;
  styleInstallDate: string;
  styleRemovalDate: string;
  scalpConditionEnabled: boolean;
  scalpCondition: string;
  headCoveringEnabled: boolean;
  headCovering: string;
};

type RoutineReminder = {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  dateKey?: string;
  dayIndex?: number;
  type: 'style' | 'scalp' | 'covering';
};

type HairActivityItem = {
  id: string;
  title: string;
  description?: string;
  icon: IconName;
  type: 'wash' | 'style' | 'reminder';
};

const ROUTINE_STORAGE_KEY = 'MANELINE_WASH_DAY_ROUTINE_V1';
const ACTIVITY_STORAGE_KEY = 'MANELINE_ROUTINE_ACTIVITY_V1';
const PROFILE_STORAGE_KEY = 'MANELINE_PROFILE_V1';

const stepTypes: RoutineStepType[] = [
  'Pre-Poo',
  'Shampoo',
  'Co-Wash',
  'Conditioner',
  'Deep Conditioner',
  'Protein Treatment',
  'Leave-In',
  'Cream',
  'Mousse / Foam',
  'Gel',
  'Serum',
  'Oil',
  'Scalp Treatment',
  'Heat Protectant',
  'Other',
];

const hairstyleOptions = ['Braids', 'Locs', 'Sew-in / Wig', 'Twist-out'];

const defaultRoutine: RoutineStep[] = [
  { id: 'step-1', order: 1, stepType: 'Shampoo', productName: '' },
  { id: 'step-2', order: 2, stepType: 'Deep Conditioner', productName: '' },
  { id: 'step-3', order: 3, stepType: 'Leave-In', productName: '' },
];

const defaultRoutineProfile: RoutineProfile = {
  hairstyleEnabled: false,
  hairstyle: '',
  styleInstallDate: '',
  styleRemovalDate: '',
  scalpConditionEnabled: false,
  scalpCondition: '',
  headCoveringEnabled: false,
  headCovering: '',
};

export default function RoutineScreen() {
  const insets = useSafeAreaInsets();
  const today = useMemo(() => new Date(), []);

  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [routineSteps, setRoutineSteps] = useState<RoutineStep[]>(defaultRoutine);
  const [activity, setActivity] = useState<RoutineActivity>({});
  const [profile, setProfile] = useState<RoutineProfile>(defaultRoutineProfile);
  const [stepMenuId, setStepMenuId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const [hairstyleModalVisible, setHairstyleModalVisible] = useState(false);
  const [hairstylePickerOpen, setHairstylePickerOpen] = useState(false);
  const [hairstyleDraft, setHairstyleDraft] = useState('');
  const [installDateDraft, setInstallDateDraft] = useState('');
  const [removalDateDraft, setRemovalDateDraft] = useState('');

  useFocusEffect(
    useCallback(() => {
      void loadRoutineData();
    }, [])
  );

  async function loadRoutineData() {
    try {
      const [routineRaw, activityRaw, profileRaw] = await Promise.all([
        AsyncStorage.getItem(ROUTINE_STORAGE_KEY),
        AsyncStorage.getItem(ACTIVITY_STORAGE_KEY),
        AsyncStorage.getItem(PROFILE_STORAGE_KEY),
      ]);

      if (routineRaw) {
        const savedRoutine = JSON.parse(routineRaw) as RoutineStep[];
        if (Array.isArray(savedRoutine) && savedRoutine.length > 0) {
          setRoutineSteps(savedRoutine);
        }
      }

      if (activityRaw) {
        setActivity(JSON.parse(activityRaw) as RoutineActivity);
      }

      if (profileRaw) {
        const savedProfile = JSON.parse(profileRaw) as Partial<RoutineProfile>;
        setProfile({ ...defaultRoutineProfile, ...savedProfile });
      } else {
        setProfile(defaultRoutineProfile);
      }

      setHasChanges(false);
    } catch (error) {
      console.warn('[ManeLine routine] Could not load data:', error);
    }
  }

  async function updateHairstyleProfile(updates: Partial<RoutineProfile>) {
    try {
      const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      let fullProfile: Record<string, unknown> = {};

      if (raw) {
        try {
          fullProfile = JSON.parse(raw);
        } catch {
          fullProfile = {};
        }
      }

      const updatedFullProfile = { ...fullProfile, ...updates };

      await AsyncStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify(updatedFullProfile)
      );

      setProfile((current) => ({ ...current, ...updates }));
    } catch (error) {
      console.warn('[ManeLine routine] Could not sync hairstyle:', error);
      Alert.alert('Could not update hairstyle', 'Please try again.');
    }
  }

  function openAddHairstyle() {
    setHairstyleDraft('');
    setInstallDateDraft(toDateKey(selectedDate));
    setRemovalDateDraft('');
    setHairstylePickerOpen(false);
    setHairstyleModalVisible(true);
  }

  function openEditHairstyle() {
    setHairstyleDraft(profile.hairstyle);
    setInstallDateDraft(profile.styleInstallDate);
    setRemovalDateDraft(profile.styleRemovalDate);
    setHairstylePickerOpen(false);
    setHairstyleModalVisible(true);
  }

  async function saveHairstyleToCalendar() {
    if (!hairstyleDraft) {
      Alert.alert('Choose a hairstyle', 'Select the hairstyle you want to add.');
      return;
    }

    const installDate = parseDateKey(installDateDraft);
    if (!installDate) {
      Alert.alert(
        'Invalid install date',
        'Use YYYY-MM-DD, for example 2026-08-17.'
      );
      return;
    }

    let removalDate: Date | null = null;
    if (removalDateDraft) {
      removalDate = parseDateKey(removalDateDraft);
      if (!removalDate) {
        Alert.alert(
          'Invalid removal date',
          'Use YYYY-MM-DD, for example 2026-09-21.'
        );
        return;
      }
      if (removalDate < installDate) {
        Alert.alert(
          'Check your dates',
          'The planned removal date cannot be before the install date.'
        );
        return;
      }
    }

    await updateHairstyleProfile({
      hairstyleEnabled: true,
      hairstyle: hairstyleDraft,
      styleInstallDate: toDateKey(installDate),
      styleRemovalDate: removalDate ? toDateKey(removalDate) : '',
    });

    setHairstyleModalVisible(false);
    setHairstylePickerOpen(false);
  }

  function markHairstyleRemoved() {
    if (!profile.hairstyleEnabled || !profile.hairstyle) return;

    const hairstyleName = profile.hairstyle;

    Alert.alert(
      'Mark hairstyle removed?',
      `This will mark ${hairstyleName} as removed today and turn off the hairstyle setting in your profile.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark removed',
          onPress: async () => {
            await updateHairstyleProfile({
              hairstyleEnabled: false,
              hairstyle: hairstyleName,
              styleInstallDate: profile.styleInstallDate,
              styleRemovalDate: toDateKey(new Date()),
            });
          },
        },
      ]
    );
  }

  const calendarReminders = useMemo(
    () => buildProfileReminders(profile),
    [
      profile.hairstyleEnabled,
      profile.hairstyle,
      profile.styleInstallDate,
      profile.styleRemovalDate,
      profile.scalpConditionEnabled,
      profile.scalpCondition,
      profile.headCoveringEnabled,
      profile.headCovering,
    ]
  );

  function getRemindersForDate(date: Date) {
    const dateKey = toDateKey(date);
    const dayIndex = date.getDay();

    return calendarReminders.filter((reminder) => {
      if (reminder.dateKey) return reminder.dateKey === dateKey;
      if (reminder.dayIndex !== undefined) return reminder.dayIndex === dayIndex;
      return false;
    });
  }

  const calendarCells = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const numberOfDays = new Date(year, month + 1, 0).getDate();
    const cells: Array<Date | null> = [];

    for (let i = 0; i < firstDay.getDay(); i += 1) cells.push(null);
    for (let day = 1; day <= numberOfDays; day += 1) {
      cells.push(new Date(year, month, day));
    }
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [visibleMonth]);

  const selectedDateKey = toDateKey(selectedDate);
  const selectedDateHasActivity = Boolean(activity[selectedDateKey]);
  const selectedDateReminders = getRemindersForDate(selectedDate);

  const selectedDateHairActivities = useMemo<HairActivityItem[]>(() => {
    const items: HairActivityItem[] = [];

    if (selectedDateHasActivity) {
      items.push({
        id: 'wash-day',
        title: 'Wash day',
        description: 'Wash day logged for this date.',
        icon: 'water-outline',
        type: 'wash',
      });
    }

    selectedDateReminders.forEach((reminder) => {
      items.push({
        id: reminder.id,
        title: reminder.title,
        description: reminder.description,
        icon: reminder.icon,
        type: reminder.type === 'style' ? 'style' : 'reminder',
      });
    });

    return items;
  }, [selectedDateHasActivity, selectedDateReminders]);

  function previousMonth() {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)
    );
  }

  function nextMonth() {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
    );
  }

  function goToToday() {
    const now = new Date();
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  }

  async function toggleRoutineActivity() {
    const nextActivity = {
      ...activity,
      [selectedDateKey]: !selectedDateHasActivity,
    };

    setActivity(nextActivity);

    try {
      await AsyncStorage.setItem(
        ACTIVITY_STORAGE_KEY,
        JSON.stringify(nextActivity)
      );
    } catch (error) {
      console.warn('[ManeLine routine] Could not save activity:', error);
    }
  }

  async function saveRoutine() {
    try {
      await AsyncStorage.setItem(
        ROUTINE_STORAGE_KEY,
        JSON.stringify(routineSteps)
      );
      setHasChanges(false);
      Alert.alert('Routine saved', 'Your Wash Day Routine has been updated.');
    } catch (error) {
      console.warn('[ManeLine routine] Could not save routine:', error);
      Alert.alert('Could not save routine', 'Please try again.');
    }
  }

  function updateStepType(id: string, stepType: RoutineStepType) {
    setRoutineSteps((current) =>
      current.map((step) => (step.id === id ? { ...step, stepType } : step))
    );
    setStepMenuId(null);
    setHasChanges(true);
  }

  function updateProductName(id: string, productName: string) {
    setRoutineSteps((current) =>
      current.map((step) => (step.id === id ? { ...step, productName } : step))
    );
    setHasChanges(true);
  }

  function addStep() {
    const newStep: RoutineStep = {
      id: `step-${Date.now()}`,
      order: routineSteps.length + 1,
      stepType: 'Other',
      productName: '',
    };

    setRoutineSteps((current) => [...current, newStep]);
    setHasChanges(true);
  }

  function removeStep(id: string) {
    if (routineSteps.length === 1) {
      Alert.alert('Keep one step', 'Your routine needs at least one step.');
      return;
    }

    Alert.alert(
      'Remove this step?',
      'This step will be removed from your Wash Day Routine.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setRoutineSteps((current) =>
              reorderSteps(current.filter((step) => step.id !== id))
            );
            setHasChanges(true);
          },
        },
      ]
    );
  }

  function moveStepUp(index: number) {
    if (index === 0) return;

    setRoutineSteps((current) => {
      const next = [...current];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return reorderSteps(next);
    });
    setHasChanges(true);
  }

  function moveStepDown(index: number) {
    if (index === routineSteps.length - 1) return;

    setRoutineSteps((current) => {
      const next = [...current];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return reorderSteps(next);
    });
    setHasChanges(true);
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + PAGE_TOP_PADDING,
            paddingBottom: TAB_BOTTOM_PADDING + 40,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ROUTINE</Text>
          <Text style={styles.title}>Your hair, on schedule.</Text>
          <Text style={styles.subtitle}>
            Track wash days, hairstyles, and personalized reminders in one place.
          </Text>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Pressable style={styles.calendarArrow} onPress={previousMonth}>
              <Ionicons name="chevron-back" size={20} color={COLORS.oxfordBlue} />
            </Pressable>

            <View style={styles.monthTitleWrap}>
              <Text style={styles.monthTitle}>
                {visibleMonth.toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <Pressable onPress={goToToday}>
                <Text style={styles.todayLink}>Today</Text>
              </Pressable>
            </View>

            <Pressable style={styles.calendarArrow} onPress={nextMonth}>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.oxfordBlue}
              />
            </Pressable>
          </View>

          <View style={styles.weekDaysRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <View key={`${day}-${index}`} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarCells.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.calendarDay} />;
              }

              const dateKey = toDateKey(date);
              const isSelected = dateKey === selectedDateKey;
              const isToday = dateKey === toDateKey(today);
              const hasActivity = Boolean(activity[dateKey]);
              const reminders = getRemindersForDate(date);
              const hasStyleReminder = reminders.some(
                (item) => item.type === 'style'
              );
              const hasCareReminder = reminders.some(
                (item) => item.type !== 'style'
              );

              return (
                <Pressable
                  key={dateKey}
                  style={styles.calendarDay}
                  onPress={() => setSelectedDate(date)}
                >
                  <View
                    style={[
                      styles.dateCircle,
                      isSelected && styles.dateCircleSelected,
                      isToday && !isSelected && styles.dateCircleToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateText,
                        isSelected && styles.dateTextSelected,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>

                  <View style={styles.dotSpace}>
                    {hasActivity ? <View style={styles.activityDot} /> : null}
                    {hasStyleReminder ? <View style={styles.styleDot} /> : null}
                    {hasCareReminder ? <View style={styles.reminderDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.calendarLegend}>
            <LegendItem color={COLORS.green} text="Wash day" />
            <LegendItem color={COLORS.oxfordBlue} text="Hairstyle" />
            <LegendItem color={COLORS.lightBlue} text="Reminder" />
          </View>
        </View>

        <View style={styles.hairActivityCard}>
          <View style={styles.hairActivityHeader}>
            <View style={styles.hairActivityHeaderIcon}>
              <Ionicons
                name="calendar-outline"
                size={21}
                color={COLORS.oxfordBlue}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.hairActivityEyebrow}>HAIR ACTIVITY</Text>
              <Text style={styles.hairActivityDate}>
                {selectedDate.toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.currentHairstyleSection}>
            <View style={styles.currentHairstyleTop}>
              <View style={styles.currentHairstyleIcon}>
                <Ionicons
                  name="cut-outline"
                  size={19}
                  color={COLORS.oxfordBlue}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.currentHairstyleLabel}>CURRENT HAIRSTYLE</Text>
                <Text style={styles.currentHairstyleName}>
                  {profile.hairstyleEnabled && profile.hairstyle
                    ? profile.hairstyle
                    : 'No active hairstyle'}
                </Text>

                {profile.hairstyleEnabled && profile.styleInstallDate ? (
                  <Text style={styles.currentHairstyleDates}>
                    Installed {profile.styleInstallDate}
                    {profile.styleRemovalDate
                      ? ` • Planned removal ${profile.styleRemovalDate}`
                      : ''}
                  </Text>
                ) : null}
              </View>

              {profile.hairstyleEnabled ? (
                <Pressable
                  style={styles.hairstyleTrashButton}
                  onPress={markHairstyleRemoved}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Remove current hairstyle"
                >
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={COLORS.danger}
                  />
                </Pressable>
              ) : null}
            </View>

            {profile.hairstyleEnabled ? (
              <View style={styles.currentHairstyleActions}>
                <Pressable
                  style={styles.editCurrentHairstyleButton}
                  onPress={openEditHairstyle}
                >
                  <Ionicons
                    name="create-outline"
                    size={15}
                    color={COLORS.oxfordBlue}
                  />
                  <Text style={styles.editCurrentHairstyleText}>Edit</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.addCurrentHairstyleButton}
                onPress={openAddHairstyle}
              >
                <Ionicons name="add" size={16} color={COLORS.oxfordBlue} />
                <Text style={styles.addCurrentHairstyleText}>Add hairstyle</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.activityDivider} />

          <View style={styles.selectedActivityHeader}>
            <Text style={styles.selectedActivityTitle}>Activity for this day</Text>
          </View>

          <View style={styles.hairActivityActions}>
            <Pressable
              style={styles.hairActivityActionButton}
              onPress={toggleRoutineActivity}
            >
              <Ionicons name="water-outline" size={16} color={COLORS.green} />
              <Text style={styles.hairActivityActionText}>
                {selectedDateHasActivity ? 'Remove wash day' : 'Log wash day'}
              </Text>
            </Pressable>

            {!profile.hairstyleEnabled ? (
              <Pressable
                style={styles.hairActivityActionButton}
                onPress={openAddHairstyle}
              >
                <Ionicons name="cut-outline" size={16} color={COLORS.green} />
                <Text style={styles.hairActivityActionText}>Add hairstyle</Text>
              </Pressable>
            ) : null}
          </View>

          {selectedDateHairActivities.length > 0 ? (
            <View style={styles.hairActivityList}>
              {selectedDateHairActivities.map((item) => (
                <View key={item.id} style={styles.hairActivityRow}>
                  <View
                    style={[
                      styles.hairActivityIcon,
                      item.type === 'wash' && styles.hairActivityIconWash,
                      item.type === 'style' && styles.hairActivityIconStyle,
                      item.type === 'reminder' && styles.hairActivityIconReminder,
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={COLORS.oxfordBlue}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.hairActivityTitle}>{item.title}</Text>
                    {item.description ? (
                      <Text style={styles.hairActivityDescription}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noHairActivity}>
              <Text style={styles.noHairActivityText}>
                No activity scheduled or logged for this day.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.routineSectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionEyebrow}>MY ROUTINE</Text>
            <Text style={styles.sectionTitle}>Wash Day Routine</Text>
            <Text style={styles.sectionSubtitle}>
              Build your routine in the exact order you use each product.
            </Text>
          </View>

          <View style={styles.stepCountBadge}>
            <Text style={styles.stepCountText}>{routineSteps.length} steps</Text>
          </View>
        </View>

        <View style={styles.stepsWrap}>
          {routineSteps.map((step, index) => (
            <View key={step.id}>
              <RoutineStepCard
                step={step}
                index={index}
                totalSteps={routineSteps.length}
                onOpenStepType={() => setStepMenuId(step.id)}
                onProductChange={(text) => updateProductName(step.id, text)}
                onDelete={() => removeStep(step.id)}
                onMoveUp={() => moveStepUp(index)}
                onMoveDown={() => moveStepDown(index)}
              />

              {index < routineSteps.length - 1 ? (
                <View style={styles.stepConnector}>
                  <Ionicons name="arrow-down" size={15} color={COLORS.green} />
                </View>
              ) : null}
            </View>
          ))}
        </View>

        <Pressable style={styles.addStepButton} onPress={addStep}>
          <View style={styles.addStepIcon}>
            <Ionicons name="add" size={21} color={COLORS.oxfordBlue} />
          </View>
          <Text style={styles.addStepText}>Add another step</Text>
        </Pressable>

        <Pressable
          style={[
            styles.saveButton,
            !hasChanges && styles.saveButtonInactive,
          ]}
          onPress={saveRoutine}
        >
          <Text style={styles.saveButtonText}>
            {hasChanges ? 'Save routine' : 'Routine saved'}
          </Text>
          <Ionicons
            name={hasChanges ? 'checkmark-circle-outline' : 'checkmark-circle'}
            size={19}
            color={COLORS.white}
          />
        </Pressable>
      </ScrollView>

      <Modal
        visible={Boolean(stepMenuId)}
        transparent
        animationType="fade"
        onRequestClose={() => setStepMenuId(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setStepMenuId(null)}>
          <Pressable
            style={styles.dropdownCard}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.dropdownHandle} />

            <View style={styles.dropdownHeader}>
              <View>
                <Text style={styles.dropdownTitle}>Choose step type</Text>
                <Text style={styles.dropdownSubtitle}>
                  What part of your routine is this?
                </Text>
              </View>

              <Pressable onPress={() => setStepMenuId(null)}>
                <Ionicons name="close" size={24} color={COLORS.oxfordBlue} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {stepTypes.map((stepType) => {
                const currentStep = routineSteps.find(
                  (step) => step.id === stepMenuId
                );
                const isSelected = currentStep?.stepType === stepType;

                return (
                  <Pressable
                    key={stepType}
                    style={[
                      styles.dropdownOption,
                      isSelected && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      if (stepMenuId) updateStepType(stepMenuId, stepType);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        isSelected && styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {stepType}
                    </Text>

                    {isSelected ? (
                      <Ionicons name="checkmark" size={19} color={COLORS.green} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={hairstyleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHairstyleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.hairstyleModalCard}>
            <View style={styles.dropdownHandle} />

            <View style={styles.dropdownHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dropdownTitle}>
                  {profile.hairstyleEnabled ? 'Edit hairstyle' : 'Add hairstyle'}
                </Text>
                <Text style={styles.dropdownSubtitle}>
                  Your hairstyle will sync with your Profile and Routine calendar.
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  setHairstyleModalVisible(false);
                  setHairstylePickerOpen(false);
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.oxfordBlue} />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Hairstyle</Text>

            <Pressable
              style={styles.hairstyleDropdown}
              onPress={() => setHairstylePickerOpen((current) => !current)}
            >
              <Text style={styles.hairstyleDropdownText}>
                {hairstyleDraft || 'Choose hairstyle'}
              </Text>
              <Ionicons
                name={hairstylePickerOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={COLORS.oxfordBlue}
              />
            </Pressable>

            {hairstylePickerOpen ? (
              <View style={styles.hairstyleDropdownMenu}>
                {hairstyleOptions.map((option) => {
                  const selected = hairstyleDraft === option;

                  return (
                    <Pressable
                      key={option}
                      style={[
                        styles.hairstyleDropdownOption,
                        selected && styles.hairstyleDropdownOptionActive,
                      ]}
                      onPress={() => {
                        setHairstyleDraft(option);
                        setHairstylePickerOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.hairstyleDropdownOptionText,
                          selected && styles.hairstyleDropdownOptionTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                      {selected ? (
                        <Ionicons name="checkmark" size={18} color={COLORS.green} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <Text style={styles.modalFieldLabel}>Install date</Text>
            <TextInput
              value={installDateDraft}
              onChangeText={setInstallDateDraft}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              style={styles.calendarInput}
            />

            <Text style={styles.modalFieldLabel}>Planned removal date</Text>
            <TextInput
              value={removalDateDraft}
              onChangeText={setRemovalDateDraft}
              placeholder="Optional • YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              style={styles.calendarInput}
            />

            <Text style={styles.fieldHelpText}>
              Planned removal does not turn the hairstyle off automatically. Use
              “Mark removed” when you actually take the style down.
            </Text>

            <Pressable
              style={styles.saveHairstyleButton}
              onPress={saveHairstyleToCalendar}
            >
              <Text style={styles.saveHairstyleButtonText}>
                {profile.hairstyleEnabled ? 'Update hairstyle' : 'Add to calendar'}
              </Text>
              <Ionicons name="calendar-outline" size={18} color={COLORS.white} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function LegendItem({ color, text }: { color: string; text: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{text}</Text>
    </View>
  );
}

function RoutineStepCard({
  step,
  index,
  totalSteps,
  onOpenStepType,
  onProductChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  step: RoutineStep;
  index: number;
  totalSteps: number;
  onOpenStepType: () => void;
  onProductChange: (text: string) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <View style={styles.stepCard}>
      <View style={styles.stepHeader}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>{index + 1}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.stepHeaderLabel}>STEP {index + 1}</Text>
          <Text style={styles.stepHeaderTitle}>{step.stepType}</Text>
        </View>

        <View style={styles.stepActions}>
          <Pressable
            style={[
              styles.smallIconButton,
              index === 0 && styles.smallIconButtonDisabled,
            ]}
            disabled={index === 0}
            onPress={onMoveUp}
          >
            <Ionicons name="chevron-up" size={17} color={COLORS.oxfordBlue} />
          </Pressable>

          <Pressable
            style={[
              styles.smallIconButton,
              index === totalSteps - 1 && styles.smallIconButtonDisabled,
            ]}
            disabled={index === totalSteps - 1}
            onPress={onMoveDown}
          >
            <Ionicons name="chevron-down" size={17} color={COLORS.oxfordBlue} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.fieldLabel}>Step type</Text>
      <Pressable style={styles.stepDropdownButton} onPress={onOpenStepType}>
        <Text style={styles.stepDropdownText}>{step.stepType}</Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.oxfordBlue} />
      </Pressable>

      <Text style={styles.fieldLabel}>Product</Text>
      <View style={styles.productInputWrap}>
        <Ionicons name="bag-outline" size={18} color={COLORS.green} />
        <TextInput
          value={step.productName}
          onChangeText={onProductChange}
          placeholder="Enter the product you use"
          placeholderTextColor="#9CA3AF"
          style={styles.productInput}
        />
      </View>

      <Pressable style={styles.removeStepButton} onPress={onDelete}>
        <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
        <Text style={styles.removeStepText}>Remove step</Text>
      </Pressable>
    </View>
  );
}

function buildProfileReminders(profile: RoutineProfile): RoutineReminder[] {
  const reminders: RoutineReminder[] = [];
  const installDate = parseDateKey(profile.styleInstallDate);
  const removalDate = parseDateKey(profile.styleRemovalDate);

  if (profile.hairstyle && installDate) {
    reminders.push({
      id: `style-install-${toDateKey(installDate)}`,
      dateKey: toDateKey(installDate),
      title: `${profile.hairstyle} installed`,
      description: 'Hairstyle start date.',
      icon: 'cut-outline',
      type: 'style',
    });
  }

  if (profile.hairstyle && removalDate) {
    reminders.push({
      id: `style-removal-${toDateKey(removalDate)}`,
      dateKey: toDateKey(removalDate),
      title: profile.hairstyleEnabled
        ? 'Planned style removal'
        : `${profile.hairstyle} removed`,
      description: profile.hairstyleEnabled
        ? `Planned removal date for ${profile.hairstyle.toLowerCase()}.`
        : `${profile.hairstyle} was marked as removed.`,
      icon: 'calendar-outline',
      type: 'style',
    });
  }

  const protectiveStyle = ['Braids', 'Locs', 'Sew-in / Wig'].includes(
    profile.hairstyle
  );

  if (profile.hairstyleEnabled && protectiveStyle) {
    if (installDate) {
      const endDate = removalDate ?? addDays(installDate, 56);
      let reminderDate = addDays(installDate, 5);
      let count = 0;

      while (reminderDate <= endDate && count < 12) {
        const key = toDateKey(reminderDate);
        reminders.push({
          id: `style-scalp-refresh-${key}`,
          dateKey: key,
          title: 'Scalp refresh check',
          description: `Check your scalp while wearing ${profile.hairstyle.toLowerCase()}.`,
          icon: 'leaf-outline',
          type: 'scalp',
        });
        reminderDate = addDays(reminderDate, 5);
        count += 1;
      }
    }
  }

  if (profile.headCoveringEnabled && profile.headCovering) {
    reminders.push({
      id: 'head-covering-check',
      dayIndex: 5,
      title: 'Scalp + buildup check',
      description: `Check how your scalp and hair feel during regular ${profile.headCovering.toLowerCase()} wear before adding more product.`,
      icon: 'eye-outline',
      type: 'covering',
    });
  }

  if (profile.scalpConditionEnabled && profile.scalpCondition) {
    reminders.push({
      id: 'scalp-condition-check',
      dayIndex: 1,
      title: 'Scalp check-in',
      description: `Note any changes related to ${profile.scalpCondition}.`,
      icon: 'medical-outline',
      type: 'scalp',
    });
  }

  return reminders;
}

function reorderSteps(steps: RoutineStep[]) {
  return steps.map((step, index) => ({ ...step, order: index + 1 }));
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(value?: string | null): Date | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: PAGE_HORIZONTAL_PADDING },
  header: { marginBottom: 20 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, color: COLORS.green },
  title: { marginTop: 5, fontSize: 31, lineHeight: 35, fontWeight: '900', color: COLORS.oxfordBlue },
  subtitle: { marginTop: 7, fontSize: 14, lineHeight: 20, color: COLORS.mutedText },

  calendarCard: { backgroundColor: COLORS.white, borderRadius: 26, padding: 17, borderWidth: 1, borderColor: COLORS.lightBorder },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  calendarArrow: { width: 39, height: 39, borderRadius: 13, backgroundColor: COLORS.lemonCream, alignItems: 'center', justifyContent: 'center' },
  monthTitleWrap: { alignItems: 'center' },
  monthTitle: { fontSize: 17, fontWeight: '900', color: COLORS.oxfordBlue },
  todayLink: { marginTop: 2, fontSize: 10, fontWeight: '900', color: COLORS.green },
  weekDaysRow: { flexDirection: 'row', marginBottom: 5 },
  weekDayCell: { width: `${100 / 7}%`, alignItems: 'center' },
  weekDayText: { fontSize: 10, fontWeight: '900', color: COLORS.mutedText },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { width: `${100 / 7}%`, height: 51, alignItems: 'center', justifyContent: 'flex-start' },
  dateCircle: { width: 33, height: 33, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dateCircleSelected: { backgroundColor: COLORS.oxfordBlue },
  dateCircleToday: { borderWidth: 1.5, borderColor: COLORS.lightBlue },
  dateText: { fontSize: 12, fontWeight: '800', color: COLORS.brown },
  dateTextSelected: { color: COLORS.white },
  dotSpace: { height: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  activityDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.green },
  styleDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.oxfordBlue },
  reminderDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.lightBlue },
  calendarLegend: { marginTop: 8, flexDirection: 'row', justifyContent: 'center', gap: 13 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 9, color: COLORS.mutedText },

  hairActivityCard: { marginTop: 11, padding: 15, borderRadius: 22, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.lightBorder },
  hairActivityHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  hairActivityHeaderIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.lemonCream, alignItems: 'center', justifyContent: 'center' },
  hairActivityEyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8, color: COLORS.green },
  hairActivityDate: { marginTop: 2, fontSize: 14, fontWeight: '900', color: COLORS.oxfordBlue },
  currentHairstyleSection: { marginTop: 16, padding: 13, borderRadius: 17, backgroundColor: COLORS.lemonCream },
  currentHairstyleTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  currentHairstyleIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  currentHairstyleLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7, color: COLORS.green },
  currentHairstyleName: { marginTop: 2, fontSize: 15, fontWeight: '900', color: COLORS.oxfordBlue },
  currentHairstyleDates: { marginTop: 3, fontSize: 10, lineHeight: 14, color: COLORS.brown },
  currentHairstyleActions: { marginTop: 11, flexDirection: 'row', gap: 7 },
  editCurrentHairstyleButton: { flex: 1, minHeight: 38, borderRadius: 12, backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  editCurrentHairstyleText: { fontSize: 10, fontWeight: '900', color: COLORS.oxfordBlue },
  hairstyleTrashButton: { width: 30, height: 30, borderRadius: 10, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  addCurrentHairstyleButton: { marginTop: 11, minHeight: 40, borderRadius: 12, backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  addCurrentHairstyleText: { fontSize: 10, fontWeight: '900', color: COLORS.oxfordBlue },
  activityDivider: { height: 1, marginVertical: 15, backgroundColor: COLORS.lightBorder },
  selectedActivityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectedActivityTitle: { fontSize: 12, fontWeight: '900', color: COLORS.oxfordBlue },
  hairActivityList: { marginTop: 12, gap: 8 },
  hairActivityRow: { padding: 11, borderRadius: 15, backgroundColor: COLORS.background, flexDirection: 'row', alignItems: 'center', gap: 10 },
  hairActivityIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  hairActivityIconWash: { backgroundColor: '#E6F1DC' },
  hairActivityIconStyle: { backgroundColor: COLORS.lemonCream },
  hairActivityIconReminder: { backgroundColor: COLORS.lightBlue },
  hairActivityTitle: { fontSize: 12, fontWeight: '900', color: COLORS.oxfordBlue },
  hairActivityDescription: { marginTop: 2, fontSize: 10, lineHeight: 15, color: COLORS.mutedText },
  noHairActivity: { marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: COLORS.background, alignItems: 'center' },
  noHairActivityText: { fontSize: 11, textAlign: 'center', color: COLORS.mutedText },
  hairActivityActions: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  hairActivityActionButton: { paddingHorizontal: 11, minHeight: 37, borderRadius: 12, backgroundColor: COLORS.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderColor: COLORS.lightBorder },
  hairActivityActionText: { fontSize: 10, fontWeight: '900', color: COLORS.green },

  routineSectionHeader: { marginTop: 31, marginBottom: 15, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  sectionEyebrow: { marginBottom: 3, fontSize: 10, fontWeight: '900', letterSpacing: 1, color: COLORS.green },
  sectionTitle: { fontSize: 24, fontWeight: '900', color: COLORS.oxfordBlue },
  sectionSubtitle: { marginTop: 4, maxWidth: 270, fontSize: 12, lineHeight: 18, color: COLORS.mutedText },
  stepCountBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: COLORS.lightBlue },
  stepCountText: { fontSize: 10, fontWeight: '900', color: COLORS.oxfordBlue },
  stepsWrap: { gap: 0 },
  stepCard: { padding: 16, borderRadius: 24, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.lightBorder },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 16 },
  stepNumber: { width: 40, height: 40, borderRadius: 14, backgroundColor: COLORS.oxfordBlue, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 16, fontWeight: '900', color: COLORS.white },
  stepHeaderLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8, color: COLORS.green },
  stepHeaderTitle: { marginTop: 2, fontSize: 16, fontWeight: '900', color: COLORS.oxfordBlue },
  stepActions: { flexDirection: 'row', gap: 4 },
  smallIconButton: { width: 31, height: 31, borderRadius: 10, backgroundColor: COLORS.lemonCream, alignItems: 'center', justifyContent: 'center' },
  smallIconButtonDisabled: { opacity: 0.25 },
  fieldLabel: { marginTop: 3, marginBottom: 6, fontSize: 11, fontWeight: '900', color: COLORS.brown },
  stepDropdownButton: { minHeight: 48, paddingHorizontal: 13, borderRadius: 15, borderWidth: 1, borderColor: COLORS.lightBorder, backgroundColor: COLORS.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  stepDropdownText: { fontSize: 13, fontWeight: '800', color: COLORS.oxfordBlue },
  productInputWrap: { minHeight: 49, paddingHorizontal: 13, borderRadius: 15, borderWidth: 1, borderColor: COLORS.lightBorder, backgroundColor: COLORS.background, flexDirection: 'row', alignItems: 'center', gap: 9 },
  productInput: { flex: 1, paddingVertical: 12, fontSize: 13, color: COLORS.oxfordBlue },
  removeStepButton: { marginTop: 13, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5 },
  removeStepText: { fontSize: 10, fontWeight: '800', color: COLORS.danger },
  stepConnector: { height: 27, alignItems: 'center', justifyContent: 'center' },
  addStepButton: { marginTop: 13, minHeight: 58, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.lightBlue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  addStepIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: COLORS.lightBlue, alignItems: 'center', justifyContent: 'center' },
  addStepText: { fontSize: 13, fontWeight: '900', color: COLORS.oxfordBlue },
  saveButton: { marginTop: 19, minHeight: 53, borderRadius: 17, backgroundColor: COLORS.oxfordBlue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  saveButtonInactive: { backgroundColor: COLORS.green },
  saveButtonText: { fontSize: 13, fontWeight: '900', color: COLORS.white },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(32,49,75,0.45)', justifyContent: 'flex-end' },
  dropdownCard: { maxHeight: '70%', paddingHorizontal: 20, paddingBottom: 28, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: COLORS.background },
  hairstyleModalCard: { maxHeight: '82%', paddingHorizontal: 20, paddingBottom: 30, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: COLORS.background },
  dropdownHandle: { alignSelf: 'center', width: 43, height: 5, marginTop: 10, marginBottom: 17, borderRadius: 999, backgroundColor: '#D5D4CA' },
  dropdownHeader: { marginBottom: 17, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  dropdownTitle: { fontSize: 21, fontWeight: '900', color: COLORS.oxfordBlue },
  dropdownSubtitle: { marginTop: 3, maxWidth: 285, fontSize: 12, lineHeight: 17, color: COLORS.mutedText },
  dropdownOption: { minHeight: 50, paddingHorizontal: 13, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownOptionSelected: { backgroundColor: COLORS.lemonCream },
  dropdownOptionText: { fontSize: 13, fontWeight: '800', color: COLORS.brown },
  dropdownOptionTextSelected: { fontWeight: '900', color: COLORS.oxfordBlue },
  hairstyleDropdown: { minHeight: 49, paddingHorizontal: 13, borderRadius: 15, borderWidth: 1, borderColor: COLORS.lightBorder, backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hairstyleDropdownText: { fontSize: 13, fontWeight: '800', color: COLORS.oxfordBlue },
  hairstyleDropdownMenu: { marginTop: 6, padding: 5, borderRadius: 15, borderWidth: 1, borderColor: COLORS.lightBorder, backgroundColor: COLORS.white },
  hairstyleDropdownOption: { minHeight: 44, paddingHorizontal: 11, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hairstyleDropdownOptionActive: { backgroundColor: COLORS.lemonCream },
  hairstyleDropdownOptionText: { fontSize: 12, fontWeight: '800', color: COLORS.brown },
  hairstyleDropdownOptionTextActive: { fontWeight: '900', color: COLORS.oxfordBlue },
  modalFieldLabel: { marginTop: 17, marginBottom: 6, fontSize: 11, fontWeight: '900', color: COLORS.brown },
  calendarInput: { minHeight: 49, paddingHorizontal: 13, borderRadius: 15, borderWidth: 1, borderColor: COLORS.lightBorder, backgroundColor: COLORS.white, fontSize: 13, color: COLORS.oxfordBlue },
  fieldHelpText: { marginTop: 5, fontSize: 10, lineHeight: 15, color: COLORS.mutedText },
  saveHairstyleButton: { marginTop: 23, minHeight: 51, borderRadius: 16, backgroundColor: COLORS.oxfordBlue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  saveHairstyleButtonText: { fontSize: 13, fontWeight: '900', color: COLORS.white },
});