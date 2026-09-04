import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import type {
  ComponentProps,
  Dispatch,
  SetStateAction,
} from 'react';
import {isGuestUser,logoutUser} from '../../services/authService';
import {
  useCallback,
  useMemo,
  useState,
} from 'react';import {Alert,Modal, Pressable,ScrollView,StyleSheet,Switch,Text,TextInput,View,} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {PAGE_HORIZONTAL_PADDING, PAGE_TOP_PADDING,TAB_BOTTOM_PADDING,} from '../../constants/layout';
import { COLORS } from '../../constants/colors';

type IconName =
  ComponentProps<typeof Ionicons>['name'];


/* =========================================================
   TYPES
   ========================================================= */

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

  /*
   * Texture = thickness of an individual strand.
   * Fine / Medium / Coarse.
   */
  texture: string;

  /*
   * Density = overall amount of hair.
   * Thin / Medium / Thick.
   */
  density: string;

  scalp: string;

  chemicalHistory: string;

  /* -----------------------------------------
     OPTIONAL HAIRSTYLE
  ----------------------------------------- */

  hairstyleEnabled: boolean;
  hairstyle: string;

  styleInstallDate: string;
  styleRemovalDate: string;

  /* -----------------------------------------
     OPTIONAL SCALP CONDITION
  ----------------------------------------- */

  scalpConditionEnabled: boolean;
  scalpCondition: string;

  /* -----------------------------------------
     OPTIONAL HEAD COVERING
  ----------------------------------------- */

  headCoveringEnabled: boolean;
  headCovering: string;

  /* -----------------------------------------
     PERSONALIZATION
  ----------------------------------------- */

  goals: string[];


  routineSteps:
    RoutineStep[];

  routineCompatibilityScore:
    number;

  allergies: string;
};

/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE_KEY =
  'MANELINE_PROFILE_V1';

/* =========================================================
   OPTIONS
   ========================================================= */

const hairTypes = [
  '1A',
  '1B',
  '1C',

  '2A',
  '2B',
  '2C',

  '3A',
  '3B',
  '3C',

  '4A',
  '4B',
  '4C',
];

const porosityOptions = [
  'Low',
  'Medium',
  'High',
];

const textureOptions = [
  'Fine',
  'Medium',
  'Coarse',
];

const densityOptions = [
  'Thin',
  'Medium',
  'Coarse',
];

/*
 * General scalp behavior stays separate
 * from scalp medical conditions.
 */
const scalpOptions = [
  'Balanced',
  'Dry',
  'Oily',
  'Sensitive',
  'Flaky',
];

const chemicalHistoryOptions = [
  'Virgin hair',
  'Colored hair',
  'Relaxed / permed hair',
  'Heat damaged',
  'Transitioning',
];

/*
 * Toggle OFF represents "no active hairstyle."
 * Therefore "None" does not need to appear
 * inside the dropdown itself.
 */
const hairstyleOptions = [
  'Braids',
  'Locs',
  'Sew-in / Wig',
  'Twist-out',
];

/*
 * Kept separate from normal scalp behavior.
 */
const scalpConditionOptions = [
  'Dandruff',
  'Seborrheic dermatitis',
  'Psoriasis',
  'Eczema',
  'Scalp acne',
  'Thinning edges',
  'CCCA',
  'Other',
];

const headCoveringOptions = [
  'Hijab',
  'Durag',
  'Bonnet-only',
];

const goalOptions = [
  'Moisture',
  'Length retention',
  'Repair',
  'Scalp health',
  'Growth',
  'Definition',
  'Volume',
  'Frizz control',
  'Strengthening',
];

/* =========================================================
   ROUTINE DEFAULT
   ========================================================= */

const defaultRoutineSteps:
  RoutineStep[] = [
  {
    id: 'cleanse',
    title: 'Cleanse',
    frequency:
      'Every 7–10 days',
    productType:
      'Gentle shampoo or clarifying shampoo as needed',
    note:
      'Focus on removing buildup without stripping your hair.',
  },

  {
    id: 'deep-condition',
    title:
      'Deep condition',
    frequency: 'Weekly',
    productType:
      'Moisturizing deep conditioner',
    note:
      'Use heat or steam if your hair struggles to absorb moisture.',
  },

  {
    id: 'leave-in',
    title: 'Leave-in',
    frequency:
      'After every wash',
    productType:
      'Lightweight leave-in conditioner',
    note:
      'Apply in sections so the product distributes evenly.',
  },

  {
    id: 'seal-style',
    title: 'Seal + style',
    frequency:
      'After moisturizing',
    productType:
      'Light cream or gel depending on the style',
    note:
      'Avoid over-layering heavy products to reduce buildup.',
  },

  {
    id: 'refresh',
    title: 'Refresh',
    frequency:
      'Midweek or as needed',
    productType:
      'Water-based mist or light moisturizer',
    note:
      'Only refresh if your hair feels dry.',
  },
];

/* =========================================================
   DEFAULT PROFILE
   ========================================================= */

const defaultProfile:
  HairProfile = {
  displayName: 'Ellen',

  email:
    'ellen@example.com',

  hairType: '4C',

  porosity: 'Low',

  texture: 'Fine',

  density: 'Coarse',

  scalp: 'Dry',

  chemicalHistory:
    'Virgin hair',

  hairstyleEnabled:
    false,

  hairstyle: '',

  styleInstallDate: '',

  styleRemovalDate: '',

  scalpConditionEnabled:
    false,

  scalpCondition: '',

  headCoveringEnabled:
    false,

  headCovering: '',

  goals: [
    'Moisture',
    'Length retention',
    'Growth',
  ],
  routineCompatibilityScore:
    91,

  allergies: '',

  routineSteps:
    defaultRoutineSteps,
};

/* =========================================================
   PROFILE SCREEN
   ========================================================= */

export default function ProfileScreen() {
  const insets =
    useSafeAreaInsets();

  const [
    profile,
    setProfile,
  ] =
    useState<HairProfile>(
      defaultProfile
    );

  const [
    draft,
    setDraft,
  ] =
    useState<HairProfile>(
      defaultProfile
    );

  const [
    isEditing,
    setIsEditing,
  ] =
    useState(false);

  const [
    routineReminders,
    setRoutineReminders,
  ] =
    useState(true);

  const [
    ingredientAlerts,
    setIngredientAlerts,
  ] =
    useState(true);

  const [
    recommendationPersonalization,
    setRecommendationPersonalization,
  ] =
    useState(true);

  const [
    isGuest,
    setIsGuest,
  ] = useState<boolean | null>(
    null
  );

  const [
    isLoggingOut,
    setIsLoggingOut,
  ] = useState(false);
  /* =======================================================
     LOAD
     ======================================================= */
useFocusEffect(
  useCallback(() => {
    void loadProfile();
  }, [])
);

  async function loadProfile() {
    try {
      const raw =
        await AsyncStorage.getItem(
          STORAGE_KEY
        );
          const guest =
            await isGuestUser();

            setIsGuest(
               guest
                );

      if (!raw) {
        setProfile(
          defaultProfile
        );

        setDraft(
          defaultProfile
        );

        return;
      }

      /*
       * style was the old field name.
       * This lets profiles saved before this update
       * migrate without breaking.
       */
      const saved =
        JSON.parse(raw) as
          Partial<HairProfile> & {
            style?: string;
          };

      const legacyStyle =
        saved.style &&
        saved.style !== 'None'
          ? saved.style
          : '';

      const savedHeadCovering =
        saved.headCovering &&
        saved.headCovering !==
          'None'
          ? saved.headCovering
          : '';

      /*
       * Earlier versions mixed medical scalp
       * conditions into the general scalp field.
       * Migrate those values to scalpCondition.
       */
      const legacyScalpCondition =
        saved.scalp &&
        scalpConditionOptions.includes(
          saved.scalp
        )
          ? saved.scalp
          : '';

      const mergedProfile:
        HairProfile = {
        ...defaultProfile,
        ...saved,

        texture:
          saved.texture ??
          defaultProfile.texture,

        scalp:
          legacyScalpCondition
            ? defaultProfile.scalp
            : (
                saved.scalp ??
                defaultProfile.scalp
              ),

        hairstyleEnabled:
          saved.hairstyleEnabled ??
          Boolean(
            saved.hairstyle ||
              legacyStyle
          ),

        hairstyle:
          saved.hairstyle ??
          legacyStyle,

        scalpConditionEnabled:
          saved.scalpConditionEnabled ??
          Boolean(
            saved.scalpCondition ||
              legacyScalpCondition
          ),

        scalpCondition:
          saved.scalpCondition ??
          legacyScalpCondition,

        headCoveringEnabled:
          saved.headCoveringEnabled ??
          Boolean(
            savedHeadCovering
          ),

        headCovering:
          savedHeadCovering,

        styleInstallDate:
          saved.styleInstallDate ??
          '',

        styleRemovalDate:
          saved.styleRemovalDate ??
          '',

        goals:
          saved.goals ??
          defaultProfile.goals,

        routineSteps:
          saved.routineSteps ??
          defaultProfile
            .routineSteps,

        routineCompatibilityScore:
          saved
            .routineCompatibilityScore ??
          defaultProfile
            .routineCompatibilityScore,
      };

      setProfile(
        mergedProfile
      );

      setDraft(
        mergedProfile
      );
    } catch (error) {
      console.warn(
        '[ManeLine profile] Could not load profile:',
        error
      );

      setProfile(
        defaultProfile
      );

      setDraft(
        defaultProfile
      );
    }
  }

  /* =======================================================
     SAVE
     ======================================================= */

  async function saveProfile(
    nextProfile:
      HairProfile
  ) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          nextProfile
        )
      );

      setProfile(
        nextProfile
      );

      setDraft(
        nextProfile
      );
    } catch (error) {
      console.warn(
        '[ManeLine profile] Could not save profile:',
        error
      );

      Alert.alert(
        'Could not save profile',
        'Please try again.'
      );
    }
  }

  function openEditor() {
    setDraft(profile);

    setIsEditing(true);
  }

  async function handleSaveDraft() {
    await saveProfile(
      draft
    );

    setIsEditing(false);
  }

  /* =======================================================
     GOALS
     ======================================================= */

  function toggleGoal(
    goal: string
  ) {
    setDraft(
      (current) => {
        const selected =
          current.goals.includes(
            goal
          );

        return {
          ...current,

          goals: selected
            ? current.goals.filter(
                (item) =>
                  item !== goal
              )
            : [
                ...current.goals,
                goal,
              ],
        };
      }
    );
  }

  /* =======================================================
     RESET
     ======================================================= */

  function resetDemoProfile() {
    Alert.alert(
      'Reset profile?',
      'This will reset your ManeLine profile.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Reset',
          style:
            'destructive',

          onPress:
            async () => {
              await saveProfile(
                defaultProfile
              );
            },
        },
      ]
    );
  }

  /* =======================================================
     COMPATIBILITY STRENGTH
     ======================================================= */

  const compatibilityStrength =
    useMemo(() => {
      const requiredFields = [
        profile.hairType,
        profile.porosity,
        profile.texture,
        profile.density,
        profile.scalp,
        profile
          .chemicalHistory,
      ];

      let completed =
        requiredFields.filter(
          Boolean
        ).length;

      let total =
        requiredFields.length;

      /*
       * Goals are an important profile dimension.
       */
      total += 1;

      if (
        profile.goals.length >
        0
      ) {
        completed += 1;
      }

      /*
       * Optional dimensions only count toward
       * completion if the user turns them on.
       */

      if (
        profile.hairstyleEnabled
      ) {
        total += 1;

        if (
          profile.hairstyle
        ) {
          completed += 1;
        }
      }

      if (
        profile
          .scalpConditionEnabled
      ) {
        total += 1;

        if (
          profile.scalpCondition
        ) {
          completed += 1;
        }
      }

      if (
        profile
          .headCoveringEnabled
      ) {
        total += 1;

        if (
          profile.headCovering
        ) {
          completed += 1;
        }
      }

      return Math.round(
        (completed / total) *
          100
      );
    }, [profile]);

  /* =======================================================
     UI
     ======================================================= */

  return (
    <View
      style={styles.screen}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={[
          styles.content,
          {
            paddingTop:
              insets.top +
              PAGE_TOP_PADDING,

            paddingBottom:
              TAB_BOTTOM_PADDING,
          },
        ]}
      >
        {/* PROFILE HEADER */}

        <View
          style={
            styles.profileHeader
          }
        >
          <View
            style={
              styles.headerTop
            }
          >
            <Pressable
  style={styles.avatarAction}
  onPress={() =>
    router.push(
      '/editAvatar' as never
    )
  }
>
  <View
    style={
      styles.avatar
    }
  >
    <Text
      style={
        styles.avatarText
      }
    >
      {profile.displayName
        .slice(0, 1)
        .toUpperCase()}
    </Text>
  </View>

  <Text
    style={
      styles.avatarEditText
    }
  >
    Edit Avatar
  </Text>
</Pressable>

            <View
              style={
                styles.headerTextWrap
              }
            >
              <Text
                style={
                  styles.eyebrow
                }
              >
                YOUR PROFILE
              </Text>

              <Text
                style={styles.name}
              >
                {
                  profile.displayName
                }
              </Text>

              <Text
                style={styles.email}
              >
                {profile.email}
              </Text>
            </View>

            <Pressable
              style={
                styles.editButton
              }
              onPress={
                openEditor
              }
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={
                  COLORS.oxfordBlue
                }
              />
            </Pressable>
          </View>
          {/* PROFILE STRENGTH */}

          <View
            style={
              styles.strengthCard
            }
          >
            <View
              style={
                styles.strengthTop
              }
            >
              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.strengthLabel
                  }
                >
                  Compatibility
                  strength
                </Text>

                <Text
                  style={
                    styles.strengthSubLabel
                  }
                >
                  How much ManeLine
                  knows about your
                  hair
                </Text>
              </View>

              <Text
                style={
                  styles.strengthPercent
                }
              >
                {
                  compatibilityStrength
                }
                %
              </Text>
            </View>

            <View
              style={
                styles.progressTrack
              }
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width:
                      `${compatibilityStrength}%`,
                  },
                ]}
              />
            </View>

            <Text
              style={
                styles.strengthHint
              }
            >
              A detailed profile
              helps ManeLine make
              more relevant product,
              ingredient and routine
              recommendations.
            </Text>
          </View>
        </View>

        {/* HAIR PROFILE */}

        <SectionTitle
          kicker="YOUR HAIR"
          title="Hair profile"
          subtitle="These details shape your ingredient analysis and product recommendations."
        />

        <View
          style={
            styles.identityGrid
          }
        >
          <ProfileChip
            icon="flower-outline"
            label="Hair type"
            value={
              profile.hairType
            }
            info="Hair type describes your natural curl or wave pattern, ranging from straight (1A) to tightly coiled (4C)."
          />

          <ProfileChip
            icon="water-outline"
            label="Porosity"
            value={
              profile.porosity
            }
            info="Porosity describes how easily your hair absorbs and retains moisture."
          />

          <ProfileChip
            icon="sparkles-outline"
            label="Texture"
            value={
              profile.texture
            }
            info="Texture describes the thickness of each individual strand: fine, medium, or coarse."
          />

          <ProfileChip
            icon="layers-outline"
            label="Density"
            value={
              profile.density
            }
            info="Density describes how much hair you have on your scalp overall."
          />

          <ProfileChip
            icon="leaf-outline"
            label="Scalp"
            value={
              profile.scalp
            }
            info="Your general scalp profile describes characteristics such as dryness, oiliness, sensitivity, or flaking."
          />

          <ProfileChip
            icon="color-wand-outline"
            label="Hair history"
            value={
              profile
                .chemicalHistory
            }
            info="Hair history considers coloring, relaxing, heat damage, transitioning, or untreated hair."
          />

          {/* ONLY SHOW WHEN ENABLED */}

          {profile.hairstyleEnabled &&
          profile.hairstyle ? (
            <ProfileChip
              icon="cut-outline"
              label="Hairstyle"
              value={
                profile.hairstyle
              }
              info="Your current hairstyle helps ManeLine consider scalp access, buildup and how products fit your current routine."
            />
          ) : null}

          {profile
            .scalpConditionEnabled &&
          profile.scalpCondition ? (
            <ProfileChip
              icon="medical-outline"
              label="Scalp condition"
              value={
                profile
                  .scalpCondition
              }
              info="This optional information helps ManeLine provide more cautious product guidance. ManeLine does not diagnose or treat scalp conditions."
            />
          ) : null}

          {profile
            .headCoveringEnabled &&
          profile.headCovering ? (
            <ProfileChip
              icon="layers-outline"
              label="Head covering"
              value={
                profile
                  .headCovering
              }
              info="Regular head covering can affect how often your scalp is accessible and how products fit into your routine."
            />
          ) : null}
        </View>

        {/* GOALS */}

        <SectionTitle
          kicker="PERSONALIZATION"
          title="Hair goals"
          subtitle="ManeLine uses your goals when determining whether a product fits your needs."
        />

        <View
          style={styles.goalWrap}
        >
          {profile.goals.map(
            (goal) => (
              <View
                key={goal}
                style={
                  styles.goalChip
                }
              >
                <Ionicons
                  name="checkmark"
                  size={14}
                  color={
                    COLORS.oxfordBlue
                  }
                />

                <Text
                  style={
                    styles.goalText
                  }
                >
                  {goal}
                </Text>
              </View>
            )
          )}
        </View>

        {/* ROUTINE */}

        <SectionTitle
          kicker="YOUR ROUTINE"
          title="Routine"
          subtitle="Your routine helps ManeLine understand how products fit together."
        />

        {/* ROUTINE COMPATIBILITY */}

        <View
          style={
            styles.compatibilityCard
          }
        >
          <View
            style={
              styles.compatibilityScoreWrap
            }
          >
            <Text
              style={
                styles.compatibilityEyebrow
              }
            >
              ROUTINE
              COMPATIBILITY
            </Text>

            <Text
              style={
                styles.compatibilityScore
              }
            >
              {
                profile
                  .routineCompatibilityScore
              }
              %
            </Text>
          </View>

          <View
            style={
              styles.compatibilityCopy
            }
          >
            <Text
              style={
                styles.compatibilityTitle
              }
            >
              Strong match
            </Text>

            <Text
              style={
                styles.compatibilityText
              }
            >
              Your current
              routine is aligned
              with your saved
              profile and goals.
            </Text>
          </View>
        </View>

        {/* SETTINGS */}

        <SectionTitle
          kicker="PREFERENCES"
          title="ManeLine settings"
          subtitle="Choose how ManeLine supports your routine and product decisions."
        />

        <View
          style={
            styles.settingsCard
          }
        >
          <SettingRow
            icon="notifications-outline"
            title="Routine reminders"
            subtitle="Reminders for wash day and routine tasks."
            value={
              routineReminders
            }
            onValueChange={
              setRoutineReminders
            }
          />

          <View
            style={styles.divider}
          />

          <SettingRow
            icon="warning-outline"
            title="Ingredient alerts"
            subtitle="Highlight ingredients that may not fit your profile."
            value={
              ingredientAlerts
            }
            onValueChange={
              setIngredientAlerts
            }
          />

          <View
            style={styles.divider}
          />

          <SettingRow
            icon="sparkles-outline"
            title="Personalized recommendations"
            subtitle="Use your saved profile to improve recommendations."
            value={
              recommendationPersonalization
            }
            onValueChange={
              setRecommendationPersonalization
            }
          />
        </View>

        {/* SUPPORT */}

        <SectionTitle
          kicker="ACCOUNT"
          title="Support & account"
        />

        <View
          style={
            styles.navigationCard
          }
        >
          <NavigationRow
            icon="help-circle-outline"
            title="Help & FAQs"
            onPress={() =>
              Alert.alert(
                'Help & FAQs',
                'Help content will live here.'
              )
            }
          />

          <View
            style={styles.divider}
          />

          <NavigationRow
            icon="chatbubble-ellipses-outline"
            title="Contact us"
            onPress={() =>
              Alert.alert(
                'Contact ManeLine',
                'Contact options will live here.'
              )
            }
          />

          <View
            style={styles.divider}
          />

          <NavigationRow
            icon="shield-checkmark-outline"
            title="Privacy policy"
            onPress={() =>
              Alert.alert(
                'Privacy policy',
                'The ManeLine privacy policy will live here.'
              )
            }
          />
        </View>

        {/* RESET */}

        <Pressable
          style={
            styles.resetButton
          }
          onPress={
            resetDemoProfile
          }
        >
          <Ionicons
            name="refresh-outline"
            size={17}
            color={
              COLORS.danger
            }
          />

          <Text
            style={
              styles.resetText
            }
          >
            Reset profile
          </Text>
        </Pressable>
      </ScrollView>

      {/* EDIT MODAL */}

      <EditProfileModal
        visible={isEditing}
        draft={draft}
        setDraft={setDraft}
        onClose={() =>
          setIsEditing(false)
        }
        onSave={
          handleSaveDraft
        }
        toggleGoal={
          toggleGoal
        }
      />
    </View>
  );
}

/* =========================================================
   EDIT PROFILE MODAL
   ========================================================= */

function EditProfileModal({
  visible,
  draft,
  setDraft,
  onClose,
  onSave,
  toggleGoal,
}: {
  visible: boolean;

  draft: HairProfile;

  setDraft: Dispatch<
    SetStateAction<HairProfile>
  >;

  onClose: () => void;

  onSave: () => void;

  toggleGoal:
    (goal: string) => void;
}) {
  const protectiveStyle =
    draft.hairstyleEnabled &&
    [
      'Braids',
      'Locs',
      'Sew-in / Wig',
    ].includes(
      draft.hairstyle
    );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={
        onClose
      }
    >
      <View
        style={
          styles.modalOverlay
        }
      >
        <View
          style={
            styles.modalCard
          }
        >
          <View
            style={
              styles.modalHandle
            }
          />

          <View
            style={
              styles.modalHeader
            }
          >
            <View
              style={{ flex: 1 }}
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                Edit hair profile
              </Text>

              <Text
                style={
                  styles.modalSubtitle
                }
              >
                Update the details
                ManeLine uses to
                personalize product
                matches.
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={10}
            >
              <Ionicons
                name="close"
                size={25}
                color={
                  COLORS.oxfordBlue
                }
              />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
          >
            {/* NAME */}

            <Text
              style={
                styles.inputLabel
              }
            >
              Name
            </Text>

            <TextInput
              value={
                draft.displayName
              }
              onChangeText={(
                text
              ) =>
                setDraft(
                  (current) => ({
                    ...current,
                    displayName:
                      text,
                  })
                )
              }
              placeholder="Your name"
              style={styles.input}
            />

            {/* EMAIL */}

            <Text
              style={
                styles.inputLabel
              }
            >
              Email
            </Text>

            <TextInput
              value={draft.email}
              onChangeText={(
                text
              ) =>
                setDraft(
                  (current) => ({
                    ...current,
                    email: text,
                  })
                )
              }
              placeholder="Your email"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            {/* CORE PROFILE */}

            <OptionGroup
              label="Hair type"
              options={hairTypes}
              selected={
                draft.hairType
              }
              onSelect={(
                value
              ) =>
                setDraft(
                  (current) => ({
                    ...current,
                    hairType:
                      value,
                  })
                )
              }
            />

            <OptionGroup
              label="Porosity"
              options={
                porosityOptions
              }
              selected={
                draft.porosity
              }
              onSelect={(
                value
              ) =>
                setDraft(
                  (current) => ({
                    ...current,
                    porosity:
                      value,
                  })
                )
              }
            />

            <OptionGroup
              label="Hair texture"
              options={
                textureOptions
              }
              selected={
                draft.texture
              }
              onSelect={(
                value
              ) =>
                setDraft(
                  (current) => ({
                    ...current,
                    texture:
                      value,
                  })
                )
              }
            />

            <OptionGroup
              label="Hair density"
              options={
                densityOptions
              }
              selected={
                draft.density
              }
              onSelect={(
                value
              ) =>
                setDraft(
                  (current) => ({
                    ...current,
                    density:
                      value,
                  })
                )
              }
            />

            <OptionGroup
              label="Scalp type"
              options={
                scalpOptions
              }
              selected={
                draft.scalp
              }
              onSelect={(
                value
              ) =>
                setDraft(
                  (current) => ({
                    ...current,
                    scalp:
                      value,
                  })
                )
              }
            />

            <OptionGroup
              label="Chemical history"
              options={
                chemicalHistoryOptions
              }
              selected={
                draft
                  .chemicalHistory
              }
              onSelect={(
                value
              ) =>
                setDraft(
                  (current) => ({
                    ...current,
                    chemicalHistory:
                      value,
                  })
                )
              }
            />

            {/* OPTIONAL PROFILE CONTEXT */}

            <View
              style={
                styles.optionalIntro
              }
            >
              <Text
                style={
                  styles.optionalTitle
                }
              >
                Optional profile
                details
              </Text>

              <Text
                style={
                  styles.optionalText
                }
              >
                Turn these on only
                when they apply to
                you. ManeLine will
                use them in product
                recommendations and
                routine planning.
              </Text>
            </View>

            {/* HAIRSTYLE */}

            <ToggleDropdownSection
              title="Current hairstyle"
              description="Use this when you are currently wearing a style that changes scalp access or product use."
              enabled={
                draft
                  .hairstyleEnabled
              }
              onToggle={(
                enabled
              ) =>
                setDraft(
                  (current) => ({
                    ...current,

                    hairstyleEnabled:
                      enabled,

                    hairstyle:
                      enabled &&
                      !current.hairstyle
                        ? hairstyleOptions[0]
                        : current.hairstyle,
                  })
                )
              }
              dropdownLabel="Hairstyle"
              value={
                draft.hairstyle
              }
              options={
                hairstyleOptions
              }
              onSelect={(
                value
              ) =>
                setDraft(
                  (current) => ({
                    ...current,
                    hairstyle:
                      value,
                  })
                )
              }
            />

            {/* INSTALL / REMOVAL DATES */}

            {protectiveStyle ? (
              <View
                style={
                  styles.dateFields
                }
              >
                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  Style install
                  date
                </Text>

                <TextInput
                  value={
                    draft
                      .styleInstallDate
                  }
                  onChangeText={(
                    text
                  ) =>
                    setDraft(
                      (
                        current
                      ) => ({
                        ...current,

                        styleInstallDate:
                          text,
                      })
                    )
                  }
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  style={
                    styles.input
                  }
                />

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  Planned removal
                  date
                </Text>

                <TextInput
                  value={
                    draft
                      .styleRemovalDate
                  }
                  onChangeText={(
                    text
                  ) =>
                    setDraft(
                      (
                        current
                      ) => ({
                        ...current,

                        styleRemovalDate:
                          text,
                      })
                    )
                  }
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  style={
                    styles.input
                  }
                />

                <Text
                  style={
                    styles.dateHelp
                  }
                >
                  These dates are
                  used by your
                  Routine calendar.
                </Text>
              </View>
            ) : null}

            {/* SCALP CONDITION */}

            <ToggleDropdownSection
              title="Scalp medical condition"
              description="Optional. Turn this on if you have a known scalp condition you want ManeLine to consider."
              enabled={
                draft
                  .scalpConditionEnabled
              }
              onToggle={(
                enabled
              ) =>
                setDraft(
                  (current) => ({
                    ...current,

                    scalpConditionEnabled:
                      enabled,

                    scalpCondition:
                      enabled &&
                      !current
                        .scalpCondition
                        ? scalpConditionOptions[0]
                        : current
                            .scalpCondition,
                  })
                )
              }
              dropdownLabel="Scalp condition"
              value={
                draft
                  .scalpCondition
              }
              options={
                scalpConditionOptions
              }
              onSelect={(
                value
              ) =>
                setDraft(
                  (current) => ({
                    ...current,

                    scalpCondition:
                      value,
                  })
                )
              }
            />

            {/* HEAD COVERING */}

            <ToggleDropdownSection
              title="Head covering"
              description="Turn this on if you regularly wear a head covering that should be considered in your routine."
              enabled={
                draft
                  .headCoveringEnabled
              }
              onToggle={(
                enabled
              ) =>
                setDraft(
                  (current) => ({
                    ...current,

                    headCoveringEnabled:
                      enabled,

                    headCovering:
                      enabled &&
                      !current
                        .headCovering
                        ? headCoveringOptions[0]
                        : current
                            .headCovering,
                  })
                )
              }
              dropdownLabel="Head covering"
              value={
                draft
                  .headCovering
              }
              options={
                headCoveringOptions
              }
              onSelect={(
                value
              ) =>
                setDraft(
                  (current) => ({
                    ...current,

                    headCovering:
                      value,
                  })
                )
              }
            />

            {/* GOALS */}

            <Text
              style={
                styles.inputLabel
              }
            >
              Hair goals
            </Text>

            <View
              style={
                styles.modalGoalWrap
              }
            >
              {goalOptions.map(
                (goal) => {
                  const selected =
                    draft.goals.includes(
                      goal
                    );

                  return (
                    <Pressable
                      key={goal}
                      onPress={() =>
                        toggleGoal(
                          goal
                        )
                      }
                      style={[
                        styles.modalGoalChip,

                        selected &&
                          styles.modalGoalChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalGoalText,

                          selected &&
                            styles.modalGoalTextActive,
                        ]}
                      >
                        {goal}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>

            {/* ALLERGIES */}

            <Text
              style={
                styles.inputLabel
              }
            >
              Allergies or
              sensitivities
            </Text>

            <TextInput
              value={
                draft.allergies
              }
              onChangeText={(
                text
              ) =>
                setDraft(
                  (current) => ({
                    ...current,
                    allergies:
                      text,
                  })
                )
              }
              placeholder="Optional"
              multiline
              style={[
                styles.input,
                styles.textArea,
              ]}
            />

            {/* SAVE */}

            <Pressable
              style={
                styles.saveButton
              }
              onPress={onSave}
            >
              <Text
                style={
                  styles.saveButtonText
                }
              >
                Save profile
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* =========================================================
   TOGGLE + DROPDOWN SECTION
   ========================================================= */

function ToggleDropdownSection({
  title,
  description,
  enabled,
  onToggle,
  dropdownLabel,
  value,
  options,
  onSelect,
}: {
  title: string;

  description: string;

  enabled: boolean;

  onToggle:
    (enabled: boolean) =>
      void;

  dropdownLabel: string;

  value: string;

  options: string[];

  onSelect:
    (value: string) =>
      void;
}) {
  return (
    <View
      style={[
        styles.toggleCard,

        enabled &&
          styles.toggleCardActive,
      ]}
    >
      <View
        style={
          styles.toggleHeader
        }
      >
        <View
          style={
            styles.toggleCopy
          }
        >
          <Text
            style={
              styles.toggleTitle
            }
          >
            {title}
          </Text>

          <Text
            style={
              styles.toggleDescription
            }
          >
            {description}
          </Text>
        </View>

        <Switch
          value={enabled}
          onValueChange={
            onToggle
          }
          trackColor={{
            false: '#DDDCD4',
            true:
              COLORS.lightBlue,
          }}
          thumbColor={
            enabled
              ? COLORS.oxfordBlue
              : COLORS.white
          }
        />
      </View>

      {enabled ? (
        <View
          style={
            styles.toggleBody
          }
        >
          <DropdownField
            label={
              dropdownLabel
            }
            value={value}
            options={options}
            onSelect={
              onSelect
            }
          />
        </View>
      ) : null}
    </View>
  );
}

/* =========================================================
   DROPDOWN
   ========================================================= */

function DropdownField({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;

  value: string;

  options: string[];

  onSelect:
    (value: string) =>
      void;
}) {
  const [
    open,
    setOpen,
  ] =
    useState(false);

  return (
    <View>
      <Text
        style={
          styles.dropdownLabel
        }
      >
        {label}
      </Text>

      <Pressable
        style={
          styles.dropdownField
        }
        onPress={() =>
          setOpen(
            (current) =>
              !current
          )
        }
      >
        <Text
          style={
            styles.dropdownFieldText
          }
        >
          {value ||
            `Choose ${label.toLowerCase()}`}
        </Text>

        <Ionicons
          name={
            open
              ? 'chevron-up'
              : 'chevron-down'
          }
          size={18}
          color={
            COLORS.oxfordBlue
          }
        />
      </Pressable>

      {open ? (
        <View
          style={
            styles.dropdownMenu
          }
        >
          {options.map(
            (option) => {
              const selected =
                value === option;

              return (
                <Pressable
                  key={option}
                  style={[
                    styles.dropdownOption,

                    selected &&
                      styles.dropdownOptionSelected,
                  ]}
                  onPress={() => {
                    onSelect(
                      option
                    );

                    setOpen(
                      false
                    );
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,

                      selected &&
                        styles.dropdownOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>

                  {selected ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={
                        COLORS.green
                      }
                    />
                  ) : null}
                </Pressable>
              );
            }
          )}
        </View>
      ) : null}
    </View>
  );
}

/* =========================================================
   SECTION TITLE
   ========================================================= */

function SectionTitle({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string;

  title: string;

  subtitle?: string;
}) {
  return (
    <View
      style={
        styles.sectionHeader
      }
    >
      {kicker ? (
        <Text
          style={
            styles.sectionKicker
          }
        >
          {kicker}
        </Text>
      ) : null}

      <Text
        style={
          styles.sectionTitle
        }
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={
            styles.sectionSubtitle
          }
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/* =========================================================
   PROFILE CHIP
   ========================================================= */

function ProfileChip({
  icon,
  label,
  value,
  info,
}: {
  icon: IconName;

  label: string;

  value: string;

  info: string;
}) {
  const [
    showInfo,
    setShowInfo,
  ] =
    useState(false);

  return (
    <View
      style={[
        styles.profileChip,

        showInfo &&
          styles.profileChipExpanded,
      ]}
    >
      <View
        style={
          styles.profileChipTop
        }
      >
        <View
          style={
            styles.profileChipIcon
          }
        >
          <Ionicons
            name={icon}
            size={18}
            color={
              COLORS.oxfordBlue
            }
          />
        </View>

        <Pressable
          style={
            styles.infoButton
          }
          onPress={() =>
            setShowInfo(
              (current) =>
                !current
            )
          }
          hitSlop={8}
        >
          <Ionicons
            name={
              showInfo
                ? 'close-circle-outline'
                : 'information-circle-outline'
            }
            size={19}
            color={
              COLORS.green
            }
          />
        </Pressable>
      </View>

      <Text
        style={
          styles.profileChipLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.profileChipValue
        }
        numberOfLines={2}
      >
        {value}
      </Text>

      {showInfo ? (
        <View
          style={
            styles.profileInfoBubble
          }
        >
          <Text
            style={
              styles.profileInfoText
            }
          >
            {info}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/* =========================================================
   OPTION GROUP
   ========================================================= */

function OptionGroup({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;

  options: string[];

  selected: string;

  onSelect:
    (value: string) =>
      void;
}) {
  return (
    <View>
      <Text
        style={
          styles.inputLabel
        }
      >
        {label}
      </Text>

      <View
        style={
          styles.optionWrap
        }
      >
        {options.map(
          (option) => {
            const active =
              selected ===
              option;

            return (
              <Pressable
                key={option}
                onPress={() =>
                  onSelect(
                    option
                  )
                }
                style={[
                  styles.optionChip,

                  active &&
                    styles.optionChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,

                    active &&
                      styles.optionTextActive,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          }
        )}
      </View>
    </View>
  );
}

/* =========================================================
   SETTING ROW
   ========================================================= */

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

  onValueChange:
    (value: boolean) =>
      void;
}) {
  return (
    <View
      style={
        styles.settingRow
      }
    >
      <View
        style={
          styles.settingIcon
        }
      >
        <Ionicons
          name={icon}
          size={20}
          color={
            COLORS.oxfordBlue
          }
        />
      </View>

      <View
        style={{ flex: 1 }}
      >
        <Text
          style={
            styles.settingTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.settingSubtitle
          }
        >
          {subtitle}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={
          onValueChange
        }
        trackColor={{
          false: '#DDDCD4',
          true:
            COLORS.lightBlue,
        }}
        thumbColor={
          value
            ? COLORS.oxfordBlue
            : COLORS.white
        }
      />
    </View>
  );
}

/* =========================================================
   NAVIGATION ROW
   ========================================================= */

function NavigationRow({
  icon,
  title,
  onPress,
}: {
  icon: IconName;

  title: string;

  onPress: () => void;
}) {
  return (
    <Pressable
      style={
        styles.navigationRow
      }
      onPress={onPress}
    >
      <View
        style={
          styles.settingIcon
        }
      >
        <Ionicons
          name={icon}
          size={20}
          color={
            COLORS.oxfordBlue
          }
        />
      </View>

      <Text
        style={
          styles.navigationTitle
        }
      >
        {title}
      </Text>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={
          COLORS.mutedText
        }
      />
    </Pressable>
  );
}

/* =========================================================
   STYLES
   ========================================================= */

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    content: {
      paddingHorizontal:
        PAGE_HORIZONTAL_PADDING,
    },

    /* PROFILE HEADER */

    profileHeader: {
      backgroundColor:
        COLORS.lemonCream,

      borderRadius: 28,

      padding: 20,

      marginBottom: 28,

      overflow: 'hidden',
    },

    headerTop: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 13,
    },
avatarAction: {
  alignItems: 'center',
  justifyContent: 'center',
},

avatarEditText: {
  marginTop: 5,

  fontSize: 9,

  fontWeight: '900',

  color:
    COLORS.oxfordBlue,
},
    avatar: {
      width: 62,

      height: 62,

      borderRadius: 20,

      backgroundColor:
        COLORS.lightBlue,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    avatarText: {
      fontSize: 27,

      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    headerTextWrap: {
      flex: 1,
    },

    eyebrow: {
      fontSize: 10,

      fontWeight: '900',

      color: COLORS.green,

      letterSpacing: 1,
    },

    name: {
      marginTop: 3,

      fontSize: 25,

      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    email: {
      marginTop: 2,

      fontSize: 12,

      color:
        COLORS.brown,
    },

    editButton: {
      width: 40,

      height: 40,

      borderRadius: 14,

      backgroundColor:
        COLORS.white,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    /* STRENGTH */

    strengthCard: {
      marginTop: 20,

      paddingTop: 17,

      borderTopWidth: 1,

      borderTopColor:
        'rgba(61,41,32,0.12)',
    },

    strengthTop: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems:
        'flex-start',

      gap: 12,
    },

    strengthLabel: {
      fontSize: 14,

      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    strengthSubLabel: {
      marginTop: 2,

      fontSize: 11,

      color:
        COLORS.brown,
    },

    strengthPercent: {
      fontSize: 21,

      fontWeight: '900',

      color:
        COLORS.green,
    },

    progressTrack: {
      height: 8,

      marginTop: 12,

      borderRadius: 999,

      overflow: 'hidden',

      backgroundColor:
        'rgba(32,49,75,0.10)',
    },

    progressFill: {
      height: '100%',

      borderRadius: 999,

      backgroundColor:
        COLORS.green,
    },

    strengthHint: {
      marginTop: 9,

      maxWidth: 320,

      fontSize: 12,

      lineHeight: 18,

      color:
        COLORS.brown,
    },

    /* SECTION */

    sectionHeader: {
      marginBottom: 13,
    },

    sectionKicker: {
      marginBottom: 4,

      fontSize: 10,

      fontWeight: '900',

      letterSpacing: 1,

      color:
        COLORS.green,
    },

    sectionTitle: {
      fontSize: 23,

      fontWeight: '900',

      letterSpacing: -0.4,

      color:
        COLORS.oxfordBlue,
    },

    sectionSubtitle: {
      marginTop: 5,

      maxWidth: 350,

      fontSize: 13,

      lineHeight: 19,

      color:
        COLORS.mutedText,
    },

    /* PROFILE GRID */

    identityGrid: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: 10,

      marginBottom: 30,
    },

    profileChip: {
      width: '48%',

      minHeight: 94,

      paddingHorizontal: 12,

      paddingVertical: 11,

      borderRadius: 18,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.lightBorder,
    },

    profileChipExpanded: {
      minHeight: 150,

      borderColor:
        COLORS.lightBlue,
    },

    profileChipTop: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      marginBottom: 7,
    },

    profileChipIcon: {
      width: 31,

      height: 31,

      borderRadius: 10,

      backgroundColor:
        COLORS.lemonCream,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    infoButton: {
      width: 28,

      height: 28,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    profileChipLabel: {
      fontSize: 10,

      lineHeight: 13,

      fontWeight: '800',

      color:
        COLORS.mutedText,
    },

    profileChipValue: {
      marginTop: 2,

      fontSize: 16,

      lineHeight: 19,

      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    profileInfoBubble: {
      marginTop: 10,

      padding: 9,

      borderRadius: 11,

      backgroundColor:
        COLORS.lemonCream,
    },

    profileInfoText: {
      fontSize: 10,

      lineHeight: 15,

      color:
        COLORS.brown,
    },

    /* GOALS */

    goalWrap: {
      marginBottom: 30,

      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: 8,
    },

    goalChip: {
      paddingHorizontal: 11,

      paddingVertical: 8,

      borderRadius: 999,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 5,

      backgroundColor:
        COLORS.lightBlue,
    },

    goalText: {
      fontSize: 12,

      fontWeight: '800',

      color:
        COLORS.oxfordBlue,
    },

    /* ROUTINE */

    routineCard: {
      padding: 17,

      marginBottom: 11,

      borderRadius: 23,

      borderWidth: 1,

      borderColor:
        COLORS.lightBorder,

      backgroundColor:
        COLORS.white,

      flexDirection: 'row',

      gap: 13,
    },

    routineIcon: {
      width: 46,

      height: 46,

      borderRadius: 15,

      backgroundColor:
        COLORS.lemonCream,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    routineTitle: {
      marginBottom: 4,

      fontSize: 15,

      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    routineText: {
      fontSize: 13,

      lineHeight: 19,

      color:
        COLORS.mutedText,
    },

    routineLink: {
      marginTop: 10,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 3,
    },

    editRoutineText: {
      fontSize: 12,

      fontWeight: '900',

      color:
        COLORS.green,
    },

    compatibilityCard: {
      padding: 18,

      marginBottom: 30,

      borderRadius: 23,

      backgroundColor:
        COLORS.oxfordBlue,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 18,
    },

    compatibilityScoreWrap: {
      minWidth: 105,
    },

    compatibilityEyebrow: {
      fontSize: 9,

      fontWeight: '900',

      letterSpacing: 0.7,

      color:
        COLORS.lightBlue,
    },

    compatibilityScore: {
      marginTop: 3,

      fontSize: 38,

      fontWeight: '900',

      color:
        COLORS.white,
    },

    compatibilityCopy: {
      flex: 1,
    },

    compatibilityTitle: {
      fontSize: 15,

      fontWeight: '900',

      color:
        COLORS.lemonCream,
    },

    compatibilityText: {
      marginTop: 4,

      fontSize: 12,

      lineHeight: 18,

      color: '#E7ECF4',
    },

    /* SETTINGS */

    settingsCard: {
      padding: 15,

      marginBottom: 30,

      borderRadius: 23,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.lightBorder,
    },

    settingRow: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 11,
    },

    settingIcon: {
      width: 40,

      height: 40,

      borderRadius: 13,

      backgroundColor:
        COLORS.lemonCream,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    settingTitle: {
      fontSize: 13,

      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    settingSubtitle: {
      marginTop: 2,

      fontSize: 11,

      lineHeight: 16,

      color:
        COLORS.mutedText,
    },

    divider: {
      height: 1,

      marginVertical: 13,

      backgroundColor:
        '#EEEBDF',
    },

    /* NAVIGATION */

    navigationCard: {
      paddingHorizontal: 15,

      borderRadius: 23,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.lightBorder,
    },

    navigationRow: {
      minHeight: 67,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 11,
    },

    navigationTitle: {
      flex: 1,

      fontSize: 13,

      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    /* RESET */

    resetButton: {
      alignSelf: 'center',

      marginTop: 17,

      marginBottom: 14,

      paddingHorizontal: 12,

      paddingVertical: 10,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 6,
    },

    resetText: {
      color:
        COLORS.danger,

      fontSize: 12,

      fontWeight: '900',
    },

    /* MODAL */

    modalOverlay: {
      flex: 1,

      justifyContent:
        'flex-end',

      backgroundColor:
        'rgba(32,49,75,0.48)',
    },

    modalCard: {
      maxHeight: '92%',

      paddingHorizontal: 21,

      backgroundColor:
        COLORS.background,

      borderTopLeftRadius: 30,

      borderTopRightRadius: 30,
    },

    modalHandle: {
      alignSelf: 'center',

      width: 42,

      height: 5,

      marginTop: 10,

      marginBottom: 17,

      borderRadius: 999,

      backgroundColor:
        '#D5D4CA',
    },

    modalHeader: {
      marginBottom: 7,

      flexDirection: 'row',

      justifyContent:
        'space-between',

      gap: 14,
    },

    modalTitle: {
      fontSize: 23,

      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    modalSubtitle: {
      maxWidth: 300,

      marginTop: 4,

      fontSize: 13,

      lineHeight: 18,

      color:
        COLORS.mutedText,
    },

    inputLabel: {
      marginTop: 17,

      marginBottom: 7,

      fontSize: 12,

      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    input: {
      paddingHorizontal: 13,

      paddingVertical: 12,

      borderRadius: 15,

      borderWidth: 1,

      borderColor:
        COLORS.lightBorder,

      backgroundColor:
        COLORS.white,

      fontSize: 14,

      color:
        COLORS.oxfordBlue,
    },

    textArea: {
      minHeight: 85,

      textAlignVertical:
        'top',
    },

    /* CORE OPTIONS */

    optionWrap: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: 7,
    },

    optionChip: {
      paddingHorizontal: 11,

      paddingVertical: 8,

      borderRadius: 999,

      borderWidth: 1,

      borderColor:
        COLORS.lightBorder,

      backgroundColor:
        COLORS.white,
    },

    optionChipActive: {
      backgroundColor:
        COLORS.oxfordBlue,

      borderColor:
        COLORS.oxfordBlue,
    },

    optionText: {
      fontSize: 12,

      fontWeight: '800',

      color:
        COLORS.brown,
    },

    optionTextActive: {
      color:
        COLORS.white,
    },

    /* OPTIONAL PROFILE */

    optionalIntro: {
      marginTop: 27,

      marginBottom: 12,

      paddingTop: 20,

      borderTopWidth: 1,

      borderTopColor:
        COLORS.lightBorder,
    },

    optionalTitle: {
      fontSize: 17,

      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    optionalText: {
      marginTop: 4,

      fontSize: 12,

      lineHeight: 18,

      color:
        COLORS.mutedText,
    },

    toggleCard: {
      marginTop: 11,

      padding: 14,

      borderRadius: 18,

      borderWidth: 1,

      borderColor:
        COLORS.lightBorder,

      backgroundColor:
        COLORS.white,
    },

    toggleCardActive: {
      borderColor:
        COLORS.lightBlue,
    },

    toggleHeader: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 12,
    },

    toggleCopy: {
      flex: 1,
    },

    toggleTitle: {
      fontSize: 13,

      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    toggleDescription: {
      marginTop: 3,

      fontSize: 10,

      lineHeight: 15,

      color:
        COLORS.mutedText,
    },

    toggleBody: {
      marginTop: 14,

      paddingTop: 13,

      borderTopWidth: 1,

      borderTopColor:
        '#EEEBDD',
    },

    /* DROPDOWN */

    dropdownLabel: {
      marginBottom: 6,

      fontSize: 11,

      fontWeight: '900',

      color:
        COLORS.brown,
    },

    dropdownField: {
      minHeight: 48,

      paddingHorizontal: 13,

      borderRadius: 14,

      borderWidth: 1,

      borderColor:
        COLORS.lightBorder,

      backgroundColor:
        COLORS.background,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',
    },

    dropdownFieldText: {
      flex: 1,

      fontSize: 13,

      fontWeight: '800',

      color:
        COLORS.oxfordBlue,
    },

    dropdownMenu: {
      marginTop: 6,

      padding: 5,

      borderRadius: 14,

      borderWidth: 1,

      borderColor:
        COLORS.lightBorder,

      backgroundColor:
        COLORS.background,
    },

    dropdownOption: {
      minHeight: 43,

      paddingHorizontal: 11,

      borderRadius: 10,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',
    },

    dropdownOptionSelected: {
      backgroundColor:
        COLORS.lemonCream,
    },

    dropdownOptionText: {
      fontSize: 12,

      fontWeight: '800',

      color:
        COLORS.brown,
    },

    dropdownOptionTextSelected: {
      color:
        COLORS.oxfordBlue,

      fontWeight: '900',
    },

    dateFields: {
      marginTop: 2,

      paddingHorizontal: 3,
    },

    dateHelp: {
      marginTop: 6,

      fontSize: 10,

      lineHeight: 15,

      color:
        COLORS.mutedText,
    },

    /* GOALS */

    modalGoalWrap: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: 7,
    },

    modalGoalChip: {
      paddingHorizontal: 11,

      paddingVertical: 8,

      borderRadius: 999,

      borderWidth: 1,

      borderColor:
        COLORS.lightBorder,

      backgroundColor:
        COLORS.white,
    },

    modalGoalChipActive: {
      backgroundColor:
        COLORS.green,

      borderColor:
        COLORS.green,
    },

    modalGoalText: {
      fontSize: 12,

      fontWeight: '800',

      color:
        COLORS.brown,
    },

    modalGoalTextActive: {
      color:
        COLORS.white,
    },

    saveButton: {
      marginTop: 23,

      marginBottom: 30,

      paddingVertical: 15,

      borderRadius: 17,

      backgroundColor:
        COLORS.oxfordBlue,

      alignItems: 'center',
    },

    saveButtonText: {
      fontSize: 14,

      fontWeight: '900',

      color:
        COLORS.white,
    },
  });