import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useFocusEffect,
} from 'expo-router';

import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  getUserHairProfileOrNull,
  updateUserHairProfile,
} from '../services/profileFirebaseService';

import type {
  AvatarConfig,
} from '../services/profileFirebaseService';

/* =========================================================
   COLORS
   ========================================================= */

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
};

/* =========================================================
   AVATAR OPTIONS
   ========================================================= */

const skinToneOptions = [
  '#F7D7C4',
  '#EDC4A6',
  '#DFA77B',
  '#C68642',
  '#9B5E3C',
  '#6F3F2A',
  '#4A2A1D',
];

const hairColorOptions = [
  '#181310',
  '#2E211B',
  '#4A2C20',
  '#6B3E26',
  '#8A5A3C',
  '#B2764A',
];

const hairStyleOptions = [
  'Afro',
  'Puff',
  'Braids',
  'Locs',
  'Waves',
  'Straight',
  'Bun',
];

const backgroundOptions = [
  {
    label: 'Lemon',
    value: COLORS.lemonCream,
  },
  {
    label: 'Blue',
    value: COLORS.lightBlue,
  },
  {
    label: 'Cream',
    value: '#F4E5D3',
  },
  {
    label: 'Green',
    value: '#DCE4C7',
  },
];

const accessoryOptions = [
  'None',
  'Headband',
  'Glasses',
  'Bow',
];

/* =========================================================
   DEFAULT AVATAR
   ========================================================= */

const defaultAvatar: AvatarConfig = {
  skinTone: '#C68642',
  hairStyle: 'Afro',
  hairColor: '#181310',
  backgroundColor:
    COLORS.lightBlue,
  accessory: 'None',
};

/* =========================================================
   SCREEN
   ========================================================= */

export default function EditAvatarScreen() {
  const insets =
    useSafeAreaInsets();

  const [
    avatar,
    setAvatar,
  ] =
    useState<AvatarConfig>(
      defaultAvatar
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    hasChanges,
    setHasChanges,
  ] =
    useState(false);

  /* =======================================================
     LOAD SAVED AVATAR
     ======================================================= */

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadAvatar() {
        setLoading(true);

        try {
          const profile =
            await getUserHairProfileOrNull();

          if (!active) {
            return;
          }

          if (profile?.avatar) {
            setAvatar({
              ...defaultAvatar,
              ...profile.avatar,
            });
          } else {
            setAvatar(
              defaultAvatar
            );
          }

          setHasChanges(false);
        } catch (error) {
          console.warn(
            '[ManeLine avatar] Could not load avatar:',
            error
          );

          if (active) {
            Alert.alert(
              'Could not load avatar',
              'ManeLine could not load your saved avatar. You can still create a new one.'
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      void loadAvatar();

      return () => {
        active = false;
      };
    }, [])
  );

  /* =======================================================
     UPDATE HELPER
     ======================================================= */

  function updateAvatar<
    K extends keyof AvatarConfig
  >(
    key: K,
    value: AvatarConfig[K]
  ) {
    setAvatar(
      (current) => ({
        ...current,
        [key]: value,
      })
    );

    setHasChanges(true);
  }

  /* =======================================================
     SAVE
     ======================================================= */

  async function handleSaveAvatar() {
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      /*
       *
       * updateUserHairProfile()
       * resolves the current anonymous
       * Firebase user and merges this
       * avatar into:
       *
       * users/{uid}/profile/main
       */
      await updateUserHairProfile({
        avatar,
      });

      setHasChanges(false);

      Alert.alert(
        'Avatar saved',
        'Your ManeLine look has been updated.',
        [
          {
            text: 'Done',

            onPress: () =>
              router.back(),
          },
        ]
      );
    } catch (error) {
      console.warn(
        '[ManeLine avatar] Could not save avatar:',
        error
      );

      Alert.alert(
        'Could not save avatar',
        'ManeLine could not save your avatar. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     RESET
     ======================================================= */

  function handleResetAvatar() {
    Alert.alert(
      'Reset avatar?',
      'This will return your avatar to the ManeLine default.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style:
            'destructive',

          onPress: () => {
            setAvatar(
              defaultAvatar
            );

            setHasChanges(
              true
            );
          },
        },
      ]
    );
  }

  /* =======================================================
     BACK
     ======================================================= */

  function handleBack() {
    if (!hasChanges) {
      router.back();
      return;
    }

    Alert.alert(
      'Discard changes?',
      'Your avatar changes have not been saved.',
      [
        {
          text:
            'Keep editing',
          style: 'cancel',
        },
        {
          text:
            'Discard',
          style:
            'destructive',

          onPress: () =>
            router.back(),
        },
      ]
    );
  }

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <View
        style={
          styles.loadingScreen
        }
      >
        <ActivityIndicator
          size="large"
          color={
            COLORS.oxfordBlue
          }
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading your avatar...
        </Text>
      </View>
    );
  }

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
              insets.top + 12,

            paddingBottom:
              Math.max(
                insets.bottom +
                  40,
                60
              ),
          },
        ]}
      >
        {/* ===============================================
            HEADER
            =============================================== */}

        <View
          style={
            styles.header
          }
        >
          <Pressable
            style={
              styles.backButton
            }
            onPress={
              handleBack
            }
            hitSlop={8}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={
                COLORS.oxfordBlue
              }
            />
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
              YOUR LOOK
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Edit avatar
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Create a ManeLine
              avatar that feels
              like you.
            </Text>
          </View>

          <Pressable
            style={
              styles.resetButton
            }
            onPress={
              handleResetAvatar
            }
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color={
                COLORS.green
              }
            />
          </Pressable>
        </View>

        {/* ===============================================
            PREVIEW
            =============================================== */}

        <View
          style={
            styles.previewCard
          }
        >
          <Text
            style={
              styles.previewEyebrow
            }
          >
            PREVIEW
          </Text>

          <AvatarPreview
            avatar={avatar}
            size={190}
          />

          <Text
            style={
              styles.previewTitle
            }
          >
            Your ManeLine avatar
          </Text>

          <Text
            style={
              styles.previewText
            }
          >
            Your avatar will appear
            throughout your profile
            and personalized
            experience.
          </Text>
        </View>

        {/* ===============================================
            SKIN TONE
            =============================================== */}

        <EditorSection
          eyebrow="APPEARANCE"
          title="Skin tone"
          subtitle="Choose the tone that best represents your avatar."
        >
          <View
            style={
              styles.colorRow
            }
          >
            {skinToneOptions.map(
              (tone) => {
                const selected =
                  avatar.skinTone ===
                  tone;

                return (
                  <Pressable
                    key={tone}
                    style={[
                      styles.colorOption,

                      {
                        backgroundColor:
                          tone,
                      },

                      selected &&
                        styles.colorOptionSelected,
                    ]}
                    onPress={() =>
                      updateAvatar(
                        'skinTone',
                        tone
                      )
                    }
                  >
                    {selected ? (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={
                          tone ===
                            '#4A2A1D' ||
                          tone ===
                            '#6F3F2A'
                            ? COLORS.white
                            : COLORS.oxfordBlue
                        }
                      />
                    ) : null}
                  </Pressable>
                );
              }
            )}
          </View>
        </EditorSection>

        {/* ===============================================
            HAIR STYLE
            =============================================== */}

        <EditorSection
          eyebrow="HAIR"
          title="Hair style"
          subtitle="Pick the style shown on your avatar."
        >
          <View
            style={
              styles.optionGrid
            }
          >
            {hairStyleOptions.map(
              (option) => (
                <OptionButton
                  key={
                    option
                  }
                  label={
                    option
                  }
                  selected={
                    avatar.hairStyle ===
                    option
                  }
                  onPress={() =>
                    updateAvatar(
                      'hairStyle',
                      option
                    )
                  }
                />
              )
            )}
          </View>
        </EditorSection>

        {/* ===============================================
            HAIR COLOR
            =============================================== */}

        <EditorSection
          eyebrow="HAIR"
          title="Hair color"
          subtitle="Choose a color for your avatar's hair."
        >
          <View
            style={
              styles.colorRow
            }
          >
            {hairColorOptions.map(
              (color) => {
                const selected =
                  avatar.hairColor ===
                  color;

                return (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOption,

                      {
                        backgroundColor:
                          color,
                      },

                      selected &&
                        styles.colorOptionSelected,
                    ]}
                    onPress={() =>
                      updateAvatar(
                        'hairColor',
                        color
                      )
                    }
                  >
                    {selected ? (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={
                          COLORS.white
                        }
                      />
                    ) : null}
                  </Pressable>
                );
              }
            )}
          </View>
        </EditorSection>

        {/* ===============================================
            BACKGROUND
            =============================================== */}

        <EditorSection
          eyebrow="STYLE"
          title="Background"
          subtitle="Choose the color behind your avatar."
        >
          <View
            style={
              styles.backgroundGrid
            }
          >
            {backgroundOptions.map(
              (option) => {
                const selected =
                  avatar.backgroundColor ===
                  option.value;

                return (
                  <Pressable
                    key={
                      option.value
                    }
                    style={[
                      styles.backgroundOption,

                      {
                        backgroundColor:
                          option.value,
                      },

                      selected &&
                        styles.backgroundOptionSelected,
                    ]}
                    onPress={() =>
                      updateAvatar(
                        'backgroundColor',
                        option.value
                      )
                    }
                  >
                    <Text
                      style={
                        styles.backgroundOptionText
                      }
                    >
                      {
                        option.label
                      }
                    </Text>

                    {selected ? (
                      <View
                        style={
                          styles.smallCheck
                        }
                      >
                        <Ionicons
                          name="checkmark"
                          size={12}
                          color={
                            COLORS.white
                          }
                        />
                      </View>
                    ) : null}
                  </Pressable>
                );
              }
            )}
          </View>
        </EditorSection>

        {/* ===============================================
            ACCESSORIES
            =============================================== */}

        <EditorSection
          eyebrow="FINISHING TOUCH"
          title="Accessory"
          subtitle="Add an optional detail to your avatar."
        >
          <View
            style={
              styles.optionGrid
            }
          >
            {accessoryOptions.map(
              (option) => (
                <OptionButton
                  key={
                    option
                  }
                  label={
                    option
                  }
                  selected={
                    avatar.accessory ===
                    option
                  }
                  onPress={() =>
                    updateAvatar(
                      'accessory',
                      option
                    )
                  }
                />
              )
            )}
          </View>
        </EditorSection>

        {/* ===============================================
            SAVE
            =============================================== */}

        <Pressable
          style={[
            styles.saveButton,

            saving &&
              styles.saveButtonDisabled,
          ]}
          disabled={
            saving
          }
          onPress={
            handleSaveAvatar
          }
        >
          {saving ? (
            <ActivityIndicator
              color={
                COLORS.white
              }
            />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={
                  COLORS.white
                }
              />

              <Text
                style={
                  styles.saveButtonText
                }
              >
                Save avatar
              </Text>
            </>
          )}
        </Pressable>

        {hasChanges ? (
          <Text
            style={
              styles.unsavedText
            }
          >
            You have unsaved
            changes.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

/* =========================================================
   AVATAR PREVIEW
   ========================================================= */

export function AvatarPreview({
  avatar,
  size = 150,
}: {
  avatar: AvatarConfig;

  size?: number;
}) {
  const headSize =
    size * 0.48;

  return (
    <View
      style={[
        styles.avatarPreview,

        {
          width: size,
          height: size,
          borderRadius:
            size / 2,

          backgroundColor:
            avatar.backgroundColor,
        },
      ]}
    >
      {/* HAIR BACK */}

      <HairShape
        styleName={
          avatar.hairStyle
        }
        color={
          avatar.hairColor
        }
        size={size}
      />

      {/* FACE */}

      <View
        style={[
          styles.face,

          {
            width:
              headSize,

            height:
              headSize * 1.08,

            borderRadius:
              headSize / 2,

            backgroundColor:
              avatar.skinTone,

            top:
              size * 0.30,
          },
        ]}
      >
        {/* EYES */}

        <View
          style={
            styles.eyeRow
          }
        >
          <View
            style={
              styles.eye
            }
          />

          <View
            style={
              styles.eye
            }
          />
        </View>

        {/* NOSE */}

        <View
          style={
            styles.nose
          }
        />

        {/* SMILE */}

        <View
          style={
            styles.smile
          }
        />
      </View>

      {/* ACCESSORY */}

      <AvatarAccessory
        accessory={
          avatar.accessory
        }
        size={size}
      />
    </View>
  );
}

/* =========================================================
   HAIR SHAPE
   ========================================================= */

function HairShape({
  styleName,
  color,
  size,
}: {
  styleName: string;

  color: string;

  size: number;
}) {
  if (
    styleName ===
    'Puff'
  ) {
    return (
      <>
        <View
          style={[
            styles.puff,

            {
              width:
                size * 0.27,

              height:
                size * 0.27,

              borderRadius:
                size * 0.14,

              backgroundColor:
                color,

              left:
                size * 0.16,

              top:
                size * 0.13,
            },
          ]}
        />

        <View
          style={[
            styles.puff,

            {
              width:
                size * 0.27,

              height:
                size * 0.27,

              borderRadius:
                size * 0.14,

              backgroundColor:
                color,

              right:
                size * 0.16,

              top:
                size * 0.13,
            },
          ]}
        />
      </>
    );
  }

  if (
    styleName ===
    'Braids' ||
    styleName ===
    'Locs'
  ) {
    return (
      <View
        style={[
          styles.longHair,

          {
            width:
              size * 0.59,

            height:
              size * 0.68,

            left:
              size * 0.205,

            top:
              size * 0.14,

            backgroundColor:
              color,

            borderRadius:
              size * 0.25,
          },
        ]}
      >
        {[
          0,
          1,
          2,
          3,
          4,
        ].map(
          (index) => (
            <View
              key={
                index
              }
              style={[
                styles.braidLine,

                {
                  left:
                    `${16 +
                    index *
                      17}%`,

                  backgroundColor:
                    'rgba(255,255,255,0.12)',
                },
              ]}
            />
          )
        )}
      </View>
    );
  }

  if (
    styleName ===
    'Straight'
  ) {
    return (
      <View
        style={[
          styles.longHair,

          {
            width:
              size * 0.56,

            height:
              size * 0.65,

            left:
              size * 0.22,

            top:
              size * 0.15,

            backgroundColor:
              color,

            borderRadius:
              size * 0.18,
          },
        ]}
      />
    );
  }

  if (
    styleName ===
    'Bun'
  ) {
    return (
      <>
        <View
          style={[
            styles.bun,

            {
              width:
                size * 0.28,

              height:
                size * 0.28,

              borderRadius:
                size * 0.14,

              backgroundColor:
                color,

              left:
                size * 0.36,

              top:
                size * 0.05,
            },
          ]}
        />

        <View
          style={[
            styles.hairCap,

            {
              width:
                size * 0.54,

              height:
                size * 0.38,

              left:
                size * 0.23,

              top:
                size * 0.16,

              backgroundColor:
                color,

              borderRadius:
                size * 0.24,
            },
          ]}
        />
      </>
    );
  }

  if (
    styleName ===
    'Waves'
  ) {
    return (
      <View
        style={[
          styles.hairCap,

          {
            width:
              size * 0.57,

            height:
              size * 0.40,

            left:
              size * 0.215,

            top:
              size * 0.15,

            backgroundColor:
              color,

            borderRadius:
              size * 0.25,
          },
        ]}
      >
        <Text
          style={[
            styles.waveText,

            {
              fontSize:
                size * 0.11,
            },
          ]}
        >
          ≋ ≋ ≋
        </Text>
      </View>
    );
  }

  /*
   * Default: Afro
   */

  return (
    <View
      style={[
        styles.afro,

        {
          width:
            size * 0.67,

          height:
            size * 0.55,

          left:
            size * 0.165,

          top:
            size * 0.08,

          backgroundColor:
            color,

          borderRadius:
            size * 0.34,
        },
      ]}
    />
  );
}

/* =========================================================
   ACCESSORY
   ========================================================= */

function AvatarAccessory({
  accessory,
  size,
}: {
  accessory: string;

  size: number;
}) {
  if (
    accessory ===
    'Glasses'
  ) {
    return (
      <View
        style={[
          styles.glassesWrap,

          {
            top:
              size * 0.48,

            width:
              size * 0.40,
          },
        ]}
      >
        <View
          style={[
            styles.glassesLens,

            {
              width:
                size * 0.13,

              height:
                size * 0.10,
            },
          ]}
        />

        <View
          style={[
            styles.glassesBridge,

            {
              width:
                size * 0.06,
            },
          ]}
        />

        <View
          style={[
            styles.glassesLens,

            {
              width:
                size * 0.13,

              height:
                size * 0.10,
            },
          ]}
        />
      </View>
    );
  }

  if (
    accessory ===
    'Headband'
  ) {
    return (
      <View
        style={[
          styles.headband,

          {
            top:
              size * 0.29,

            width:
              size * 0.56,

            height:
              Math.max(
                size * 0.045,
                7
              ),
          },
        ]}
      />
    );
  }

  if (
    accessory ===
    'Bow'
  ) {
    return (
      <View
        style={[
          styles.bowWrap,

          {
            top:
              size * 0.23,

            right:
              size * 0.20,
          },
        ]}
      >
        <View
          style={
            styles.bowLeft
          }
        />

        <View
          style={
            styles.bowCenter
          }
        />

        <View
          style={
            styles.bowRight
          }
        />
      </View>
    );
  }

  return null;
}

/* =========================================================
   SECTION
   ========================================================= */

function EditorSection({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;

  title: string;

  subtitle: string;

  children:
    React.ReactNode;
}) {
  return (
    <View
      style={
        styles.section
      }
    >
      <Text
        style={
          styles.sectionEyebrow
        }
      >
        {eyebrow}
      </Text>

      <Text
        style={
          styles.sectionTitle
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.sectionSubtitle
        }
      >
        {subtitle}
      </Text>

      <View
        style={
          styles.sectionContent
        }
      >
        {children}
      </View>
    </View>
  );
}

/* =========================================================
   OPTION BUTTON
   ========================================================= */

function OptionButton({
  label,
  selected,
  onPress,
}: {
  label: string;

  selected: boolean;

  onPress:
    () => void;
}) {
  return (
    <Pressable
      style={[
        styles.optionButton,

        selected &&
          styles.optionButtonSelected,
      ]}
      onPress={
        onPress
      }
    >
      <Text
        style={[
          styles.optionButtonText,

          selected &&
            styles.optionButtonTextSelected,
        ]}
      >
        {label}
      </Text>

      {selected ? (
        <Ionicons
          name="checkmark-circle"
          size={16}
          color={
            COLORS.white
          }
        />
      ) : null}
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

    loadingScreen: {
      flex: 1,

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 12,

      backgroundColor:
        COLORS.background,
    },

    loadingText: {
      fontSize: 12,

      fontWeight: '800',

      color:
        COLORS.mutedText,
    },

    content: {
      paddingHorizontal:
        20,
    },

    /* HEADER */

    header: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      gap: 12,

      marginBottom:
        18,
    },

    backButton: {
      width: 42,

      height: 42,

      borderRadius:
        14,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.lemonCream,
    },

    headerTextWrap: {
      flex: 1,
    },

    eyebrow: {
      marginTop: 2,

      fontSize: 10,

      fontWeight:
        '900',

      letterSpacing:
        1,

      color:
        COLORS.green,
    },

    title: {
      marginTop: 3,

      fontSize: 29,

      lineHeight: 33,

      fontWeight:
        '900',

      color:
        COLORS.oxfordBlue,
    },

    subtitle: {
      marginTop: 5,

      maxWidth: 280,

      fontSize: 12,

      lineHeight: 18,

      color:
        COLORS.mutedText,
    },

    resetButton: {
      width: 42,

      height: 42,

      borderRadius:
        14,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.lightBorder,
    },

    /* PREVIEW */

    previewCard: {
      paddingVertical:
        26,

      paddingHorizontal:
        20,

      marginBottom:
        24,

      borderRadius:
        28,

      alignItems:
        'center',

      backgroundColor:
        COLORS.lemonCream,
    },

    previewEyebrow: {
      marginBottom: 14,

      fontSize: 9,

      fontWeight:
        '900',

      letterSpacing:
        1,

      color:
        COLORS.green,
    },

    previewTitle: {
      marginTop: 15,

      fontSize: 17,

      fontWeight:
        '900',

      color:
        COLORS.oxfordBlue,
    },

    previewText: {
      marginTop: 5,

      maxWidth: 270,

      textAlign:
        'center',

      fontSize: 11,

      lineHeight: 17,

      color:
        COLORS.brown,
    },

    avatarPreview: {
      position:
        'relative',

      overflow:
        'hidden',

      alignItems:
        'center',
    },

    face: {
      position:
        'absolute',

      alignItems:
        'center',
    },

    eyeRow: {
      position:
        'absolute',

      top: '38%',

      width: '55%',

      flexDirection:
        'row',

      justifyContent:
        'space-between',
    },

    eye: {
      width: 7,

      height: 9,

      borderRadius:
        999,

      backgroundColor:
        '#2A1A16',
    },

    nose: {
      position:
        'absolute',

      top: '53%',

      width: 4,

      height: 8,

      borderRadius:
        999,

      backgroundColor:
        'rgba(61,41,32,0.28)',
    },

    smile: {
      position:
        'absolute',

      top: '69%',

      width: 25,

      height: 11,

      borderBottomWidth:
        2,

      borderBottomColor:
        '#7A3E32',

      borderRadius:
        999,
    },

    afro: {
      position:
        'absolute',
    },

    puff: {
      position:
        'absolute',
    },

    longHair: {
      position:
        'absolute',
    },

    hairCap: {
      position:
        'absolute',

      alignItems:
        'center',

      overflow:
        'hidden',
    },

    bun: {
      position:
        'absolute',
    },

    braidLine: {
      position:
        'absolute',

      top: '42%',

      bottom: 0,

      width: 2,
    },

    waveText: {
      marginTop: '20%',

      color:
        'rgba(255,255,255,0.25)',

      fontWeight:
        '900',
    },

    glassesWrap: {
      position:
        'absolute',

      zIndex: 10,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    glassesLens: {
      borderWidth: 2,

      borderColor:
        COLORS.oxfordBlue,

      borderRadius: 8,

      backgroundColor:
        'rgba(255,255,255,0.10)',
    },

    glassesBridge: {
      height: 2,

      backgroundColor:
        COLORS.oxfordBlue,
    },

    headband: {
      position:
        'absolute',

      zIndex: 9,

      borderRadius:
        999,

      backgroundColor:
        COLORS.green,
    },

    bowWrap: {
      position:
        'absolute',

      zIndex: 10,

      flexDirection:
        'row',

      alignItems:
        'center',
    },

    bowLeft: {
      width: 18,

      height: 15,

      borderTopLeftRadius:
        10,

      borderBottomLeftRadius:
        10,

      backgroundColor:
        COLORS.green,

      transform: [
        {
          rotate:
            '18deg',
        },
      ],
    },

    bowCenter: {
      width: 9,

      height: 9,

      borderRadius:
        999,

      backgroundColor:
        COLORS.oxfordBlue,
    },

    bowRight: {
      width: 18,

      height: 15,

      borderTopRightRadius:
        10,

      borderBottomRightRadius:
        10,

      backgroundColor:
        COLORS.green,

      transform: [
        {
          rotate:
            '-18deg',
        },
      ],
    },

    /* SECTIONS */

    section: {
      marginBottom:
        25,
    },

    sectionEyebrow: {
      fontSize: 9,

      fontWeight:
        '900',

      letterSpacing:
        1,

      color:
        COLORS.green,
    },

    sectionTitle: {
      marginTop: 3,

      fontSize: 20,

      fontWeight:
        '900',

      color:
        COLORS.oxfordBlue,
    },

    sectionSubtitle: {
      marginTop: 4,

      maxWidth: 340,

      fontSize: 11,

      lineHeight: 17,

      color:
        COLORS.mutedText,
    },

    sectionContent: {
      marginTop: 12,
    },

    /* COLORS */

    colorRow: {
      flexDirection:
        'row',

      flexWrap: 'wrap',

      gap: 11,
    },

    colorOption: {
      width: 46,

      height: 46,

      borderRadius:
        15,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderWidth: 2,

      borderColor:
        'transparent',
    },

    colorOptionSelected: {
      borderColor:
        COLORS.oxfordBlue,

      transform: [
        {
          scale: 1.06,
        },
      ],
    },

    /* OPTION BUTTONS */

    optionGrid: {
      flexDirection:
        'row',

      flexWrap: 'wrap',

      gap: 9,
    },

    optionButton: {
      minWidth: '30%',

      paddingHorizontal:
        12,

      paddingVertical:
        11,

      borderRadius:
        14,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 5,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.lightBorder,
    },

    optionButtonSelected: {
      backgroundColor:
        COLORS.oxfordBlue,

      borderColor:
        COLORS.oxfordBlue,
    },

    optionButtonText: {
      fontSize: 11,

      fontWeight:
        '800',

      color:
        COLORS.oxfordBlue,
    },

    optionButtonTextSelected: {
      color:
        COLORS.white,
    },

    /* BACKGROUNDS */

    backgroundGrid: {
      flexDirection:
        'row',

      flexWrap: 'wrap',

      gap: 10,
    },

    backgroundOption: {
      width: '47%',

      minHeight: 65,

      padding: 12,

      borderRadius:
        16,

      flexDirection:
        'row',

      alignItems:
        'flex-end',

      justifyContent:
        'space-between',

      borderWidth: 2,

      borderColor:
        'transparent',
    },

    backgroundOptionSelected: {
      borderColor:
        COLORS.oxfordBlue,
    },

    backgroundOptionText: {
      fontSize: 10,

      fontWeight:
        '900',

      color:
        COLORS.oxfordBlue,
    },

    smallCheck: {
      width: 19,

      height: 19,

      borderRadius:
        999,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.oxfordBlue,
    },

    /* SAVE */

    saveButton: {
      minHeight: 54,

      marginTop: 4,

      borderRadius:
        17,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 8,

      backgroundColor:
        COLORS.oxfordBlue,
    },

    saveButtonDisabled: {
      opacity: 0.55,
    },

    saveButtonText: {
      fontSize: 13,

      fontWeight:
        '900',

      color:
        COLORS.white,
    },

    unsavedText: {
      marginTop: 9,

      textAlign:
        'center',

      fontSize: 10,

      fontWeight:
        '700',

      color:
        COLORS.mutedText,
    },
  });