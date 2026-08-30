import { Ionicons } from '@expo/vector-icons';
import {router,useFocusEffect,} from 'expo-router';
import {useCallback,useState,} from 'react';
import {ActivityIndicator,Alert,Pressable,ScrollView,StyleSheet,Text,TextInput,View,} from 'react-native';
import {useSafeAreaInsets,} from 'react-native-safe-area-context';
import {generateProductExplanation,} from '../services/aiExplanationService';
import {getOrCreateGuestUser,} from '../services/authService';
import {calculateCompatibility,} from '../services/compatibilityService';
import {clearOcrDraft,loadOcrDraft,} from '../services/ocrDraftService';
import type {OcrIngredientDraft,} from '../services/ocrDraftService';
import { savePendingScanResult,} from '../services/scanResultHandoffService';
import {getOrImportProductByBarcode, saveReviewedOcrProduct,} from '../services/productFirebaseService';
import {getUserHairProfileOrNull,} from '../services/profileFirebaseService';
import { buildScanHistoryItem,  saveScanToFirebaseHistory,} from '../services/scanHistoryFirebaseService';
import type {HairProduct,ProductCategory} from '../types/product.types';
import {COLORS} from '../constants/colors';

export default function ReviewScanScreen() {
  const insets =
    useSafeAreaInsets();

  const [
    draft,
    setDraft,
  ] =
    useState<OcrIngredientDraft | null>(
      null
    );

  const [
    productName,
    setProductName,
  ] =
    useState('');

  const [
    brand,
    setBrand,
  ] =
    useState('');

  const [
    ingredientText,
    setIngredientText,
  ] =
    useState('');

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    analyzing,
    setAnalyzing,
  ] =
    useState(false);

  /* =======================================================
     LOAD OCR RESULT
     ======================================================= */

  useFocusEffect(
    useCallback(() => {
      void loadDraft();
    }, [])
  );

  async function loadDraft() {
    setLoading(true);

    try {
      const saved =
        await loadOcrDraft();

      if (!saved) {
        Alert.alert(
          'No ingredient scan found',
          'Scan the ingredient label again.',
          [
            {
              text: 'Go back',

              onPress: () =>
                router.back(),
            },
          ]
        );

        return;
      }

      setDraft(saved);

      setProductName(
        saved.productName ??
          ''
      );

      setBrand(
        saved.brand ??
          ''
      );

      setIngredientText(
        saved.extractedText ??
          ''
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     ANALYZE
     ======================================================= */

  async function analyzeIngredients() {
    if (!draft) {
      return;
    }

    const ingredients =
      parseIngredientList(
        ingredientText
      );

    if (
      ingredients.length <
      2
    ) {
      Alert.alert(
        'Check the ingredient list',
        'ManeLine needs a readable ingredient list before it can analyze this product.'
      );

      return;
    }

    if (
      !productName.trim()
    ) {
      Alert.alert(
        'Product name needed',
        'Enter the product name before continuing.'
      );

      return;
    }

    setAnalyzing(true);

    try {
      await getOrCreateGuestUser();

      const profile =
        await getUserHairProfileOrNull();

      if (!profile) {
        router.push(
          '/hairProfileSetup' as never
        );

        return;
      }

      /*
       * If ManeLine already identified
       * the barcode, recover that product
       * so we keep its metadata.
       */
      let existingProduct:
        HairProduct | null =
        null;

      if (draft.barcode) {
        existingProduct =
          await getOrImportProductByBarcode(
            draft.barcode
          ).catch(
            () => null
          );
      }

      const product:
        HairProduct =
        existingProduct
          ? {
              ...existingProduct,

              name:
                productName.trim(),

              brand:
                brand.trim() ||
                existingProduct.brand,

              ingredients,
            }
          : {
              id:
                draft.productId ||
                (
                  draft.barcode
                    ? `ocr-${draft.barcode}`
                    : `ocr-${Date.now()}`
                ),

              name:
                productName.trim(),

              brand:
                brand.trim() ||
                'Unknown brand',

              category:
                normalizeCategory(
                  draft.category
                ),

              description:
                'Ingredient list captured from the product label using ManeLine OCR.',

              ingredients,

              bestFor: [],

              tags: [
                'OCR label scan',
              ],

              recommendedForHairTypes:
                [],

              recommendedForPorosity:
                [],

              recommendedForDensity:
                [],

              recommendedForScalp:
                [],

              recommendedForGoals:
                [],

              avoidIf: [],

              cautions: [],

              routineStepMatch:
                [],
            };
const canonicalProduct =
  draft.barcode
    ? await saveReviewedOcrProduct({
        barcode:
          draft.barcode,

        product,

        ingredients,

        ingredientsText:
          ingredientText,
      })
    : product;

      const compatibility =
        calculateCompatibility(
          canonicalProduct,
          profile
        );

      const explanation =
        await generateProductExplanation({
          product: canonicalProduct,
          profile,
          compatibility,
        });

      const scanItem =
        buildScanHistoryItem({
          productId:
            canonicalProduct.id,

          productName:
            canonicalProduct.name,

          brand:
            canonicalProduct.brand,

          barcode:
            draft.barcode,

          ingredients: 
            canonicalProduct.ingredients,

          compatibility,

          aiExplanation:
            explanation,
        });

    await saveScanToFirebaseHistory(
  scanItem
);

await savePendingScanResult({
  item:
    scanItem,

  product:
    canonicalProduct,
});

await clearOcrDraft();

router.replace(
  '/(tabs)/scan' as never
);
    } catch (error) {
      console.warn(
        '[ManeLine OCR] Could not analyze OCR ingredients:',
        error
      );

      Alert.alert(
        'Analysis failed',
        'ManeLine read the ingredient label but could not finish the product analysis. Please try again.'
      );
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <View
        style={
          styles.centered
        }
      >
        <ActivityIndicator
          color={
            COLORS.oxfordBlue
          }
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading ingredient
          scan...
        </Text>
      </View>
    );
  }

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
              insets.top + 16,

            paddingBottom:
              Math.max(
                insets.bottom +
                  30,
                50
              ),
          },
        ]}
      >
        {/* HEADER */}

        <View
          style={
            styles.header
          }
        >
          <Pressable
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="chevron-back"
              size={21}
              color={
                COLORS.oxfordBlue
              }
            />
          </Pressable>

          <View
            style={{ flex: 1 }}
          >
            <Text
              style={
                styles.eyebrow
              }
            >
              REVIEW SCAN
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Check what ManeLine
              read.
            </Text>
          </View>
        </View>

        <View
          style={
            styles.infoCard
          }
        >
          <Ionicons
            name="information-circle-outline"
            size={21}
            color={
              COLORS.oxfordBlue
            }
          />

          <Text
            style={
              styles.infoText
            }
          >
            OCR can misread small
            print. Correct anything
            that looks wrong before
            analyzing the product.
          </Text>
        </View>

        {/* PRODUCT NAME */}

        <Text
          style={
            styles.inputLabel
          }
        >
          Product name
        </Text>

        <TextInput
          value={
            productName
          }
          onChangeText={
            setProductName
          }
          placeholder="Enter product name"
          placeholderTextColor="#9CA3AF"
          style={
            styles.input
          }
        />

        {/* BRAND */}

        <Text
          style={
            styles.inputLabel
          }
        >
          Brand
        </Text>

        <TextInput
          value={brand}
          onChangeText={
            setBrand
          }
          placeholder="Enter brand"
          placeholderTextColor="#9CA3AF"
          style={
            styles.input
          }
        />

        {/* INGREDIENTS */}

        <View
          style={
            styles.ingredientHeader
          }
        >
          <Text
            style={
              styles.inputLabel
            }
          >
            Ingredients
          </Text>

          <View
            style={
              styles.sourceBadge
            }
          >
            <Ionicons
              name="camera-outline"
              size={13}
              color={
                COLORS.green
              }
            />

            <Text
              style={
                styles.sourceBadgeText
              }
            >
              Label OCR
            </Text>
          </View>
        </View>

        <TextInput
          value={
            ingredientText
          }
          onChangeText={
            setIngredientText
          }
          multiline
          textAlignVertical="top"
          placeholder="Ingredient text will appear here."
          placeholderTextColor="#9CA3AF"
          style={[
            styles.input,
            styles.ingredientInput,
          ]}
        />

        <Text
          style={
            styles.helperText
          }
        >
          Keep ingredients in the
          same order shown on the
          product label.
        </Text>

        {/* RETAKE */}

        <Pressable
          style={
            styles.retakeButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="camera-outline"
            size={17}
            color={
              COLORS.oxfordBlue
            }
          />

          <Text
            style={
              styles.retakeText
            }
          >
            Retake ingredient
            photo
          </Text>
        </Pressable>

        {/* ANALYZE */}

        <Pressable
          style={[
            styles.analyzeButton,

            analyzing &&
              styles.analyzeButtonDisabled,
          ]}
          disabled={
            analyzing
          }
          onPress={
            analyzeIngredients
          }
        >
          {analyzing ? (
            <ActivityIndicator
              color={
                COLORS.white
              }
            />
          ) : (
            <>
              <Ionicons
                name="sparkles-outline"
                size={18}
                color={
                  COLORS.white
                }
              />

              <Text
                style={
                  styles.analyzeButtonText
                }
              >
                Analyze product
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

/* =========================================================
   INGREDIENT PARSING
   ========================================================= */

function parseIngredientList(
  text: string
) {
  /*
   * Ingredient panels generally use
   * commas. OCR frequently inserts
   * line breaks in the middle of the
   * same list, so turn line breaks
   * into spaces first.
   */
  const cleaned =
    text
      .replace(
        /^\s*ingredients?\s*[:\-]?\s*/i,
        ''
      )
      .replace(/\r/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  return cleaned
    .split(
      /[,;•]+/
    )
    .map(
      (ingredient) =>
        ingredient.trim()
    )
    .filter(
      (ingredient) =>
        ingredient.length >
        1
    );
}

function normalizeCategory(
  value?: string
): ProductCategory {
  const categories:
    ProductCategory[] = [
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

  if (
    value &&
    categories.includes(
      value as ProductCategory
    )
  ) {
    return value as ProductCategory;
  }

  /*
   * Temporary neutral fallback.
   * Later the product-category
   * classifier can determine this.
   */
  return 'Treatment';
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    centered: {
      flex: 1,

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 10,

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

    header: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 12,

      marginBottom: 17,
    },

    backButton: {
      width: 42,

      height: 42,

      borderRadius: 14,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.lemonCream,
    },

    eyebrow: {
      fontSize: 10,

      fontWeight: '900',

      letterSpacing: 1,

      color:
        COLORS.green,
    },

    title: {
      marginTop: 3,

      fontSize: 24,

      lineHeight: 28,

      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    infoCard: {
      padding: 13,

      borderRadius: 17,

      flexDirection: 'row',

      alignItems:
        'flex-start',

      gap: 9,

      backgroundColor:
        COLORS.lightBlue,
    },

    infoText: {
      flex: 1,

      fontSize: 11,

      lineHeight: 17,

      color:
        COLORS.oxfordBlue,
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

      fontSize: 13,

      color:
        COLORS.oxfordBlue,
    },

    ingredientHeader: {
      flexDirection: 'row',

      alignItems:
        'flex-end',

      justifyContent:
        'space-between',
    },

    sourceBadge: {
      marginBottom: 6,

      paddingHorizontal: 8,

      paddingVertical: 5,

      borderRadius: 999,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 4,

      backgroundColor:
        COLORS.lemonCream,
    },

    sourceBadgeText: {
      fontSize: 9,

      fontWeight: '900',

      color:
        COLORS.green,
    },

    ingredientInput: {
      minHeight: 220,

      lineHeight: 19,
    },

    helperText: {
      marginTop: 6,

      fontSize: 10,

      lineHeight: 15,

      color:
        COLORS.mutedText,
    },

    retakeButton: {
      marginTop: 16,

      minHeight: 45,

      borderRadius: 14,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 7,

      borderWidth: 1,

      borderColor:
        COLORS.lightBorder,

      backgroundColor:
        COLORS.white,
    },

    retakeText: {
      fontSize: 11,

      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    analyzeButton: {
      marginTop: 12,

      minHeight: 53,

      borderRadius: 17,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 8,

      backgroundColor:
        COLORS.oxfordBlue,
    },

    analyzeButtonDisabled: {
      opacity: 0.55,
    },

    analyzeButtonText: {
      fontSize: 13,

      fontWeight: '900',

      color:
        COLORS.white,
    },
  });