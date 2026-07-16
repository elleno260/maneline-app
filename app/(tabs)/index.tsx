import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import type { ComponentProps } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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

type RoutineTask = {
  id: string;
  dayIndex: number;
  title: string;
  description: string;
  icon: IconName;
};

const PROFILE_STORAGE_KEY = 'MANELINE_PROFILE_V1';
const CHECK_STORAGE_KEY = 'MANELINE_WEEKLY_ROUTINE_CHECKS_V1';

const fallbackProfile: HairProfile = {
  displayName: 'Ellen',
  email: 'ellen@example.com',
  hairType: '4C',
  porosity: 'Low',
  density: 'Fine',
  scalp: 'Dry',
  goals: ['Moisture', 'Length retention', 'Growth'],
  routineFocus:
    'Moisture-first routine with lightweight products and buildup control.',
  routineCompatibilityScore: 91,
  allergies: '',
  routineSteps: [
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
      frequency: 'Midweek',
      productType: 'Water-based mist or light moisturizer',
      note: 'Only refresh if your hair feels dry. Do not add product just to add product.',
    },
  ],
};

const dailyTips = [
  'Low porosity hair usually does better when moisture is layered lightly instead of packed on heavily.',
  'Your scalp is part of your routine too. A quick scalp check can tell you if your products are building up.',
  'If your hair feels dry right after moisturizing, you may need water-based hydration before creams or oils.',
  'Trim checks help you catch thinning ends before breakage spreads.',
  'A product that works for someone else can still be wrong for your routine.',
  'Deep conditioning works better when your hair is fully saturated and given enough time to absorb moisture.',
  'If your style flakes, it may be product layering — not necessarily the product itself.',
];

const weeklyTasks: RoutineTask[] = [
  {
    id: 'scalp-check',
    dayIndex: 1,
    title: 'Scalp check',
    description: 'Look for dryness, flakes, buildup, or irritation.',
    icon: 'leaf-outline',
  },
  {
    id: 'moisture-check',
    dayIndex: 2,
    title: 'Moisture check',
    description: 'See if your hair feels soft, coated, dry, or brittle.',
    icon: 'water-outline',
  },
  {
    id: 'wash-day',
    dayIndex: 3,
    title: 'Wash day',
    description: 'Cleanse, condition, and reset your product base.',
    icon: 'sparkles-outline',
  },
  {
    id: 'deep-condition',
    dayIndex: 4,
    title: 'Deep condition',
    description: 'Focus on softness, slip, and hydration retention.',
    icon: 'flower-outline',
  },
  {
    id: 'refresh',
    dayIndex: 5,
    title: 'Refresh routine',
    description: 'Lightly refresh only if your hair feels dry.',
    icon: 'water',
  },
  {
    id: 'trim-check',
    dayIndex: 6,
    title: 'Trim check',
    description: 'Check ends for knots, thinning, or rough texture.',
    icon: 'cut-outline',
  },
];

export default function HomeScreen() {
  const [profile, setProfile] = useState<HairProfile>(fallbackProfile);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [])
  );

  async function loadHomeData() {
    const savedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile) as Partial<HairProfile>;

        setProfile({
          ...fallbackProfile,
          ...parsed,
          routineSteps: parsed.routineSteps ?? fallbackProfile.routineSteps,
          routineCompatibilityScore:
            parsed.routineCompatibilityScore ??
            fallbackProfile.routineCompatibilityScore,
        });
      } catch {
        setProfile(fallbackProfile);
      }
    }

    const savedChecks = await AsyncStorage.getItem(CHECK_STORAGE_KEY);

    if (savedChecks) {
      try {
        setCheckedTasks(JSON.parse(savedChecks));
      } catch {
        setCheckedTasks({});
      }
    }
  }

  async function toggleTask(taskKey: string) {
    const next = {
      ...checkedTasks,
      [taskKey]: !checkedTasks[taskKey],
    };

    setCheckedTasks(next);
    await AsyncStorage.setItem(CHECK_STORAGE_KEY, JSON.stringify(next));
  }

  const today = useMemo(() => new Date(), []);

  const firstName = useMemo(() => {
    return profile.displayName?.split(' ')[0] || 'there';
  }, [profile.displayName]);

  const dailyTip = useMemo(() => {
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / 86400000);

    return dailyTips[dayOfYear % dailyTips.length];
  }, [today]);

  const weekDates = useMemo(() => {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [today]);

  const weekKey = useMemo(() => {
    return toDateKey(weekDates[0]);
  }, [weekDates]);

  const completedCount = useMemo(() => {
    return weeklyTasks.filter((task) => checkedTasks[`${weekKey}-${task.id}`])
      .length;
  }, [checkedTasks, weekKey]);

  const progressPercent = Math.round((completedCount / weeklyTasks.length) * 100);

  const todayTasks = weeklyTasks.filter((task) => task.dayIndex === today.getDay());
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
  ]}
>
        <View style={styles.hero}>
          <View style={styles.heroCircleOne} />
          <View style={styles.heroCircleTwo} />
          <View style={styles.heroCircleThree} />

          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroEyebrow}>Today’s ManeLine</Text>
              <Text style={styles.heroTitle}>Hey {firstName},</Text>
              <Text style={styles.heroValueStatement}> Scan products, understand ingredients, and build a routine that matches your hair. </Text>
            </View>

<Pressable
  style={styles.primaryScanCard}
  onPress={() => router.push('/(tabs)/scan' as never)}
>
  <View style={styles.primaryScanIcon}>
    <Ionicons name="scan-outline" size={28} color="#111827" />
  </View>

  <View style={{ flex: 1 }}>
    <Text style={styles.primaryScanTitle}>Scan a product</Text>
    <Text style={styles.primaryScanText}>
      Check ingredients, compatibility, and whether it fits your routine.
    </Text>
  </View>

  <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
</Pressable>
            <View style={styles.dateBadge}>
              <Text style={styles.dateDay}>
                {today.toLocaleDateString(undefined, { weekday: 'short' })}
              </Text>
              <Text style={styles.dateNumber}>{today.getDate()}</Text>
            </View>
          </View>

          <View style={styles.tipWrap}>
            <Text style={styles.tipLabel}>Daily hair tip</Text>
            <Text style={styles.tipText}>{dailyTip}</Text>
          </View>

          <View style={styles.heroBottomRow}>
            <View style={styles.heroMiniStat}>
              <Text style={styles.heroMiniValue}>{profile.hairType}</Text>
              <Text style={styles.heroMiniLabel}>Hair type</Text>
            </View>

            <View style={styles.heroMiniStat}>
              <Text style={styles.heroMiniValue}>{profile.porosity}</Text>
              <Text style={styles.heroMiniLabel}>Porosity</Text>
            </View>

            <View style={styles.heroMiniStat}>
              <Text style={styles.heroMiniValue}>
                {profile.routineCompatibilityScore}%
              </Text>
              <Text style={styles.heroMiniLabel}>Routine match</Text>
            </View>
          </View>
        </View>

        <View style={styles.forecastCard}>
          <View style={styles.forecastIcon}>
            <Ionicons name="partly-sunny-outline" size={27} color="#111827" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.forecastLabel}>Hair forecast</Text>
            <Text style={styles.forecastTitle}>Moisture risk: medium-high</Text>
            <Text style={styles.forecastText}>
              Because your profile is {profile.porosity.toLowerCase()} porosity
              with a {profile.scalp.toLowerCase()} scalp, prioritize lightweight
              hydration and avoid over-layering heavy products.
            </Text>
          </View>
        </View>

        <View style={styles.compatibilityCard}>
          <View>
            <Text style={styles.compatibilityLabel}>Routine compatibility</Text>
            <Text style={styles.compatibilityScore}>
              {profile.routineCompatibilityScore}%
            </Text>
          </View>

          <View style={styles.compatibilityRight}>
            <Text style={styles.compatibilityText}>
              Your current routine is strongly aligned with your goals:
              {` ${profile.goals.slice(0, 2).join(' + ')}`}.
            </Text>

            <Pressable onPress={() => router.push('/(tabs)/profile' as never)}>
              <Text style={styles.editRoutineLink}>Edit routine</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionKicker}>Your routine</Text>
          <Text style={styles.sectionTitle}>Full routine</Text>
          <Text style={styles.sectionSubtitle}>
            This is the routine saved from your profile. Product matches should
            be based on this, not random recommendations.
          </Text>
        </View>

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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionKicker}>This week</Text>
          <Text style={styles.sectionTitle}>Routine calendar</Text>
          <Text style={styles.sectionSubtitle}>
            Tap each task when complete to track your weekly consistency.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekRow}
        >
          {weekDates.map((date) => {
            const dayIndex = date.getDay();
            const tasksForDay = weeklyTasks.filter(
              (task) => task.dayIndex === dayIndex
            );
            const isToday = toDateKey(date) === toDateKey(today);

            return (
              <View
                key={toDateKey(date)}
                style={[styles.dayCard, isToday && styles.dayCardToday]}
              >
                <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                  {date.toLocaleDateString(undefined, { weekday: 'short' })}
                </Text>

                <Text
                  style={[styles.dayNumber, isToday && styles.dayNumberToday]}
                >
                  {date.getDate()}
                </Text>

                <View style={styles.dayTaskWrap}>
                  {tasksForDay.length === 0 ? (
                    <Text
                      style={[
                        styles.noTaskText,
                        isToday && styles.noTaskTextToday,
                      ]}
                    >
                      Rest
                    </Text>
                  ) : (
                    tasksForDay.map((task) => {
                      const taskKey = `${weekKey}-${task.id}`;
                      const isChecked = !!checkedTasks[taskKey];

                      return (
                        <Pressable
                          key={task.id}
                          onPress={() => toggleTask(taskKey)}
                          style={[
                            styles.dayTaskDot,
                            isChecked && styles.dayTaskDotDone,
                          ]}
                        >
                          <Ionicons
                            name={isChecked ? 'checkmark' : task.icon}
                            size={14}
                            color={isChecked ? '#FFFFFF' : '#111827'}
                          />
                        </Pressable>
                      );
                    })
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <View>
              <Text style={styles.progressTitle}>Weekly consistency</Text>
              <Text style={styles.progressSubtitle}>
                {completedCount} of {weeklyTasks.length} routine moments done
              </Text>
            </View>

            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionKicker}>Today</Text>
          <Text style={styles.sectionTitle}>What needs attention?</Text>
        </View>

        {todayTasks.length === 0 ? (
          <View style={styles.noTodayTaskCard}>
            <Ionicons name="moon-outline" size={24} color="#111827" />

            <View style={{ flex: 1 }}>
              <Text style={styles.noTodayTitle}>No major routine task today</Text>
              <Text style={styles.noTodayText}>
                Keep your hair protected, avoid over-touching, and check how your
                products are wearing.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.taskList}>
            {todayTasks.map((task) => {
              const taskKey = `${weekKey}-${task.id}`;
              const isChecked = !!checkedTasks[taskKey];

              return (
                <RoutineTaskCard
                  key={task.id}
                  task={task}
                  isChecked={isChecked}
                  onPress={() => toggleTask(taskKey)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function RoutineTaskCard({
  task,
  isChecked,
  onPress,
}: {
  task: RoutineTask;
  isChecked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.taskCard, isChecked && styles.taskCardDone]}
      onPress={onPress}
    >
      <View style={styles.taskIcon}>
        <Ionicons
          name={isChecked ? 'checkmark' : task.icon}
          size={23}
          color="#111827"
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <Text style={styles.taskDescription}>{task.description}</Text>
      </View>

      <View style={[styles.checkCircle, isChecked && styles.checkCircleDone]}>
        {isChecked && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
      </View>
    </Pressable>
  );
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF7F0',
  },
  content: {
  paddingHorizontal: PAGE_HORIZONTAL_PADDING,
},
  hero: {
    minHeight: 370,
    backgroundColor: '#111827',
    borderRadius: 38,
    padding: 24,
    overflow: 'hidden',
    marginBottom: 18,
  },
  heroCircleOne: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#D97706',
    top: -48,
    right: -48,
    opacity: 0.95,
  },
  heroCircleTwo: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FBBF24',
    bottom: 54,
    left: -46,
    opacity: 0.35,
  },
  heroCircleThree: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    bottom: -22,
    right: 42,
    opacity: 0.12,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FBBF24',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    marginTop: 8,
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.2,
  },
  dateBadge: {
    width: 66,
    height: 78,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '900',
    color: '#D97706',
    textTransform: 'uppercase',
  },
  dateNumber: {
    marginTop: 2,
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
  },
  tipWrap: {
    marginTop: 42,
  },
  tipLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FBBF24',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  tipText: {
    marginTop: 12,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroBottomRow: {
    marginTop: 32,
    flexDirection: 'row',
    gap: 10,
  },
  heroMiniStat: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    padding: 12,
  },
  heroMiniValue: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroMiniLabel: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '800',
    color: '#D1D5DB',
  },
  forecastCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#F3D5C0',
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  forecastIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  forecastLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#D97706',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  forecastTitle: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  forecastText: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    color: '#4B5563',
  },
  compatibilityCard: {
    backgroundColor: '#D97706',
    borderRadius: 30,
    padding: 20,
    flexDirection: 'row',
    gap: 18,
    marginBottom: 26,
  },
  compatibilityLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFF7ED',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  compatibilityScore: {
    marginTop: 6,
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  compatibilityRight: {
    flex: 1,
    justifyContent: 'center',
  },
  compatibilityText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  editRoutineLink: {
    marginTop: 10,
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionKicker: {
    fontSize: 12,
    fontWeight: '900',
    color: '#D97706',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  routineList: {
    gap: 12,
    marginBottom: 26,
  },
  routineStepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F3D5C0',
    flexDirection: 'row',
    gap: 14,
  },
  stepNumber: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    fontSize: 18,
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
    marginTop: 7,
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
  },
  stepNote: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
  },
  weekRow: {
    gap: 10,
    paddingBottom: 18,
  },
  dayCard: {
    width: 82,
    height: 142,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3D5C0',
    padding: 12,
    alignItems: 'center',
  },
  dayCardToday: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '900',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  dayNameToday: {
    color: '#FBBF24',
  },
  dayNumber: {
    marginTop: 7,
    fontSize: 27,
    fontWeight: '900',
    color: '#111827',
  },
  dayNumberToday: {
    color: '#FFFFFF',
  },
  dayTaskWrap: {
    marginTop: 'auto',
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  noTaskText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  noTaskTextToday: {
    color: '#D1D5DB',
  },
  dayTaskDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTaskDotDone: {
    backgroundColor: '#D97706',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F3D5C0',
    marginBottom: 26,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  progressSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#6B7280',
  },
  progressPercent: {
    fontSize: 24,
    fontWeight: '900',
    color: '#D97706',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#D97706',
  },
  noTodayTaskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: '#F3D5C0',
    marginBottom: 26,
  },
  noTodayTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
  },
  noTodayText: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  taskList: {
    gap: 12,
    marginBottom: 26,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F3D5C0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  taskCardDone: {
    opacity: 0.82,
  },
  taskIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  taskDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleDone: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  heroValueStatement: {
  marginTop: 10,
  fontSize: 15,
  lineHeight: 22,
  color: '#E5E7EB',
  fontWeight: '700',
},
primaryScanCard: {
  backgroundColor: '#D97706',
  borderRadius: 30,
  padding: 18,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 14,
  marginBottom: 18,
},
primaryScanIcon: {
  width: 58,
  height: 58,
  borderRadius: 29,
  backgroundColor: '#FFFFFF',
  alignItems: 'center',
  justifyContent: 'center',
},
primaryScanTitle: {
  fontSize: 20,
  fontWeight: '900',
  color: '#FFFFFF',
},
primaryScanText: {
  marginTop: 4,
  fontSize: 13,
  lineHeight: 19,
  color: '#FFF7ED',
  fontWeight: '700',
},
});