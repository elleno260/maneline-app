import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import type { ComponentProps } from 'react';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getUserHairProfileOrNull,
  UserHairProfile,
} from '../../services/profileFirebaseService';

import {
  getProductRecommendations,
  ProductRecommendation,
} from '../../services/productRecommendationService';

import type {
  HairProfileForMatching,
} from '../../types/product.types';

type IconName =
  ComponentProps<typeof Ionicons>['name'];

/* =========================================================
   CATEGORIES
   ========================================================= */

const categories = [
  'All',
  'Shampoo',
  'Conditioner',
  'Deep Conditioner',
  'Leave-In',
  'Cream',
  'Gel',
  'Oil',
  'Scalp Care',
  'Treatment',
  'Styler',
];

/* =========================================================
   FALLBACK PROFILE
   ========================================================= */

const fallbackProfile: UserHairProfile = {
  displayName: 'Ellen',
  email: 'ellen@example.com',

  hairType: '4C',
  porosity: 'Low',

  /*
   * NOTE:
   * Your Firebase profile schema still appears to use
   * the older profile structure.
   *
   * We should migrate this service next so Texture
   * and Density are stored separately everywhere.
   */
  density: 'Fine',

  scalp: 'Dry',

  goals: [
    'Moisture',
    'Length retention',
    'Growth',
  ],

  allergies: '',

  routineFocus:
    'Moisture-first routine with lightweight products and buildup control.',

  routineCompatibilityScore: 91,

  routineSteps: [
    {
      id: 'cleanse',
      title: 'Cleanse',
      frequency: 'Every 7–10 days',
      productType:
        'Gentle shampoo or clarifying shampoo as needed',
      note:
        'Focus on removing buildup without stripping your hair.',
    },

    {
      id: 'leave-in',
      title: 'Leave-in',
      frequency: 'After every wash',
      productType:
        'Lightweight leave-in conditioner',
      note:
        'Apply in sections so the product distributes evenly.',
    },
  ],
};

/* =========================================================
   SCREEN
   ========================================================= */

export default function SearchScreen() {
  const insets =
    useSafeAreaInsets();

  const [
    queryText,
    setQueryText,
  ] = useState('');

  const [
    debouncedQuery,
    setDebouncedQuery,
  ] = useState('');

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState('All');

  const [
    recommendations,
    setRecommendations,
  ] = useState<
    ProductRecommendation[]
  >([]);

  const [
    selectedRecommendation,
    setSelectedRecommendation,
  ] =
    useState<ProductRecommendation | null>(
      null
    );

  const [
    currentProfile,
    setCurrentProfile,
  ] =
    useState<UserHairProfile>(
      fallbackProfile
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState(false);

  /* =======================================================
     DEBOUNCE SEARCH

     Prevents a recommendation/database request on every
     single keystroke.
     ======================================================= */

  useEffect(() => {
    const timer =
      setTimeout(() => {
        setDebouncedQuery(
          queryText.trim()
        );
      }, 350);

    return () =>
      clearTimeout(timer);
  }, [queryText]);

  /* =======================================================
     LOAD RECOMMENDATIONS
     ======================================================= */

  const loadRecommendations =
    useCallback(async () => {
      setLoading(true);
      setLoadError(false);

      try {
        const savedProfile =
          await getUserHairProfileOrNull();

        const profile =
          savedProfile ??
          fallbackProfile;

        setCurrentProfile(
          profile
        );

        const matchingProfile:
          HairProfileForMatching =
          profile;

        const rankedProducts =
          await getProductRecommendations(
            matchingProfile,
            {
              category:
                selectedCategory,

              query:
                debouncedQuery,
            }
          );

        setRecommendations(
          rankedProducts
        );
      } catch (error) {
        console.warn(
          '[ManeLine discover] Could not load recommendations:',
          error
        );

        setRecommendations([]);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }, [
      debouncedQuery,
      selectedCategory,
    ]);

  useFocusEffect(
    useCallback(() => {
      loadRecommendations();
    }, [loadRecommendations])
  );

  /* =======================================================
     PRODUCT LINK
     ======================================================= */

  async function openProductLink(
    url?: string
  ) {
    if (!url) return;

    try {
      const supported =
        await Linking.canOpenURL(
          url
        );

      if (supported) {
        await Linking.openURL(
          url
        );
      }
    } catch (error) {
      console.warn(
        '[ManeLine discover] Could not open product URL:',
        error
      );
    }
  }

  /* =======================================================
     CLEAR SEARCH
     ======================================================= */

  function clearSearch() {
    setQueryText('');
    setDebouncedQuery('');
  }

  /* =======================================================
     PRODUCT CARD
     ======================================================= */

  function renderProductCard({
    item,
  }: {
    item: ProductRecommendation;
  }) {
    const {
      product,
      compatibility,
    } = item;

    const strongMatch =
      compatibility.score >= 80;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.productCard,

          pressed &&
            styles.productCardPressed,
        ]}
        onPress={() =>
          setSelectedRecommendation(
            item
          )
        }
      >
        {/* PRODUCT TOP */}

        <View
          style={
            styles.productTopRow
          }
        >
          <View
            style={
              styles.productVisual
            }
          >
            <Text
              style={
                styles.productEmojiText
              }
            >
              {product.imageEmoji ??
                '🧴'}
            </Text>
          </View>

          <View
            style={
              styles.productInfo
            }
          >
            <Text
              style={
                styles.brand
              }
              numberOfLines={1}
            >
              {product.brand}
            </Text>

            <Text
              style={
                styles.productName
              }
              numberOfLines={2}
            >
              {product.name}
            </Text>

            <Text
              style={
                styles.category
              }
            >
              {product.category}
            </Text>
          </View>

          <View
            style={[
              styles.scorePill,

              strongMatch
                ? styles.scorePillStrong
                : styles.scorePillNormal,
            ]}
          >
            <Text
              style={[
                styles.scoreText,

                strongMatch
                  ? styles.scoreTextStrong
                  : styles.scoreTextNormal,
              ]}
            >
              {compatibility.score}%
            </Text>

            <Text
              style={[
                styles.scoreLabel,

                strongMatch
                  ? styles.scoreTextStrong
                  : styles.scoreTextNormal,
              ]}
            >
              match
            </Text>
          </View>
        </View>

        {/* DESCRIPTION */}

        {product.description ? (
          <Text
            style={
              styles.description
            }
            numberOfLines={2}
          >
            {product.description}
          </Text>
        ) : null}

        {/* WHY IT MATCHES */}

        <View
          style={
            styles.reasonBox
          }
        >
          <View
            style={
              styles.reasonTop
            }
          >
            <Ionicons
              name={
                strongMatch
                  ? 'checkmark-circle'
                  : 'sparkles-outline'
              }
              size={17}
              color={
                strongMatch
                  ? COLORS.green
                  : COLORS.oxfordBlue
              }
            />

            <Text
              style={
                styles.reasonTitle
              }
            >
              {
                compatibility.label
              }
            </Text>
          </View>

          <Text
            style={
              styles.reasonText
            }
            numberOfLines={2}
          >
            {compatibility
              .reasons[0] ??
              compatibility.summary}
          </Text>
        </View>

        {/* TAGS */}

        {product.tags?.length ? (
          <View
            style={
              styles.tagRow
            }
          >
            {product.tags
              .slice(0, 3)
              .map((tag) => (
                <View
                  key={tag}
                  style={
                    styles.tag
                  }
                >
                  <Text
                    style={
                      styles.tagText
                    }
                  >
                    {tag}
                  </Text>
                </View>
              ))}
          </View>
        ) : null}

        {/* VIEW DETAILS */}

        <View
          style={
            styles.detailsRow
          }
        >
          <Text
            style={
              styles.detailsText
            }
          >
            View analysis
          </Text>

          <Ionicons
            name="arrow-forward"
            size={16}
            color={
              COLORS.oxfordBlue
            }
          />
        </View>
      </Pressable>
    );
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <View
      style={
        styles.screen
      }
    >
      <FlatList
        data={
          loading
            ? []
            : recommendations
        }
        keyExtractor={(
          item
        ) =>
          item.product.id
        }
        renderItem={
          renderProductCard
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={[
          styles.listContent,

          {
            paddingTop:
              insets.top + 18,

            paddingBottom: 140,
          },
        ]}
        ListHeaderComponent={
          <>
            {/* =========================================
                PAGE HEADER
                ========================================= */}

            <View
              style={
                styles.header
              }
            >
              <Text
                style={
                  styles.eyebrow
                }
              >
                DISCOVER
              </Text>

              <Text
                style={
                  styles.title
                }
              >
                Find your next match.
              </Text>

              <Text
                style={
                  styles.subtitle
                }
              >
                Explore hair products
                ranked for your profile,
                goals, and ingredient
                compatibility.
              </Text>
            </View>

            {/* =========================================
                PERSONALIZATION BANNER
                ========================================= */}

            <View
              style={
                styles.personalizedCard
              }
            >
              <View
                style={
                  styles.personalizedIcon
                }
              >
                <Ionicons
                  name="sparkles"
                  size={21}
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
                    styles.personalizedEyebrow
                  }
                >
                  PERSONALIZED FOR YOU
                </Text>

                <Text
                  style={
                    styles.personalizedTitle
                  }
                >
                  {
                    currentProfile.hairType
                  }{' '}
                  •{' '}
                  {
                    currentProfile.porosity
                  }{' '}
                  porosity
                </Text>

                {currentProfile
                  .goals
                  ?.length ? (
                  <Text
                    style={
                      styles.personalizedText
                    }
                    numberOfLines={1}
                  >
                    Focus:{' '}
                    {currentProfile.goals
                      .slice(0, 2)
                      .join(' + ')}
                  </Text>
                ) : null}
              </View>

              <Pressable
                onPress={() =>
                  router.push('/(tabs)/profile')
                }
                hitSlop={8}
              >
                <Ionicons
                  name="create-outline"
                  size={19}
                  color={
                    COLORS.oxfordBlue
                  }
                />
              </Pressable>
            </View>

            {/* =========================================
                SEARCH
                ========================================= */}

            <View
              style={
                styles.searchBox
              }
            >
              <Ionicons
                name="search-outline"
                size={20}
                color={
                  COLORS.mutedText
                }
              />

              <TextInput
                value={
                  queryText
                }
                onChangeText={
                  setQueryText
                }
                placeholder="Search products, brands, ingredients..."
                placeholderTextColor="#9CA3AF"
                style={
                  styles.searchInput
                }
                returnKeyType="search"
              />

              {queryText.length >
              0 ? (
                <Pressable
                  onPress={
                    clearSearch
                  }
                  hitSlop={8}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={
                      COLORS.mutedText
                    }
                  />
                </Pressable>
              ) : null}
            </View>

            {/* =========================================
                CATEGORY FILTER
                ========================================= */}

            <View
              style={
                styles.browseHeading
              }
            >
              <Text
                style={
                  styles.browseTitle
                }
              >
                Browse by category
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.categoryRow
              }
            >
              {categories.map(
                (category) => {
                  const isSelected =
                    selectedCategory ===
                    category;

                  return (
                    <Pressable
                      key={
                        category
                      }
                      onPress={() =>
                        setSelectedCategory(
                          category
                        )
                      }
                      style={[
                        styles.categoryChip,

                        isSelected &&
                          styles.categoryChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,

                          isSelected &&
                            styles.categoryChipTextActive,
                        ]}
                      >
                        {category}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </ScrollView>

            {/* =========================================
                RESULTS HEADER
                ========================================= */}

            <View
              style={
                styles.sectionHeader
              }
            >
              <View
                style={{ flex: 1 }}
              >
                <Text
                  style={
                    styles.sectionKicker
                  }
                >
                  FOR YOUR HAIR
                </Text>

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  {debouncedQuery
                    ? 'Search results'
                    : selectedCategory ===
                        'All'
                      ? 'Recommended for you'
                      : selectedCategory}
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Ranked by how well
                  each product fits your
                  hair profile.
                </Text>
              </View>

              {!loading &&
              recommendations.length >
                0 ? (
                <View
                  style={
                    styles.resultCount
                  }
                >
                  <Text
                    style={
                      styles.resultCountText
                    }
                  >
                    {
                      recommendations.length
                    }
                  </Text>
                </View>
              ) : null}
            </View>

            {/* =========================================
                LOADING
                ========================================= */}

            {loading ? (
              <View
                style={
                  styles.loadingCard
                }
              >
                <ActivityIndicator
                  color={
                    COLORS.oxfordBlue
                  }
                />

                <View>
                  <Text
                    style={
                      styles.loadingTitle
                    }
                  >
                    Finding your matches
                  </Text>

                  <Text
                    style={
                      styles.loadingText
                    }
                  >
                    ManeLine is ranking
                    products for your
                    profile.
                  </Text>
                </View>
              </View>
            ) : null}

            {/* =========================================
                ERROR
                ========================================= */}

            {!loading &&
            loadError ? (
              <View
                style={
                  styles.errorCard
                }
              >
                <View
                  style={
                    styles.errorIcon
                  }
                >
                  <Ionicons
                    name="cloud-offline-outline"
                    size={23}
                    color={
                      COLORS.brown
                    }
                  />
                </View>

                <View
                  style={{ flex: 1 }}
                >
                  <Text
                    style={
                      styles.errorTitle
                    }
                  >
                    Recommendations
                    couldn't load
                  </Text>

                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    Check your
                    connection and try
                    again.
                  </Text>

                  <Pressable
                    onPress={
                      loadRecommendations
                    }
                  >
                    <Text
                      style={
                        styles.retryText
                      }
                    >
                      Try again
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </>
        }

        /* =============================================
           EMPTY RESULTS
           ============================================= */

        ListEmptyComponent={
          !loading &&
          !loadError ? (
            <View
              style={
                styles.emptyCard
              }
            >
              <View
                style={
                  styles.emptyIcon
                }
              >
                <Ionicons
                  name="search-outline"
                  size={28}
                  color={
                    COLORS.oxfordBlue
                  }
                />
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No matches found
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Try a different
                search term or browse
                another category.
              </Text>

              {(queryText ||
                selectedCategory !==
                  'All') && (
                <Pressable
                  style={
                    styles.clearFiltersButton
                  }
                  onPress={() => {
                    clearSearch();
                    setSelectedCategory(
                      'All'
                    );
                  }}
                >
                  <Text
                    style={
                      styles.clearFiltersText
                    }
                  >
                    Clear filters
                  </Text>
                </Pressable>
              )}
            </View>
          ) : null
        }
      />

      {/* =================================================
          PRODUCT DETAILS MODAL
          ================================================= */}

      <Modal
        visible={
          !!selectedRecommendation
        }
        animationType="slide"
        transparent
        onRequestClose={() =>
          setSelectedRecommendation(
            null
          )
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

            {selectedRecommendation ? (
              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
              >
                {/* HEADER */}

                <View
                  style={
                    styles.modalHeader
                  }
                >
                  <View
                    style={
                      styles.modalProductVisual
                    }
                  >
                    <Text
                      style={
                        styles.modalEmoji
                      }
                    >
                      {selectedRecommendation
                        .product
                        .imageEmoji ??
                        '🧴'}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      setSelectedRecommendation(
                        null
                      )
                    }
                    hitSlop={10}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={
                        COLORS.oxfordBlue
                      }
                    />
                  </Pressable>
                </View>

                {/* PRODUCT */}

                <Text
                  style={
                    styles.modalBrand
                  }
                >
                  {
                    selectedRecommendation
                      .product.brand
                  }
                </Text>

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  {
                    selectedRecommendation
                      .product.name
                  }
                </Text>

                <Text
                  style={
                    styles.modalCategory
                  }
                >
                  {
                    selectedRecommendation
                      .product.category
                  }
                </Text>

                {/* SCORE */}

                <View
                  style={
                    styles.modalScore
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.modalScoreEyebrow
                      }
                    >
                      YOUR MATCH
                    </Text>

                    <Text
                      style={
                        styles.modalScoreLabel
                      }
                    >
                      {
                        selectedRecommendation
                          .compatibility
                          .label
                      }
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.modalScoreText
                    }
                  >
                    {
                      selectedRecommendation
                        .compatibility
                        .score
                    }
                    %
                  </Text>
                </View>

                {/* DESCRIPTION */}

                {selectedRecommendation
                  .product
                  .description ? (
                  <>
                    <Text
                      style={
                        styles.modalSectionTitle
                      }
                    >
                      About this product
                    </Text>

                    <Text
                      style={
                        styles.modalBodyText
                      }
                    >
                      {
                        selectedRecommendation
                          .product
                          .description
                      }
                    </Text>
                  </>
                ) : null}

                {/* MATCH */}

                {selectedRecommendation
                  .compatibility
                  .reasons.length >
                0 ? (
                  <>
                    <Text
                      style={
                        styles.modalSectionTitle
                      }
                    >
                      Why it matches
                    </Text>

                    {selectedRecommendation.compatibility.reasons.map(
                      (
                        reason,
                        index
                      ) => (
                        <View
                          key={`${reason}-${index}`}
                          style={
                            styles.bulletRow
                          }
                        >
                          <View
                            style={
                              styles.goodBullet
                            }
                          />

                          <Text
                            style={
                              styles.bulletText
                            }
                          >
                            {reason}
                          </Text>
                        </View>
                      )
                    )}
                  </>
                ) : null}

                {/* CAUTIONS */}

                {selectedRecommendation
                  .compatibility
                  .cautions.length >
                0 ? (
                  <>
                    <Text
                      style={
                        styles.modalSectionTitle
                      }
                    >
                      What to watch
                    </Text>

                    {selectedRecommendation.compatibility.cautions.map(
                      (
                        caution,
                        index
                      ) => (
                        <View
                          key={`${caution}-${index}`}
                          style={
                            styles.bulletRow
                          }
                        >
                          <Ionicons
                            name="alert-circle-outline"
                            size={16}
                            color={
                              COLORS.brown
                            }
                          />

                          <Text
                            style={
                              styles.bulletText
                            }
                          >
                            {caution}
                          </Text>
                        </View>
                      )
                    )}
                  </>
                ) : null}

                {/* ROUTINE FIT */}

                <Text
                  style={
                    styles.modalSectionTitle
                  }
                >
                  Routine fit
                </Text>

                <Text
                  style={
                    styles.modalBodyText
                  }
                >
                  {
                    selectedRecommendation
                      .compatibility
                      .routineFit
                  }
                </Text>

                {/* TAGS */}

                {selectedRecommendation
                  .product.tags
                  ?.length ? (
                  <View
                    style={
                      styles.modalTags
                    }
                  >
                    {selectedRecommendation
                      .product.tags
                      .slice(0, 5)
                      .map((tag) => (
                        <View
                          key={tag}
                          style={
                            styles.modalTag
                          }
                        >
                          <Text
                            style={
                              styles.modalTagText
                            }
                          >
                            {tag}
                          </Text>
                        </View>
                      ))}
                  </View>
                ) : null}

                {/* EXTERNAL PRODUCT */}

                {selectedRecommendation
                  .product
                  .buyUrl ? (
                  <Pressable
                    style={
                      styles.viewProductButton
                    }
                    onPress={() =>
                      openProductLink(
                        selectedRecommendation
                          .product
                          .buyUrl
                      )
                    }
                  >
                    <Text
                      style={
                        styles.viewProductButtonText
                      }
                    >
                      View product
                    </Text>

                    <Ionicons
                      name="open-outline"
                      size={17}
                      color={
                        COLORS.white
                      }
                    />
                  </Pressable>
                ) : null}

                <Pressable
                  style={
                    styles.closeModalButton
                  }
                  onPress={() =>
                    setSelectedRecommendation(
                      null
                    )
                  }
                >
                  <Text
                    style={
                      styles.closeModalText
                    }
                  >
                    Keep browsing
                  </Text>
                </Pressable>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
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

    listContent: {
      paddingHorizontal: 20,
    },

    /* =====================================================
       HEADER
       ===================================================== */

    header: {
      marginBottom: 18,
    },

    eyebrow: {
      fontSize: 11,
      fontWeight: '900',
      color: COLORS.green,
      letterSpacing: 1.2,
    },

    title: {
      marginTop: 5,
      fontSize: 31,
      lineHeight: 36,
      fontWeight: '900',
      letterSpacing: -0.8,
      color: COLORS.oxfordBlue,
    },

    subtitle: {
      marginTop: 7,
      maxWidth: 340,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600',
      color: COLORS.mutedText,
    },

    /* =====================================================
       PERSONALIZATION
       ===================================================== */

    personalizedCard: {
      minHeight: 82,
      marginBottom: 14,
      padding: 14,

      borderRadius: 22,

      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,

      backgroundColor:
        COLORS.lemonCream,
    },

    personalizedIcon: {
      width: 45,
      height: 45,

      borderRadius: 15,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor:
        COLORS.lightBlue,
    },

    personalizedEyebrow: {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.8,
      color: COLORS.green,
    },

    personalizedTitle: {
      marginTop: 3,
      fontSize: 14,
      fontWeight: '900',
      color: COLORS.oxfordBlue,
    },

    personalizedText: {
      marginTop: 3,
      fontSize: 11,
      color: COLORS.brown,
    },

    /* =====================================================
       SEARCH
       ===================================================== */

    searchBox: {
      minHeight: 52,

      paddingHorizontal: 14,

      borderRadius: 18,

      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,
      borderColor:
        COLORS.lightBorder,
    },

    searchInput: {
      flex: 1,

      fontSize: 14,

      color:
        COLORS.oxfordBlue,
    },

    /* =====================================================
       CATEGORIES
       ===================================================== */

    browseHeading: {
      marginTop: 19,
    },

    browseTitle: {
      fontSize: 14,
      fontWeight: '900',
      color: COLORS.oxfordBlue,
    },

    categoryRow: {
      paddingTop: 10,
      paddingBottom: 23,
      paddingRight: 20,
      gap: 8,
    },

    categoryChip: {
      paddingHorizontal: 13,
      paddingVertical: 9,

      borderRadius: 999,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,
      borderColor:
        COLORS.lightBorder,
    },

    categoryChipActive: {
      backgroundColor:
        COLORS.oxfordBlue,

      borderColor:
        COLORS.oxfordBlue,
    },

    categoryChipText: {
      fontSize: 12,
      fontWeight: '800',

      color:
        COLORS.oxfordBlue,
    },

    categoryChipTextActive: {
      color: COLORS.white,
    },

    /* =====================================================
       RESULTS HEADER
       ===================================================== */

    sectionHeader: {
      marginBottom: 13,

      flexDirection: 'row',

      alignItems: 'flex-end',
      justifyContent:
        'space-between',

      gap: 12,
    },

    sectionKicker: {
      marginBottom: 3,

      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.9,

      color: COLORS.green,
    },

    sectionTitle: {
      fontSize: 22,
      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    sectionSubtitle: {
      marginTop: 3,

      fontSize: 12,

      color:
        COLORS.mutedText,
    },

    resultCount: {
      minWidth: 34,
      height: 34,

      paddingHorizontal: 8,

      borderRadius: 12,

      backgroundColor:
        COLORS.lightBlue,

      alignItems: 'center',
      justifyContent: 'center',
    },

    resultCountText: {
      fontSize: 12,
      fontWeight: '900',
      color: COLORS.oxfordBlue,
    },

    /* =====================================================
       LOADING
       ===================================================== */

    loadingCard: {
      minHeight: 82,

      marginBottom: 14,
      paddingHorizontal: 18,

      borderRadius: 22,

      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,
      borderColor:
        COLORS.lightBorder,
    },

    loadingTitle: {
      fontSize: 14,
      fontWeight: '900',
      color: COLORS.oxfordBlue,
    },

    loadingText: {
      marginTop: 2,
      fontSize: 11,
      color: COLORS.mutedText,
    },

    /* =====================================================
       PRODUCT CARD
       ===================================================== */

    productCard: {
      marginBottom: 12,
      padding: 15,

      borderRadius: 23,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,
      borderColor:
        COLORS.lightBorder,
    },

    productCardPressed: {
      opacity: 0.9,
      transform: [
        {
          scale: 0.995,
        },
      ],
    },

    productTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
    },

    productVisual: {
      width: 59,
      height: 70,

      borderRadius: 18,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor:
        COLORS.lemonCream,
    },

    productEmojiText: {
      fontSize: 29,
    },

    productInfo: {
      flex: 1,
      minWidth: 0,
    },

    brand: {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.7,
      textTransform: 'uppercase',

      color: COLORS.green,
    },

    productName: {
      marginTop: 3,

      fontSize: 16,
      lineHeight: 20,
      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    category: {
      marginTop: 3,

      fontSize: 11,

      color:
        COLORS.mutedText,
    },

    scorePill: {
      minWidth: 57,

      paddingHorizontal: 8,
      paddingVertical: 8,

      borderRadius: 15,

      alignItems: 'center',
    },

    scorePillStrong: {
      backgroundColor:
        COLORS.softGreen,
    },

    scorePillNormal: {
      backgroundColor:
        COLORS.softBlue,
    },

    scoreText: {
      fontSize: 13,
      fontWeight: '900',
    },

    scoreLabel: {
      marginTop: 1,
      fontSize: 8,
      fontWeight: '800',
    },

    scoreTextStrong: {
      color: COLORS.green,
    },

    scoreTextNormal: {
      color:
        COLORS.oxfordBlue,
    },

    description: {
      marginTop: 12,

      fontSize: 12,
      lineHeight: 18,

      color:
        COLORS.mutedText,
    },

    /* =====================================================
       MATCH REASON
       ===================================================== */

    reasonBox: {
      marginTop: 12,

      padding: 12,

      borderRadius: 16,

      backgroundColor:
        '#F8F7EE',
    },

    reasonTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    reasonTitle: {
      fontSize: 12,
      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    reasonText: {
      marginTop: 5,

      fontSize: 11,
      lineHeight: 17,

      color:
        COLORS.mutedText,
    },

    /* =====================================================
       TAGS
       ===================================================== */

    tagRow: {
      marginTop: 11,

      flexDirection: 'row',
      flexWrap: 'wrap',

      gap: 6,
    },

    tag: {
      paddingHorizontal: 9,
      paddingVertical: 5,

      borderRadius: 999,

      backgroundColor:
        COLORS.lemonCream,
    },

    tagText: {
      fontSize: 10,
      fontWeight: '800',

      color:
        COLORS.brown,
    },

    /* =====================================================
       DETAILS
       ===================================================== */

    detailsRow: {
      marginTop: 13,

      paddingTop: 11,

      borderTopWidth: 1,
      borderTopColor:
        '#EFECDF',

      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    detailsText: {
      fontSize: 11,
      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    /* =====================================================
       EMPTY
       ===================================================== */

    emptyCard: {
      padding: 25,

      borderRadius: 24,

      alignItems: 'center',

      backgroundColor:
        COLORS.white,

      borderWidth: 1,
      borderColor:
        COLORS.lightBorder,
    },

    emptyIcon: {
      width: 58,
      height: 58,

      borderRadius: 19,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor:
        COLORS.lightBlue,
    },

    emptyTitle: {
      marginTop: 12,

      fontSize: 18,
      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    emptyText: {
      marginTop: 6,

      maxWidth: 260,

      fontSize: 12,
      lineHeight: 18,

      textAlign: 'center',

      color:
        COLORS.mutedText,
    },

    clearFiltersButton: {
      marginTop: 15,

      paddingHorizontal: 16,
      paddingVertical: 10,

      borderRadius: 999,

      backgroundColor:
        COLORS.oxfordBlue,
    },

    clearFiltersText: {
      fontSize: 12,
      fontWeight: '900',

      color:
        COLORS.white,
    },

    /* =====================================================
       ERROR
       ===================================================== */

    errorCard: {
      marginBottom: 14,
      padding: 16,

      borderRadius: 22,

      flexDirection: 'row',
      gap: 12,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,
      borderColor:
        COLORS.lightBorder,
    },

    errorIcon: {
      width: 43,
      height: 43,

      borderRadius: 14,

      backgroundColor:
        COLORS.lemonCream,

      alignItems: 'center',
      justifyContent: 'center',
    },

    errorTitle: {
      fontSize: 14,
      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    errorText: {
      marginTop: 3,
      fontSize: 11,
      color: COLORS.mutedText,
    },

    retryText: {
      marginTop: 8,

      fontSize: 11,
      fontWeight: '900',

      color: COLORS.green,
    },

    /* =====================================================
       MODAL
       ===================================================== */

    modalOverlay: {
      flex: 1,

      justifyContent:
        'flex-end',

      backgroundColor:
        'rgba(32,49,75,0.46)',
    },

    modalCard: {
      maxHeight: '88%',

      paddingHorizontal: 21,
      paddingBottom: 28,

      borderTopLeftRadius: 31,
      borderTopRightRadius: 31,

      backgroundColor:
        COLORS.background,
    },

    modalHandle: {
      width: 44,
      height: 5,

      marginTop: 10,
      marginBottom: 10,

      alignSelf: 'center',

      borderRadius: 999,

      backgroundColor:
        '#D7D6CC',
    },

    modalHeader: {
      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    modalProductVisual: {
      width: 59,
      height: 59,

      borderRadius: 18,

      backgroundColor:
        COLORS.lemonCream,

      alignItems: 'center',
      justifyContent: 'center',
    },

    modalEmoji: {
      fontSize: 31,
    },

    modalBrand: {
      marginTop: 14,

      fontSize: 10,
      fontWeight: '900',

      textTransform:
        'uppercase',

      letterSpacing: 0.8,

      color: COLORS.green,
    },

    modalTitle: {
      marginTop: 3,

      fontSize: 26,
      lineHeight: 31,
      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    modalCategory: {
      marginTop: 4,

      fontSize: 12,

      color:
        COLORS.mutedText,
    },

    /* =====================================================
       MODAL SCORE
       ===================================================== */

    modalScore: {
      minHeight: 88,

      marginTop: 15,
      padding: 16,

      borderRadius: 21,

      backgroundColor:
        COLORS.oxfordBlue,

      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    modalScoreEyebrow: {
      fontSize: 9,
      fontWeight: '900',

      letterSpacing: 0.8,

      color:
        COLORS.lightBlue,
    },

    modalScoreText: {
      fontSize: 37,
      fontWeight: '900',

      color:
        COLORS.white,
    },

    modalScoreLabel: {
      marginTop: 4,

      fontSize: 14,
      fontWeight: '900',

      color:
        COLORS.lemonCream,
    },

    /* =====================================================
       MODAL BODY
       ===================================================== */

    modalSectionTitle: {
      marginTop: 19,
      marginBottom: 6,

      fontSize: 14,
      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    modalBodyText: {
      fontSize: 13,
      lineHeight: 20,

      color:
        COLORS.mutedText,
    },

    bulletRow: {
      marginBottom: 7,

      flexDirection: 'row',

      alignItems:
        'flex-start',

      gap: 8,
    },

    goodBullet: {
      width: 7,
      height: 7,

      marginTop: 6,

      borderRadius: 4,

      backgroundColor:
        COLORS.green,
    },

    bulletText: {
      flex: 1,

      fontSize: 12,
      lineHeight: 19,

      color:
        COLORS.brown,
    },

    modalTags: {
      marginTop: 17,

      flexDirection: 'row',
      flexWrap: 'wrap',

      gap: 7,
    },

    modalTag: {
      paddingHorizontal: 10,
      paddingVertical: 6,

      borderRadius: 999,

      backgroundColor:
        COLORS.lemonCream,
    },

    modalTagText: {
      fontSize: 10,
      fontWeight: '800',

      color:
        COLORS.brown,
    },

    /* =====================================================
       MODAL BUTTONS
       ===================================================== */

    viewProductButton: {
      marginTop: 22,

      paddingVertical: 15,

      borderRadius: 17,

      backgroundColor:
        COLORS.oxfordBlue,

      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'center',

      gap: 7,
    },

    viewProductButtonText: {
      fontSize: 14,
      fontWeight: '900',

      color:
        COLORS.white,
    },

    closeModalButton: {
      paddingVertical: 15,

      alignItems: 'center',
    },

    closeModalText: {
      fontSize: 12,
      fontWeight: '900',

      color:
        COLORS.green,
    },
  });