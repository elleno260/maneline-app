import { Ionicons } from '@expo/vector-icons';
import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';

import { router, useFocusEffect } from 'expo-router';
import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { generateProductExplanation } from '../../services/aiExplanationService';
import { getOrCreateGuestUser } from '../../services/authService';
import { calculateCompatibility } from '../../services/compatibilityService';
import { getOrImportProductByBarcode } from '../../services/productFirebaseService';
import { getUserHairProfileOrNull } from '../../services/profileFirebaseService';

import {
  buildScanHistoryItem,
  getScanHistoryFromFirebase,
  saveScanToFirebaseHistory,
} from '../../services/scanHistoryFirebaseService';

import type { ScanHistoryItem } from '../../services/scanHistoryFirebaseService';
import type { HairProduct } from '../../types/product.types';


/* =========================================================
   MANELINE BRAND COLORS
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

  warning: '#A4563D',
  warningBackground: '#FFF0EB',
};


/* =========================================================
   TYPES
   ========================================================= */

type ScanView = 'scan' | 'recent';


/* =========================================================
   SCREEN
   ========================================================= */

export default function ScanScreen() {
  const insets = useSafeAreaInsets();

  const [permission, requestPermission] =
    useCameraPermissions();

  const [activeView, setActiveView] =
    useState<ScanView>('scan');

  const [scanned, setScanned] =
    useState(false);

  const [lookingUp, setLookingUp] =
    useState(false);

  const [
    notFoundBarcode,
    setNotFoundBarcode,
  ] = useState<string | null>(null);

  const [
    latestScan,
    setLatestScan,
  ] = useState<{
    item: ScanHistoryItem;
    product: HairProduct;
  } | null>(null);


  /* =======================================================
     HISTORY STATE
     ======================================================= */

  const [
    recentScans,
    setRecentScans,
  ] = useState<ScanHistoryItem[]>([]);

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

  const [
    historyError,
    setHistoryError,
  ] = useState(false);

  const [
    expandedScanId,
    setExpandedScanId,
  ] = useState<string | null>(null);


  /* =======================================================
     LOAD HISTORY WHEN SCREEN IS FOCUSED
     ======================================================= */

  useFocusEffect(
    useCallback(() => {
      loadRecentScans();
    }, [])
  );


  async function loadRecentScans() {
    try {
      setHistoryLoading(true);
      setHistoryError(false);

      /*
       * Makes sure the anonymous Firebase user exists
       * before reading their history.
       */
      await getOrCreateGuestUser();

      const history =
        await getScanHistoryFromFirebase();

      /*
       * PRD:
       * Surface roughly 10–15 recent scans.
       *
       * We are starting with 10.
       */
      setRecentScans(history.slice(0, 10));
    } catch (error) {
      console.warn(
        '[ManeLine history] Could not load history:',
        error
      );

      setHistoryError(true);
    } finally {
      setHistoryLoading(false);
    }
  }


  /* =======================================================
     BARCODE SCAN
     ======================================================= */

  async function handleBarcodeScanned(
    result: BarcodeScanningResult
  ) {
    if (scanned || lookingUp) return;

    const barcode = result.data?.trim();

    if (!barcode) {
      Alert.alert(
        'Barcode not read',
        'ManeLine could not read that barcode. Please try again.'
      );

      return;
    }

    setScanned(true);
    setLookingUp(true);

    setNotFoundBarcode(null);
    setLatestScan(null);

    try {
      /*
       * Make sure a Firebase guest user exists.
       */
      await getOrCreateGuestUser();

      /*
       * Get the hair profile that compatibility
       * will be calculated against.
       */
      const profile =
        await getUserHairProfileOrNull();

      if (!profile) {
        setScanned(false);

        router.push(
          '/hairProfileSetup' as never
        );

        return;
      }

      /*
       * Your existing product lookup pipeline.
       *
       * This service handles the fallback logic
       * rather than putting the lookup chain
       * inside the UI.
       */
      const product =
        await getOrImportProductByBarcode(
          barcode
        );


      /* ---------------------------------------------------
         PRODUCT COULD NOT BE IDENTIFIED
         --------------------------------------------------- */

      if (!product) {
        setNotFoundBarcode(barcode);

        return;
      }


      /* ---------------------------------------------------
         PRODUCT FOUND, BUT INGREDIENTS MISSING
         --------------------------------------------------- */

      if (!product.ingredients?.length) {
        Alert.alert(
          'Ingredients needed',
          `${product.name} was identified, but ManeLine could not verify its ingredient list online.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setScanned(false);
              },
            },
            {
              text: 'Scan ingredient label',
              onPress: () => {
                setScanned(false);

                router.push({
                  pathname:
                    '/review-scan',
                  params: {
                    barcode,
                    scanMode:
                      'ingredients',
                  },
                });
              },
            },
          ]
        );

        return;
      }


      /* ---------------------------------------------------
         CALCULATE HAIR COMPATIBILITY
         --------------------------------------------------- */

      const compatibility =
        calculateCompatibility(
          product,
          profile
        );


      /* ---------------------------------------------------
         GEMINI / AI EXPLANATION
         --------------------------------------------------- */

      const explanation =
        await generateProductExplanation({
          product,
          profile,
          compatibility,
        });


      /* ---------------------------------------------------
         CREATE HISTORY ITEM
         --------------------------------------------------- */

      const scanItem =
        buildScanHistoryItem({
          productId:
            product.id,

          productName:
            product.name,

          brand:
            product.brand,

          barcode,

          ingredients:
            product.ingredients,

          compatibility,

          aiExplanation:
            explanation,
        });


      /* ---------------------------------------------------
         SAVE TO FIREBASE
         --------------------------------------------------- */

      await saveScanToFirebaseHistory(
        scanItem
      );


      /*
       * Immediately add the new result to the
       * recent scans list.
       *
       * No need to make the user refresh.
       */
      setRecentScans((previous) => {
        const withoutDuplicate =
          previous.filter(
            (item) =>
              item.id !== scanItem.id
          );

        return [
          scanItem,
          ...withoutDuplicate,
        ].slice(0, 10);
      });


      /* ---------------------------------------------------
         DISPLAY RESULT
         --------------------------------------------------- */

      setLatestScan({
        item: scanItem,
        product,
      });

    } catch (error) {
      console.warn(
        '[ManeLine scan] Scan failed:',
        error
      );

      Alert.alert(
        'Scan failed',
        'ManeLine could not finish this scan. Please check your connection and try again.'
      );

      setScanned(false);

    } finally {
      setLookingUp(false);
    }
  }


  /* =======================================================
     RESET SCANNER
     ======================================================= */

  function resetScanner() {
    setScanned(false);
    setNotFoundBarcode(null);
    setLatestScan(null);
  }


  /* =======================================================
     OPEN RECENT SCANS
     ======================================================= */

  function openRecentScans() {
    resetScanner();

    setExpandedScanId(null);
    setActiveView('recent');

    loadRecentScans();
  }


  /* =======================================================
     SWITCH BACK TO SCAN
     ======================================================= */

  function openScanner() {
    setExpandedScanId(null);
    setActiveView('scan');

    resetScanner();
  }


  /* =======================================================
     EXPAND / COLLAPSE HISTORY CARD
     ======================================================= */

  function toggleHistoryCard(
    id: string
  ) {
    setExpandedScanId(
      (current) =>
        current === id
          ? null
          : id
    );
  }


  /* =======================================================
     MAIN SCREEN
     ======================================================= */

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop:
              insets.top + 18,

            paddingBottom:
              140,
          },
        ]}
      >

        {/* ===============================================
            PAGE HEADER
            =============================================== */}

        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            MANELINE
          </Text>

          <Text style={styles.title}>
            Scan & analyze
          </Text>

          <Text style={styles.subtitle}>
            Scan a hair product to understand
            its ingredients and see how well it
            matches your hair.
          </Text>
        </View>


        {/* ===============================================
            SCAN / RECENT SEGMENT CONTROL
            =============================================== */}

        <View style={styles.segmentControl}>

          <Pressable
            style={[
              styles.segmentButton,

              activeView === 'scan' &&
                styles.segmentButtonActive,
            ]}
            onPress={openScanner}
          >
            <Ionicons
              name="scan-outline"
              size={18}
              color={
                activeView === 'scan'
                  ? COLORS.white
                  : COLORS.oxfordBlue
              }
            />

            <Text
              style={[
                styles.segmentText,

                activeView === 'scan' &&
                  styles.segmentTextActive,
              ]}
            >
              Scan
            </Text>
          </Pressable>


          <Pressable
            style={[
              styles.segmentButton,

              activeView === 'recent' &&
                styles.segmentButtonActive,
            ]}
            onPress={openRecentScans}
          >
            <Ionicons
              name="time-outline"
              size={18}
              color={
                activeView === 'recent'
                  ? COLORS.white
                  : COLORS.oxfordBlue
              }
            />

            <Text
              style={[
                styles.segmentText,

                activeView === 'recent' &&
                  styles.segmentTextActive,
              ]}
            >
              Recent scans
            </Text>
          </Pressable>

        </View>


        {/* ===============================================
            SCANNER
            =============================================== */}

        {activeView === 'scan' ? (
          <View>

            {/* -------------------------------------------
                CAMERA PERMISSION LOADING
                ------------------------------------------- */}

            {!permission ? (
              <View style={styles.cameraLoadingCard}>
                <ActivityIndicator
                  color={COLORS.oxfordBlue}
                />

                <Text style={styles.loadingLabel}>
                  Getting camera ready...
                </Text>
              </View>
            ) : null}


            {/* -------------------------------------------
                CAMERA PERMISSION NOT GRANTED
                ------------------------------------------- */}

            {permission &&
            !permission.granted ? (
              <View style={styles.permissionCard}>

                <View
                  style={
                    styles.permissionIcon
                  }
                >
                  <Ionicons
                    name="camera-outline"
                    size={30}
                    color={
                      COLORS.oxfordBlue
                    }
                  />
                </View>

                <Text
                  style={
                    styles.permissionTitle
                  }
                >
                  Camera access needed
                </Text>

                <Text
                  style={
                    styles.permissionText
                  }
                >
                  ManeLine needs access to
                  your camera to scan product
                  barcodes.
                </Text>

                <Pressable
                  style={
                    styles.primaryButton
                  }
                  onPress={
                    requestPermission
                  }
                >
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Allow camera access
                  </Text>
                </Pressable>

                <Pressable
                  style={
                    styles.viewRecentLink
                  }
                  onPress={
                    openRecentScans
                  }
                >
                  <Text
                    style={
                      styles.viewRecentText
                    }
                  >
                    View recent scans instead
                  </Text>
                </Pressable>

              </View>
            ) : null}


            {/* -------------------------------------------
                CAMERA
                ------------------------------------------- */}

            {permission?.granted ? (
              <>
                <View
                  style={
                    styles.cameraWrap
                  }
                >
                  <CameraView
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={
                      scanned
                        ? undefined
                        : handleBarcodeScanned
                    }
                    barcodeScannerSettings={{
                      barcodeTypes: [
                        'ean13',
                        'ean8',
                        'upc_a',
                        'upc_e',
                        'code128',
                        'code39',
                        'qr',
                      ],
                    }}
                  />


                  {/* SCAN FRAME */}

                  <View
                    style={
                      styles.scanFrame
                    }
                  >
                    <View
                      style={
                        styles.cornerTopLeft
                      }
                    />

                    <View
                      style={
                        styles.cornerTopRight
                      }
                    />

                    <View
                      style={
                        styles.cornerBottomLeft
                      }
                    />

                    <View
                      style={
                        styles.cornerBottomRight
                      }
                    />
                  </View>


                  {/* LOOKUP OVERLAY */}

                  {lookingUp ? (
                    <View
                      style={
                        styles.lookupOverlay
                      }
                    >
                      <ActivityIndicator
                        color={
                          COLORS.white
                        }
                      />

                      <View>
                        <Text
                          style={
                            styles.lookupText
                          }
                        >
                          Analyzing product...
                        </Text>

                        <Text
                          style={
                            styles.lookupSubtext
                          }
                        >
                          Looking up ingredients
                          and checking your match.
                        </Text>
                      </View>
                    </View>
                  ) : null}

                </View>


                <View style={styles.scanTip}>
                  <Ionicons
                    name="barcode-outline"
                    size={18}
                    color={
                      COLORS.oxfordBlue
                    }
                  />

                  <Text
                    style={
                      styles.scanHelp
                    }
                  >
                    Hold the barcode inside
                    the frame and keep your
                    camera steady.
                  </Text>
                </View>
              </>
            ) : null}


            {/* -------------------------------------------
                PRODUCT NOT FOUND
                ------------------------------------------- */}

            {notFoundBarcode ? (
              <View
                style={
                  styles.notFoundCard
                }
              >
                <View
                  style={
                    styles.notFoundIcon
                  }
                >
                  <Ionicons
                    name="search-outline"
                    size={24}
                    color={
                      COLORS.warning
                    }
                  />
                </View>

                <Text
                  style={
                    styles.notFoundTitle
                  }
                >
                  We couldn't identify this product
                </Text>

                <Text
                  style={
                    styles.notFoundText
                  }
                >
                  Barcode {notFoundBarcode}
                  {' '}wasn't found in ManeLine's
                  current product sources.
                </Text>


                <Pressable
                  style={
                    styles.ingredientButton
                  }
                  onPress={() => {
                    const barcode =
                      notFoundBarcode;

                    resetScanner();

                    router.push({
                      pathname:
                        '/review-scan',

                      params: {
                        barcode,
                        scanMode:
                          'ingredients',
                      },
                    });
                  }}
                >
                  <Ionicons
                    name="camera-outline"
                    size={18}
                    color={
                      COLORS.white
                    }
                  />

                  <Text
                    style={
                      styles.ingredientButtonText
                    }
                  >
                    Scan ingredient label
                  </Text>
                </Pressable>


                <Pressable
                  style={
                    styles.tryAgainButton
                  }
                  onPress={
                    resetScanner
                  }
                >
                  <Text
                    style={
                      styles.tryAgainButtonText
                    }
                  >
                    Try barcode again
                  </Text>
                </Pressable>

              </View>
            ) : null}


            {/* -------------------------------------------
                GENERIC SCAN AGAIN BUTTON
                ------------------------------------------- */}

            {scanned &&
            !lookingUp &&
            !notFoundBarcode &&
            !latestScan ? (
              <Pressable
                style={
                  styles.secondaryButton
                }
                onPress={
                  resetScanner
                }
              >
                <Text
                  style={
                    styles.secondaryButtonText
                  }
                >
                  Scan again
                </Text>
              </Pressable>
            ) : null}

          </View>
        ) : null}


        {/* ===============================================
            RECENT SCANS
            =============================================== */}

        {activeView === 'recent' ? (
          <View style={styles.recentSection}>

            <View
              style={
                styles.recentHeader
              }
            >
              <View style={{ flex: 1 }}>

                <Text
                  style={
                    styles.recentTitle
                  }
                >
                  Recent scans
                </Text>

                <Text
                  style={
                    styles.recentSubtitle
                  }
                >
                  Your 10 most recently
                  analyzed products.
                </Text>

              </View>


              <Pressable
                style={
                  styles.refreshButton
                }
                onPress={
                  loadRecentScans
                }
                hitSlop={8}
              >
                <Ionicons
                  name="refresh-outline"
                  size={20}
                  color={
                    COLORS.oxfordBlue
                  }
                />
              </Pressable>
            </View>


            {/* HISTORY LOADING */}

            {historyLoading ? (
              <View
                style={
                  styles.historyLoading
                }
              >
                <ActivityIndicator
                  color={
                    COLORS.oxfordBlue
                  }
                />

                <Text
                  style={
                    styles.historyLoadingText
                  }
                >
                  Loading recent scans...
                </Text>
              </View>
            ) : null}


            {/* HISTORY ERROR */}

            {!historyLoading &&
            historyError ? (
              <View
                style={
                  styles.historyMessageCard
                }
              >
                <Ionicons
                  name="cloud-offline-outline"
                  size={25}
                  color={
                    COLORS.brown
                  }
                />

                <Text
                  style={
                    styles.historyMessageTitle
                  }
                >
                  Couldn't load recent scans
                </Text>

                <Text
                  style={
                    styles.historyMessageText
                  }
                >
                  Check your connection and
                  try again.
                </Text>

                <Pressable
                  onPress={
                    loadRecentScans
                  }
                >
                  <Text
                    style={
                      styles.historyRetryText
                    }
                  >
                    Try again
                  </Text>
                </Pressable>
              </View>
            ) : null}


            {/* EMPTY HISTORY */}

            {!historyLoading &&
            !historyError &&
            recentScans.length === 0 ? (
              <View
                style={
                  styles.historyMessageCard
                }
              >
                <View
                  style={
                    styles.emptyHistoryIcon
                  }
                >
                  <Ionicons
                    name="scan-outline"
                    size={28}
                    color={
                      COLORS.oxfordBlue
                    }
                  />
                </View>

                <Text
                  style={
                    styles.historyMessageTitle
                  }
                >
                  No scans yet
                </Text>

                <Text
                  style={
                    styles.historyMessageText
                  }
                >
                  Your product scans will
                  appear here after ManeLine
                  analyzes them.
                </Text>

                <Pressable
                  style={
                    styles.emptyScanButton
                  }
                  onPress={
                    openScanner
                  }
                >
                  <Text
                    style={
                      styles.emptyScanButtonText
                    }
                  >
                    Scan your first product
                  </Text>
                </Pressable>
              </View>
            ) : null}


            {/* HISTORY CARDS */}

            {!historyLoading &&
            !historyError
              ? recentScans.map(
                  (item) => (
                    <HistoryCard
                      key={item.id}
                      item={item}
                      expanded={
                        expandedScanId ===
                        item.id
                      }
                      onPress={() =>
                        toggleHistoryCard(
                          item.id
                        )
                      }
                    />
                  )
                )
              : null}

          </View>
        ) : null}

      </ScrollView>


      {/* =================================================
          NEW SCAN RESULT MODAL
          ================================================= */}

      <Modal
        visible={!!latestScan}
        animationType="slide"
        transparent
        onRequestClose={
          resetScanner
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


            {latestScan ? (
              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
              >

                {/* MODAL HEADER */}

                <View
                  style={
                    styles.modalHeader
                  }
                >
                  <View
                    style={
                      styles.modalProductIcon
                    }
                  >
                    <Text
                      style={
                        styles.modalEmoji
                      }
                    >
                      {latestScan
                        .product
                        .imageEmoji ??
                        '🧴'}
                    </Text>
                  </View>

                  <Pressable
                    onPress={
                      resetScanner
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
                  {latestScan
                    .product
                    .brand ||
                    'Hair product'}
                </Text>

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  {latestScan
                    .product
                    .name}
                </Text>


                {/* SCORE */}

                <View
                  style={
                    styles.modalScoreCard
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
                      {latestScan
                        .item
                        .compatibilityLabel ||
                        'Analyzed'}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.modalScore
                    }
                  >
                    {latestScan
                      .item
                      .compatibilityScore ??
                      '--'}
                    %
                  </Text>
                </View>


                {/* SUMMARY */}

                <Text
                  style={
                    styles.modalSectionTitle
                  }
                >
                  ManeLine says
                </Text>

                <Text
                  style={
                    styles.modalText
                  }
                >
                  {latestScan
                    .item
                    .summary}
                </Text>


                {/* MATCH REASONS */}

                {latestScan
                  .item
                  .matchReasons
                  ?.length ? (
                  <>
                    <Text
                      style={
                        styles.modalSectionTitle
                      }
                    >
                      Why it matched
                    </Text>

                    {latestScan
                      .item
                      .matchReasons
                      .slice(0, 3)
                      .map(
                        (
                          reason,
                          index
                        ) => (
                          <View
                            key={`${reason}-${index}`}
                            style={
                              styles.reasonRow
                            }
                          >
                            <View
                              style={
                                styles.reasonDot
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

                {latestScan
                  .item
                  .cautions
                  ?.length ? (
                  <>
                    <Text
                      style={
                        styles.modalSectionTitle
                      }
                    >
                      What to watch
                    </Text>

                    {latestScan
                      .item
                      .cautions
                      .slice(0, 2)
                      .map(
                        (
                          caution,
                          index
                        ) => (
                          <View
                            key={`${caution}-${index}`}
                            style={
                              styles.cautionRow
                            }
                          >
                            <Ionicons
                              name="alert-circle-outline"
                              size={17}
                              color={
                                COLORS.warning
                              }
                            />

                            <Text
                              style={
                                styles.cautionText
                              }
                            >
                              {caution}
                            </Text>
                          </View>
                        )
                      )}
                  </>
                ) : null}


                {/* RECENT SCANS BUTTON */}

                <Pressable
                  style={
                    styles.recentButton
                  }
                  onPress={
                    openRecentScans
                  }
                >
                  <Text
                    style={
                      styles.recentButtonText
                    }
                  >
                    View recent scans
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={
                      COLORS.white
                    }
                  />
                </Pressable>


                <Pressable
                  style={
                    styles.scanAnotherModalButton
                  }
                  onPress={
                    resetScanner
                  }
                >
                  <Text
                    style={
                      styles.scanAnotherModalText
                    }
                  >
                    Scan another product
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
   HISTORY CARD
   ========================================================= */

function HistoryCard({
  item,
  expanded,
  onPress,
}: {
  item: ScanHistoryItem;
  expanded: boolean;
  onPress: () => void;
}) {

  const score =
    item.compatibilityScore;

  const scoreColor =
    score == null
      ? COLORS.mutedText
      : score >= 80
        ? COLORS.green
        : score >= 60
          ? COLORS.oxfordBlue
          : COLORS.brown;

  const scoreBackground =
    score == null
      ? '#F2F2EE'
      : score >= 80
        ? '#E9EEDC'
        : score >= 60
          ? '#E5EEFF'
          : COLORS.lemonCream;


  return (
    <View
      style={[
        styles.historyCard,

        expanded &&
          styles.historyCardExpanded,
      ]}
    >

      {/* COLLAPSED HEADER */}

      <Pressable
        style={
          styles.historyCardHeader
        }
        onPress={onPress}
      >

        <View
          style={
            styles.historyProductIcon
          }
        >
          <Ionicons
            name="water-outline"
            size={21}
            color={
              COLORS.oxfordBlue
            }
          />
        </View>


        <View
          style={
            styles.historyProductInfo
          }
        >

          <Text
            style={
              styles.historyBrand
            }
            numberOfLines={1}
          >
            {item.brand ||
              'Hair product'}
          </Text>

          <Text
            style={
              styles.historyProductName
            }
            numberOfLines={1}
          >
            {item.productName}
          </Text>

          <Text
            style={
              styles.historyDate
            }
            numberOfLines={1}
          >
            {formatScanDate(
              item.scannedAt
            )}
          </Text>

        </View>


        <View
          style={[
            styles.historyScoreBadge,
            {
              backgroundColor:
                scoreBackground,
            },
          ]}
        >
          <Text
            style={[
              styles.historyScoreText,
              {
                color:
                  scoreColor,
              },
            ]}
          >
            {score ?? '--'}%
          </Text>
        </View>


        <Ionicons
          name={
            expanded
              ? 'chevron-up'
              : 'chevron-down'
          }
          size={19}
          color={
            COLORS.oxfordBlue
          }
        />

      </Pressable>


      {/* EXPANDED INFORMATION */}

      {expanded ? (
        <View
          style={
            styles.expandedContent
          }
        >

          <View
            style={
              styles.expandedDivider
            }
          />


          {item.compatibilityLabel ? (
            <View
              style={
                styles.expandedLabelRow
              }
            >
              <Text
                style={
                  styles.expandedLabel
                }
              >
                Compatibility
              </Text>

              <Text
                style={[
                  styles.expandedValue,
                  {
                    color:
                      scoreColor,
                  },
                ]}
              >
                {
                  item.compatibilityLabel
                }
              </Text>
            </View>
          ) : null}


          <Text
            style={
              styles.expandedSectionTitle
            }
          >
            ManeLine says
          </Text>

          <Text
            style={
              styles.expandedSummary
            }
          >
            {item.summary}
          </Text>


          {item.matchReasons?.length ? (
            <>
              <Text
                style={
                  styles.expandedSectionTitle
                }
              >
                Why it matched
              </Text>

              {item.matchReasons
                .slice(0, 3)
                .map(
                  (
                    reason,
                    index
                  ) => (
                    <View
                      key={`${reason}-${index}`}
                      style={
                        styles.expandedBulletRow
                      }
                    >
                      <View
                        style={
                          styles.goodDot
                        }
                      />

                      <Text
                        style={
                          styles.expandedBulletText
                        }
                      >
                        {reason}
                      </Text>
                    </View>
                  )
                )}
            </>
          ) : null}


          {item.cautions?.length ? (
            <>
              <Text
                style={
                  styles.expandedSectionTitle
                }
              >
                What to watch
              </Text>

              {item.cautions
                .slice(0, 2)
                .map(
                  (
                    caution,
                    index
                  ) => (
                    <View
                      key={`${caution}-${index}`}
                      style={
                        styles.expandedBulletRow
                      }
                    >
                      <Ionicons
                        name="alert-circle-outline"
                        size={16}
                        color={
                          COLORS.warning
                        }
                      />

                      <Text
                        style={
                          styles.expandedBulletText
                        }
                      >
                        {caution}
                      </Text>
                    </View>
                  )
                )}
            </>
          ) : null}


          <View
            style={
              styles.ingredientCountRow
            }
          >
            <Ionicons
              name="flask-outline"
              size={17}
              color={
                COLORS.oxfordBlue
              }
            />

            <Text
              style={
                styles.ingredientCountText
              }
            >
              {
                item.ingredients
                  ?.length || 0
              }{' '}
              ingredients analyzed
            </Text>
          </View>


          {item.barcode ? (
            <Text
              style={
                styles.barcodeText
              }
            >
              Barcode: {item.barcode}
            </Text>
          ) : null}

        </View>
      ) : null}

    </View>
  );
}


/* =========================================================
   DATE FORMATTER
   ========================================================= */

function formatScanDate(
  dateString: string
) {
  const date =
    new Date(dateString);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Recently scanned';
  }

  return `${date.toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
    }
  )} • ${date.toLocaleTimeString(
    undefined,
    {
      hour: 'numeric',
      minute: '2-digit',
    }
  )}`;
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
      paddingHorizontal: 20,
    },


    /* =====================================================
       HEADER
       ===================================================== */

    header: {
      marginBottom: 20,
    },

    eyebrow: {
      fontSize: 11,
      fontWeight: '900',
      color: COLORS.green,
      letterSpacing: 1.2,
    },

    title: {
      marginTop: 5,
      fontSize: 30,
      lineHeight: 35,
      fontWeight: '900',
      color:
        COLORS.oxfordBlue,
      letterSpacing: -0.7,
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
       SEGMENT CONTROL
       ===================================================== */

    segmentControl: {
      padding: 4,
      marginBottom: 18,
      borderRadius: 18,
      backgroundColor:
        COLORS.lemonCream,
      flexDirection: 'row',
    },

    segmentButton: {
      flex: 1,
      minHeight: 44,
      borderRadius: 14,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',

      gap: 7,
    },

    segmentButtonActive: {
      backgroundColor:
        COLORS.oxfordBlue,
    },

    segmentText: {
      fontSize: 13,
      fontWeight: '900',
      color:
        COLORS.oxfordBlue,
    },

    segmentTextActive: {
      color: COLORS.white,
    },


    /* =====================================================
       CAMERA
       ===================================================== */

    cameraLoadingCard: {
      height: 220,
      borderRadius: 26,
      backgroundColor:
        COLORS.lemonCream,

      alignItems: 'center',
      justifyContent: 'center',

      gap: 10,
    },

    loadingLabel: {
      color:
        COLORS.oxfordBlue,
      fontSize: 13,
      fontWeight: '800',
    },

    cameraWrap: {
      height: 350,
      borderRadius: 28,
      overflow: 'hidden',

      backgroundColor:
        COLORS.oxfordBlue,

      position: 'relative',
    },

    camera: {
      flex: 1,
    },


    /* =====================================================
       SCAN FRAME
       ===================================================== */

    scanFrame: {
      position: 'absolute',

      width: 230,
      height: 145,

      left: '50%',
      top: '50%',

      marginLeft: -115,
      marginTop: -72.5,
    },

    cornerTopLeft: {
      position: 'absolute',
      left: 0,
      top: 0,

      width: 42,
      height: 42,

      borderTopWidth: 4,
      borderLeftWidth: 4,

      borderColor:
        COLORS.lemonCream,

      borderTopLeftRadius: 13,
    },

    cornerTopRight: {
      position: 'absolute',
      right: 0,
      top: 0,

      width: 42,
      height: 42,

      borderTopWidth: 4,
      borderRightWidth: 4,

      borderColor:
        COLORS.lemonCream,

      borderTopRightRadius: 13,
    },

    cornerBottomLeft: {
      position: 'absolute',
      left: 0,
      bottom: 0,

      width: 42,
      height: 42,

      borderBottomWidth: 4,
      borderLeftWidth: 4,

      borderColor:
        COLORS.lemonCream,

      borderBottomLeftRadius: 13,
    },

    cornerBottomRight: {
      position: 'absolute',
      right: 0,
      bottom: 0,

      width: 42,
      height: 42,

      borderBottomWidth: 4,
      borderRightWidth: 4,

      borderColor:
        COLORS.lemonCream,

      borderBottomRightRadius: 13,
    },


    /* =====================================================
       LOOKUP
       ===================================================== */

    lookupOverlay: {
      position: 'absolute',

      left: 0,
      right: 0,
      bottom: 0,

      paddingHorizontal: 18,
      paddingVertical: 16,

      backgroundColor:
        'rgba(32,49,75,0.92)',

      flexDirection: 'row',
      alignItems: 'center',

      gap: 12,
    },

    lookupText: {
      fontSize: 14,
      color: COLORS.white,
      fontWeight: '900',
    },

    lookupSubtext: {
      marginTop: 2,
      fontSize: 11,
      color: '#DCE4EF',
      fontWeight: '600',
    },


    /* =====================================================
       SCAN HELP
       ===================================================== */

    scanTip: {
      marginTop: 11,

      flexDirection: 'row',
      alignItems: 'center',

      gap: 8,

      paddingHorizontal: 5,
    },

    scanHelp: {
      flex: 1,

      fontSize: 12,
      lineHeight: 18,

      color:
        COLORS.mutedText,
    },


    /* =====================================================
       PERMISSION
       ===================================================== */

    permissionCard: {
      backgroundColor:
        COLORS.white,

      borderRadius: 26,
      padding: 24,

      alignItems: 'center',

      borderWidth: 1,
      borderColor:
        COLORS.lightBorder,
    },

    permissionIcon: {
      width: 62,
      height: 62,
      borderRadius: 20,

      backgroundColor:
        COLORS.lightBlue,

      alignItems: 'center',
      justifyContent: 'center',
    },

    permissionTitle: {
      marginTop: 15,

      fontSize: 21,
      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    permissionText: {
      marginTop: 7,

      maxWidth: 270,

      fontSize: 14,
      lineHeight: 20,

      color:
        COLORS.mutedText,

      textAlign: 'center',
    },

    primaryButton: {
      marginTop: 20,

      minWidth: 210,

      backgroundColor:
        COLORS.oxfordBlue,

      borderRadius: 18,

      paddingHorizontal: 20,
      paddingVertical: 14,

      alignItems: 'center',
    },

    primaryButtonText: {
      color: COLORS.white,

      fontSize: 14,
      fontWeight: '900',
    },

    viewRecentLink: {
      marginTop: 15,
      padding: 5,
    },

    viewRecentText: {
      fontSize: 13,
      fontWeight: '800',

      color:
        COLORS.green,
    },


    /* =====================================================
       NOT FOUND
       ===================================================== */

    notFoundCard: {
      marginTop: 18,

      backgroundColor:
        COLORS.white,

      borderRadius: 24,

      padding: 18,

      borderWidth: 1,
      borderColor:
        COLORS.lightBorder,
    },

    notFoundIcon: {
      width: 46,
      height: 46,

      borderRadius: 15,

      backgroundColor:
        COLORS.warningBackground,

      alignItems: 'center',
      justifyContent: 'center',
    },

    notFoundTitle: {
      marginTop: 12,

      fontSize: 19,
      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    notFoundText: {
      marginTop: 6,

      fontSize: 13,
      lineHeight: 20,

      color:
        COLORS.mutedText,
    },

    ingredientButton: {
      marginTop: 17,

      backgroundColor:
        COLORS.oxfordBlue,

      borderRadius: 17,

      paddingVertical: 13,

      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',

      gap: 7,
    },

    ingredientButtonText: {
      color:
        COLORS.white,

      fontSize: 13,
      fontWeight: '900',
    },

    tryAgainButton: {
      marginTop: 10,

      paddingVertical: 11,

      alignItems: 'center',
    },

    tryAgainButtonText: {
      color:
        COLORS.green,

      fontSize: 13,
      fontWeight: '900',
    },

    secondaryButton: {
      marginTop: 15,

      backgroundColor:
        COLORS.oxfordBlue,

      borderRadius: 17,

      paddingVertical: 14,

      alignItems: 'center',
    },

    secondaryButtonText: {
      color:
        COLORS.white,

      fontSize: 14,
      fontWeight: '900',
    },


    /* =====================================================
       RECENT SCANS
       ===================================================== */

    recentSection: {
      paddingBottom: 20,
    },

    recentHeader: {
      marginBottom: 16,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    recentTitle: {
      fontSize: 24,
      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    recentSubtitle: {
      marginTop: 4,

      fontSize: 13,
      color:
        COLORS.mutedText,
    },

    refreshButton: {
      width: 40,
      height: 40,

      borderRadius: 14,

      backgroundColor:
        COLORS.lemonCream,

      alignItems: 'center',
      justifyContent: 'center',
    },


    /* =====================================================
       HISTORY CARD
       ===================================================== */

    historyCard: {
      marginBottom: 10,

      backgroundColor:
        COLORS.white,

      borderRadius: 19,

      borderWidth: 1,
      borderColor:
        COLORS.lightBorder,

      overflow: 'hidden',
    },

    historyCardExpanded: {
      borderColor:
        COLORS.lightBlue,
    },

    historyCardHeader: {
      minHeight: 74,

      paddingHorizontal: 13,
      paddingVertical: 11,

      flexDirection: 'row',
      alignItems: 'center',

      gap: 10,
    },

    historyProductIcon: {
      width: 43,
      height: 43,

      borderRadius: 13,

      backgroundColor:
        COLORS.lemonCream,

      alignItems: 'center',
      justifyContent: 'center',
    },

    historyProductInfo: {
      flex: 1,
      minWidth: 0,
    },

    historyBrand: {
      fontSize: 9,
      fontWeight: '900',

      color:
        COLORS.green,

      textTransform: 'uppercase',
      letterSpacing: 0.7,
    },

    historyProductName: {
      marginTop: 2,

      fontSize: 14,
      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    historyDate: {
      marginTop: 3,

      fontSize: 10,

      color:
        COLORS.mutedText,
    },

    historyScoreBadge: {
      minWidth: 52,

      borderRadius: 999,

      paddingHorizontal: 9,
      paddingVertical: 7,

      alignItems: 'center',
    },

    historyScoreText: {
      fontSize: 12,
      fontWeight: '900',
    },


    /* =====================================================
       EXPANDED HISTORY
       ===================================================== */

    expandedContent: {
      paddingHorizontal: 15,
      paddingBottom: 17,
    },

    expandedDivider: {
      height: 1,

      marginBottom: 14,

      backgroundColor:
        '#ECE9DB',
    },

    expandedLabelRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',

      gap: 14,
    },

    expandedLabel: {
      fontSize: 12,

      color:
        COLORS.mutedText,
    },

    expandedValue: {
      fontSize: 12,
      fontWeight: '900',
    },

    expandedSectionTitle: {
      marginTop: 16,

      fontSize: 13,
      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    expandedSummary: {
      marginTop: 5,

      fontSize: 12,
      lineHeight: 19,

      color:
        COLORS.mutedText,
    },

    expandedBulletRow: {
      marginTop: 8,

      flexDirection: 'row',
      alignItems: 'flex-start',

      gap: 8,
    },

    goodDot: {
      width: 7,
      height: 7,

      marginTop: 6,

      borderRadius: 4,

      backgroundColor:
        COLORS.green,
    },

    expandedBulletText: {
      flex: 1,

      fontSize: 12,
      lineHeight: 18,

      color:
        COLORS.brown,
    },

    ingredientCountRow: {
      marginTop: 17,

      padding: 11,

      borderRadius: 14,

      backgroundColor:
        COLORS.lemonCream,

      flexDirection: 'row',
      alignItems: 'center',

      gap: 8,
    },

    ingredientCountText: {
      fontSize: 11,
      fontWeight: '800',

      color:
        COLORS.oxfordBlue,
    },

    barcodeText: {
      marginTop: 9,

      fontSize: 10,

      color:
        COLORS.mutedText,
    },


    /* =====================================================
       HISTORY STATUS
       ===================================================== */

    historyLoading: {
      paddingVertical: 50,

      alignItems: 'center',
      justifyContent: 'center',

      gap: 10,
    },

    historyLoadingText: {
      fontSize: 12,

      color:
        COLORS.mutedText,
    },

    historyMessageCard: {
      padding: 25,

      borderRadius: 24,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,
      borderColor:
        COLORS.lightBorder,

      alignItems: 'center',
    },

    emptyHistoryIcon: {
      width: 60,
      height: 60,

      borderRadius: 20,

      marginBottom: 13,

      backgroundColor:
        COLORS.lightBlue,

      alignItems: 'center',
      justifyContent: 'center',
    },

    historyMessageTitle: {
      marginTop: 10,

      fontSize: 18,
      fontWeight: '900',

      color:
        COLORS.oxfordBlue,

      textAlign: 'center',
    },

    historyMessageText: {
      marginTop: 6,

      fontSize: 13,
      lineHeight: 19,

      color:
        COLORS.mutedText,

      textAlign: 'center',
    },

    historyRetryText: {
      marginTop: 14,

      color:
        COLORS.green,

      fontSize: 13,
      fontWeight: '900',
    },

    emptyScanButton: {
      marginTop: 17,

      borderRadius: 16,

      backgroundColor:
        COLORS.oxfordBlue,

      paddingHorizontal: 18,
      paddingVertical: 12,
    },

    emptyScanButtonText: {
      color:
        COLORS.white,

      fontSize: 13,
      fontWeight: '900',
    },


    /* =====================================================
       MODAL
       ===================================================== */

    modalOverlay: {
      flex: 1,

      backgroundColor:
        'rgba(32,49,75,0.45)',

      justifyContent:
        'flex-end',
    },

    modalCard: {
      maxHeight: '87%',

      backgroundColor:
        COLORS.background,

      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,

      paddingHorizontal: 22,
      paddingBottom: 30,
    },

    modalHandle: {
      width: 46,
      height: 5,

      marginTop: 10,
      marginBottom: 10,

      alignSelf: 'center',

      borderRadius: 999,

      backgroundColor:
        '#D9D8CE',
    },

    modalHeader: {
      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    modalProductIcon: {
      width: 58,
      height: 58,

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

      fontSize: 11,
      fontWeight: '900',

      color:
        COLORS.green,

      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },

    modalTitle: {
      marginTop: 4,

      fontSize: 27,
      lineHeight: 32,

      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },


    /* =====================================================
       MODAL SCORE
       ===================================================== */

    modalScoreCard: {
      marginTop: 15,

      minHeight: 90,

      borderRadius: 22,

      padding: 17,

      backgroundColor:
        COLORS.oxfordBlue,

      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    modalScoreEyebrow: {
      fontSize: 10,
      fontWeight: '900',

      letterSpacing: 0.9,

      color:
        COLORS.lightBlue,
    },

    modalScore: {
      fontSize: 38,
      fontWeight: '900',

      color:
        COLORS.white,
    },

    modalScoreLabel: {
      marginTop: 4,

      fontSize: 15,
      fontWeight: '900',

      color:
        COLORS.lemonCream,
    },


    /* =====================================================
       MODAL TEXT
       ===================================================== */

    modalSectionTitle: {
      marginTop: 19,
      marginBottom: 6,

      fontSize: 14,
      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    modalText: {
      fontSize: 13,
      lineHeight: 20,

      color:
        COLORS.mutedText,
    },

    reasonRow: {
      marginBottom: 7,

      flexDirection: 'row',
      alignItems:
        'flex-start',

      gap: 8,
    },

    reasonDot: {
      width: 7,
      height: 7,

      marginTop: 7,

      borderRadius: 4,

      backgroundColor:
        COLORS.green,
    },

    bulletText: {
      flex: 1,

      fontSize: 13,
      lineHeight: 20,

      color:
        COLORS.brown,
    },

    cautionRow: {
      marginBottom: 7,

      flexDirection: 'row',

      alignItems:
        'flex-start',

      gap: 8,
    },

    cautionText: {
      flex: 1,

      fontSize: 13,
      lineHeight: 20,

      color:
        COLORS.brown,
    },


    /* =====================================================
       MODAL BUTTONS
       ===================================================== */

    recentButton: {
      marginTop: 22,

      backgroundColor:
        COLORS.oxfordBlue,

      borderRadius: 18,

      paddingVertical: 15,

      alignItems: 'center',
      justifyContent:
        'center',

      flexDirection: 'row',

      gap: 8,
    },

    recentButtonText: {
      color:
        COLORS.white,

      fontSize: 14,
      fontWeight: '900',
    },

    scanAnotherModalButton: {
      paddingVertical: 15,

      alignItems: 'center',
    },

    scanAnotherModalText: {
      color:
        COLORS.green,

      fontSize: 13,
      fontWeight: '900',
    },

  });