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

type DiscoverProduct = {
  id: string;
  brand: string;
  name: string;
  category: string;
  match: number;
  icon: IconName;
  backgroundColor: string;
};

/**
 * ManeLine Brand Palette
 *
 * PRD:
 * Lemon Cream  #FFF9C7
 * Brown        #3D2920
 * Light Blue   #95BFFF
 * Oxford Blue  #20314B
 * Green        #667D41
 */
const COLORS = {
  lemonCream: '#FFF9C7',
  brown: '#3D2920',
  lightBlue: '#95BFFF',
  oxfordBlue: '#20314B',
  green: '#667D41',

  white: '#FFFFFF',
  background: '#FFFDF2',
  mutedText: '#6B7280',
  lightBorder: '#E9E3C8',
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
      note: 'Only refresh if your hair feels dry.',
    },
  ],
};

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

/**
 * Temporary discovery data for the homepage preview.
 *
 * Later, this should come from the same personalized recommendation
 * source used by the Search / Discover screen.
 */
const discoverProducts: DiscoverProduct[] = [
  {
    id: '1',
    brand: 'ManeLine Pick',
    name: 'Hydrating Leave-In',
    category: 'Leave-In',
    match: 94,
    icon: 'water-outline',
    backgroundColor: COLORS.lightBlue,
  },
  {
    id: '2',
    brand: 'ManeLine Pick',
    name: 'Gentle Cleanser',
    category: 'Shampoo',
    match: 91,
    icon: 'sparkles-outline',
    backgroundColor: COLORS.lemonCream,
  },
  {
    id: '3',
    brand: 'ManeLine Pick',
    name: 'Scalp Serum',
    category: 'Scalp Care',
    match: 88,
    icon: 'leaf-outline',
    backgroundColor: '#E5EBD8',
  },
  {
    id: '4',
    brand: 'ManeLine Pick',
    name: 'Moisture Mask',
    category: 'Deep Conditioner',
    match: 86,
    icon: 'flower-outline',
    backgroundColor: '#E8F0FF',
  },
];

export default function HomeScreen() {
  const [profile, setProfile] = useState<HairProfile>(fallbackProfile);

  const [checkedTasks, setCheckedTasks] = useState<
    Record<string, boolean>
  >({});

  const insets = useSafeAreaInsets();

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
          routineSteps:
            parsed.routineSteps ?? fallbackProfile.routineSteps,
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

    await AsyncStorage.setItem(
      CHECK_STORAGE_KEY,
      JSON.stringify(next)
    );
  }

  const today = useMemo(() => new Date(), []);

  const firstName = useMemo(() => {
    return profile.displayName?.split(' ')[0] || 'there';
  }, [profile.displayName]);

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
    return weeklyTasks.filter(
      (task) => checkedTasks[`${weekKey}-${task.id}`]
    ).length;
  }, [checkedTasks, weekKey]);

  const progressPercent = Math.round(
    (completedCount / weeklyTasks.length) * 100
  );

  const todayTasks = weeklyTasks.filter(
    (task) => task.dayIndex === today.getDay()
  );

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
        {/* HEADER */}

        <View style={styles.topHeader}>
          <View>
            <Text style={styles.brandName}>ManeLine</Text>

            <Text style={styles.greeting}>
              Hi {firstName}
            </Text>
          </View>

          <View style={styles.profileBubble}>
            <Ionicons
              name="person-outline"
              size={20}
              color={COLORS.oxfordBlue}
            />
          </View>
        </View>

        {/* SMALLER LANDING / VALUE PROP */}

        <View style={styles.hero}>
          <View style={styles.heroAccentCircle} />

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              Know what works for your hair.
            </Text>

            <Text style={styles.heroText}>
              Understand ingredients and discover products
              matched to your unique hair profile.
            </Text>

            <View style={styles.profileChips}>
              <View style={styles.profileChip}>
                <Text style={styles.profileChipText}>
                  {profile.hairType}
                </Text>
              </View>

              <View style={styles.profileChip}>
                <Text style={styles.profileChipText}>
                  {profile.porosity} porosity
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* PRIMARY SCAN CTA */}

        <Pressable
          style={({ pressed }) => [
            styles.scanButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() =>
            router.push('/(tabs)/scan' as never)
          }
        >
          <View style={styles.scanIcon}>
            <Ionicons
              name="scan-outline"
              size={26}
              color={COLORS.oxfordBlue}
            />
          </View>

          <View style={styles.scanTextWrap}>
            <Text style={styles.scanTitle}>
              Scan a product
            </Text>

            <Text style={styles.scanSubtitle}>
              See ingredients, compatibility, and your match.
            </Text>
          </View>

          <Ionicons
            name="arrow-forward"
            size={22}
            color={COLORS.white}
          />
        </Pressable>

        {/* ROUTINE COMPATIBILITY */}

        <View style={styles.sectionSpacing}>
          <View style={styles.sectionHeadingRow}>
            <View>
              <Text style={styles.sectionKicker}>
                YOUR ROUTINE
              </Text>

              <Text style={styles.sectionTitle}>
                Routine compatibility
              </Text>
            </View>
          </View>

          <View style={styles.compatibilityCard}>
            <View style={styles.compatibilityTop}>
              <View>
                <Text style={styles.compatibilityStatus}>
                  Strong match
                </Text>

                <Text style={styles.compatibilityDescription}>
                  Your current routine aligns well with your
                  hair profile and goals.
                </Text>
              </View>

              <View style={styles.scoreCircle}>
                <Text style={styles.scoreText}>
                  {profile.routineCompatibilityScore}%
                </Text>
              </View>
            </View>

            <View style={styles.compatibilityTrack}>
              <View
                style={[
                  styles.compatibilityFill,
                  {
                    width: `${Math.min(
                      profile.routineCompatibilityScore,
                      100
                    )}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.goalRow}>
              {profile.goals.slice(0, 3).map((goal) => (
                <View
                  key={goal}
                  style={styles.goalChip}
                >
                  <Text style={styles.goalChipText}>
                    {goal}
                  </Text>
                </View>
              ))}
            </View>

            <Pressable
              style={styles.compatibilityLink}
              onPress={() =>
                router.push('/(tabs)/routine' as never)
              }
            >
              <Text style={styles.compatibilityLinkText}>
                View routine details
              </Text>

              <Ionicons
                name="chevron-forward"
                size={17}
                color={COLORS.oxfordBlue}
              />
            </Pressable>
          </View>
        </View>

        {/* DISCOVER PRODUCTS */}

        <View style={styles.sectionSpacing}>
          <View style={styles.sectionHeadingRow}>
            <View>
              <Text style={styles.sectionKicker}>
                FOR YOU
              </Text>

              <Text style={styles.sectionTitle}>
                Discover new products
              </Text>
            </View>

            <Pressable
              onPress={() =>
                router.push('/(tabs)/search' as never)
              }
            >
              <Text style={styles.seeAllText}>
                See all
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionSubtitle}>
            A preview of products selected for your hair profile.
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productRow}
          >
            {discoverProducts.map((product) => (
              <Pressable
                key={product.id}
                style={({ pressed }) => [
                  styles.productCard,
                  pressed && styles.productPressed,
                ]}
                onPress={() =>
                  router.push('/(tabs)/search' as never)
                }
              >
                <View
                  style={[
                    styles.productVisual,
                    {
                      backgroundColor:
                        product.backgroundColor,
                    },
                  ]}
                >
                  <Ionicons
                    name={product.icon}
                    size={36}
                    color={COLORS.oxfordBlue}
                  />

                  <View style={styles.matchBadge}>
                    <Text style={styles.matchBadgeText}>
                      {product.match}% match
                    </Text>
                  </View>
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.productBrand}>
                    {product.brand}
                  </Text>

                  <Text
                    style={styles.productName}
                    numberOfLines={2}
                  >
                    {product.name}
                  </Text>

                  <Text style={styles.productCategory}>
                    {product.category}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ROUTINE CALENDAR */}

        <View style={styles.sectionSpacing}>
          <View style={styles.sectionHeadingRow}>
            <View>
              <Text style={styles.sectionKicker}>
                THIS WEEK
              </Text>

              <Text style={styles.sectionTitle}>
                Routine calendar
              </Text>
            </View>
          </View>

          <Text style={styles.sectionSubtitle}>
            Keep track of your routine without needing the
            full routine on your homepage.
          </Text>

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

              const isToday =
                toDateKey(date) === toDateKey(today);

              return (
                <View
                  key={toDateKey(date)}
                  style={[
                    styles.dayCard,
                    isToday && styles.dayCardToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayName,
                      isToday && styles.dayNameToday,
                    ]}
                  >
                    {date.toLocaleDateString(undefined, {
                      weekday: 'short',
                    })}
                  </Text>

                  <Text
                    style={[
                      styles.dayNumber,
                      isToday && styles.dayNumberToday,
                    ]}
                  >
                    {date.getDate()}
                  </Text>

                  <View style={styles.dayTaskWrap}>
                    {tasksForDay.length === 0 ? (
                      <Text
                        style={[
                          styles.noTaskText,
                          isToday &&
                            styles.noTaskTextToday,
                        ]}
                      >
                        Rest
                      </Text>
                    ) : (
                      tasksForDay.map((task) => {
                        const taskKey = `${weekKey}-${task.id}`;

                        const isChecked =
                          !!checkedTasks[taskKey];

                        return (
                          <Pressable
                            key={task.id}
                            onPress={() =>
                              toggleTask(taskKey)
                            }
                            style={[
                              styles.dayTaskDot,
                              isChecked &&
                                styles.dayTaskDotDone,
                            ]}
                          >
                            <Ionicons
                              name={
                                isChecked
                                  ? 'checkmark'
                                  : task.icon
                              }
                              size={14}
                              color={
                                isChecked
                                  ? COLORS.white
                                  : COLORS.oxfordBlue
                              }
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

          {/* WEEKLY PROGRESS */}

          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <View>
                <Text style={styles.progressTitle}>
                  Weekly consistency
                </Text>

                <Text style={styles.progressSubtitle}>
                  {completedCount} of {weeklyTasks.length}{' '}
                  routine moments complete
                </Text>
              </View>

              <Text style={styles.progressPercent}>
                {progressPercent}%
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercent}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* TODAY'S ROUTINE TASK */}

        <View style={styles.sectionSpacing}>
          <View style={styles.sectionHeadingRow}>
            <View>
              <Text style={styles.sectionKicker}>
                TODAY
              </Text>

              <Text style={styles.sectionTitle}>
                Today’s routine
              </Text>
            </View>
          </View>

          {todayTasks.length === 0 ? (
            <View style={styles.noTodayTaskCard}>
              <View style={styles.taskIcon}>
                <Ionicons
                  name="moon-outline"
                  size={22}
                  color={COLORS.oxfordBlue}
                />
              </View>

              <View style={styles.taskContent}>
                <Text style={styles.noTodayTitle}>
                  Nothing scheduled today
                </Text>

                <Text style={styles.noTodayText}>
                  Give your hair a break and check how your
                  current products are wearing.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.taskList}>
              {todayTasks.map((task) => {
                const taskKey = `${weekKey}-${task.id}`;

                const isChecked =
                  !!checkedTasks[taskKey];

                return (
                  <RoutineTaskCard
                    key={task.id}
                    task={task}
                    isChecked={isChecked}
                    onPress={() =>
                      toggleTask(taskKey)
                    }
                  />
                );
              })}
            </View>
          )}
        </View>
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
      style={[
        styles.taskCard,
        isChecked && styles.taskCardDone,
      ]}
      onPress={onPress}
    >
      <View style={styles.taskIcon}>
        <Ionicons
          name={isChecked ? 'checkmark' : task.icon}
          size={22}
          color={COLORS.oxfordBlue}
        />
      </View>

      <View style={styles.taskContent}>
        <Text style={styles.taskTitle}>
          {task.title}
        </Text>

        <Text style={styles.taskDescription}>
          {task.description}
        </Text>
      </View>

      <View
        style={[
          styles.checkCircle,
          isChecked && styles.checkCircleDone,
        ]}
      >
        {isChecked && (
          <Ionicons
            name="checkmark"
            size={16}
            color={COLORS.white}
          />
        )}
      </View>
    </Pressable>
  );
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: PAGE_HORIZONTAL_PADDING,
  },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  brandName: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: COLORS.green,
  },

  greeting: {
    marginTop: 3,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    color: COLORS.oxfordBlue,
  },

  profileBubble: {
    width: 60,
    height: 60,
    borderRadius: 21,
    backgroundColor: COLORS.lemonCream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /**
   * Smaller hero.
   * The previous version had minHeight: 370.
   */
  hero: {
    minHeight: 160,
    borderRadius: 26,
    backgroundColor: COLORS.lemonCream,
    overflow: 'hidden',
    borderColor: COLORS.lightBorder,
    borderWidth: 1,
    padding: 22,
    justifyContent: 'center',
  },

  heroAccentCircle: {
    position: 'absolute',
    width: 135,
    height: 135,
    borderRadius: 68,
    backgroundColor: COLORS.lightBlue,
    right: -55,
    top: -48,
    opacity: 0.8,
  },

  heroContent: {
    maxWidth: '86%',
  },

  heroTitle: {
    fontSize: 27,
    lineHeight: 31,
    letterSpacing: -0.7,
    fontWeight: '900',
    color: COLORS.oxfordBlue,
  },

  heroText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: COLORS.brown,
  },

  profileChips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },

  profileChip: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  profileChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.oxfordBlue,
  },

  /**
   * Scan button now sits BELOW the hero.
   */
  scanButton: {
    marginTop: 12,
    minHeight: 78,
    borderRadius: 24,
    paddingHorizontal: 17,
    paddingVertical: 14,
    backgroundColor: COLORS.oxfordBlue,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },

  scanIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scanTextWrap: {
    flex: 1,
  },

  scanTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
  },

  scanSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: '#E7ECF4',
  },

  sectionSpacing: {
    marginTop: 30,
  },

  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
  },

  sectionKicker: {
    marginBottom: 4,
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.green,
    letterSpacing: 1,
  },

  sectionTitle: {
    fontSize: 25,
    fontWeight: '900',
    color: COLORS.oxfordBlue,
    letterSpacing: -0.5,
  },

  sectionSubtitle: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.mutedText,
  },

  /**
   * ROUTINE COMPATIBILITY
   */

  compatibilityCard: {
    marginTop: 14,
    backgroundColor: COLORS.white,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
    padding: 18,
  },

  compatibilityTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 18,
  },

  compatibilityStatus: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.green,
  },

  compatibilityDescription: {
    maxWidth: 220,
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.mutedText,
  },

  scoreCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E9EEDC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scoreText: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.green,
  },

  compatibilityTrack: {
    marginTop: 18,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#EEF0E9',
    overflow: 'hidden',
  },

  compatibilityFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.green,
  },

  goalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 14,
  },

  goalChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.lemonCream,
  },

  goalChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.brown,
  },

  compatibilityLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    alignSelf: 'flex-start',
  },

  compatibilityLinkText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.oxfordBlue,
  },

  /**
   * DISCOVER
   */

  seeAllText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.green,
  },

  productRow: {
    gap: 12,
    paddingTop: 14,
    paddingRight: 20,
  },

  productCard: {
    width: 165,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
    overflow: 'hidden',
  },

  productPressed: {
    opacity: 0.88,
  },

  productVisual: {
    height: 138,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  matchBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  matchBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.green,
  },

  productInfo: {
    padding: 13,
  },

  productBrand: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    color: COLORS.green,
  },

  productName: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
    color: COLORS.oxfordBlue,
  },

  productCategory: {
    marginTop: 5,
    fontSize: 11,
    color: COLORS.mutedText,
  },

  /**
   * CALENDAR
   */

  weekRow: {
    gap: 9,
    paddingTop: 15,
    paddingBottom: 16,
    paddingRight: 20,
  },

  dayCard: {
    width: 72,
    height: 122,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
    padding: 10,
    alignItems: 'center',
  },

  dayCardToday: {
    backgroundColor: COLORS.oxfordBlue,
    borderColor: COLORS.oxfordBlue,
  },

  dayName: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.mutedText,
    textTransform: 'uppercase',
  },

  dayNameToday: {
    color: COLORS.lightBlue,
  },

  dayNumber: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.oxfordBlue,
  },

  dayNumberToday: {
    color: COLORS.white,
  },

  dayTaskWrap: {
    marginTop: 'auto',
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  noTaskText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },

  noTaskTextToday: {
    color: '#CFD7E3',
  },

  dayTaskDot: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: COLORS.lemonCream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dayTaskDotDone: {
    backgroundColor: COLORS.green,
  },

  /**
   * WEEKLY PROGRESS
   */

  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: 23,
    padding: 17,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
  },

  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 11,
  },

  progressTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.oxfordBlue,
  },

  progressSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.mutedText,
  },

  progressPercent: {
    fontSize: 21,
    fontWeight: '900',
    color: COLORS.green,
  },

  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#EEF0E9',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.green,
  },

  /**
   * TODAY TASKS
   */

  noTodayTaskCard: {
    marginTop: 14,
    backgroundColor: COLORS.white,
    borderRadius: 23,
    padding: 17,
    flexDirection: 'row',
    gap: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
  },

  taskList: {
    marginTop: 14,
    gap: 11,
  },

  taskCard: {
    backgroundColor: COLORS.white,
    borderRadius: 23,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  taskCardDone: {
    opacity: 0.72,
  },

  taskIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: COLORS.lemonCream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  taskContent: {
    flex: 1,
  },

  taskTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.oxfordBlue,
  },

  taskDescription: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.mutedText,
  },

  noTodayTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.oxfordBlue,
  },

  noTodayText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.mutedText,
  },

  checkCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D4D9DE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkCircleDone: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
});