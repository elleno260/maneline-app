import { Ionicons } from '@expo/vector-icons';
import { takePendingScanResult } from '../../services/scanResultHandoffService';
import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';

import type {
  BarcodeScanningResult,
} from 'expo-camera';

import {
  router,
  useFocusEffect,
} from 'expo-router';

import {
  useCallback,
  useState,
} from 'react';
import { COLORS } from '../../constants/colors';

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

import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  generateProductExplanation,
} from '../../services/aiExplanationService';

import {
  getOrCreateGuestUser,
} from '../../services/authService';

import {
  calculateCompatibility,
} from '../../services/compatibilityService';

import {
  getOrImportProductByBarcode,
} from '../../services/productFirebaseService';

import {
  getUserHairProfileOrNull,
} from '../../services/profileFirebaseService';

import {
  buildScanHistoryItem,
  getScanHistoryFromFirebase,
  saveScanToFirebaseHistory,
} from '../../services/scanHistoryFirebaseService';

import type {
  ScanHistoryItem,
} from '../../services/scanHistoryFirebaseService';

import type {
  HairProduct,
} from '../../types/product.types';

/* =========================================================
   TYPES
   ========================================================= */

type ScanView =
  | 'scan'
  | 'history';

/* =========================================================
   SCREEN
   ========================================================= */

export default function ScanScreen() {
  const insets =
    useSafeAreaInsets();

  const [
    permission,
    requestPermission,
  ] =
    useCameraPermissions();

  /* -------------------------------------------------------
     PAGE MODE
     ------------------------------------------------------- */

  const [
    activeView,
    setActiveView,
  ] =
    useState<ScanView>(
      'scan'
    );

  /* -------------------------------------------------------
     SCANNER
     ------------------------------------------------------- */

  const [
    scanned,
    setScanned,
  ] =
    useState(false);

  const [
    lookingUp,
    setLookingUp,
  ] =
    useState(false);

  const [
    latestScan,
    setLatestScan,
  ] =
    useState<{
      item: ScanHistoryItem;
      product: HairProduct;
    } | null>(
      null
    );

  /* -------------------------------------------------------
     HISTORY
     ------------------------------------------------------- */

  const [
    history,
    setHistory,
  ] =
    useState<
      ScanHistoryItem[]
    >([]);

  const [
    historyLoading,
    setHistoryLoading,
  ] =
    useState(false);

  const [
    expandedHistoryId,
    setExpandedHistoryId,
  ] =
    useState<string | null>(
      null
    );

  /* =======================================================
     LOAD HISTORY WHEN SCREEN GAINS FOCUS
     ======================================================= */

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [])
  );

  async function loadHistory() {
    setHistoryLoading(true);

    try {
      await getOrCreateGuestUser();

      const items =
        await getScanHistoryFromFirebase();

      setHistory(items);
    } catch (error) {
      console.warn(
        '[ManeLine history] Could not load history:',
        error
      );
    } finally {
      setHistoryLoading(false);
    }
  }
useFocusEffect(
  useCallback(() => {
    let active =
      true;

    async function checkForCompletedOcrScan() {
      const pending =
        await takePendingScanResult();

      if (
        !active ||
        !pending
      ) {
        return;
      }

      /*
       * Keep the barcode scanner
       * paused while the result
       * modal is visible.
       */
      setScanned(true);

      
      /*
       * This automatically opens
       * the existing result modal.
       */
      setLatestScan(
        pending
      );

      
    }

    void checkForCompletedOcrScan();

    return () => {
      active =
        false;
    };
  }, [])
);
useFocusEffect(
  useCallback(() => {
    let active =
      true;

    async function loadPendingResult() {
      const pending =
        await takePendingScanResult();

      if (
        !active ||
        !pending
      ) {
        return;
      }

      /*
       * Pause barcode scanning while
       * the result modal is open.
       */
      setScanned(true);

      /*
       * The existing Scan modal opens
       * because latestScan becomes
       * non-null.
       */
      setLatestScan(
        pending
      );
    }

    void loadPendingResult();

    return () => {
      active =
        false;
    };
  }, [])
);
  /* =======================================================
     BARCODE SCAN
     ======================================================= */

  async function handleBarcodeScanned(
    result:
      BarcodeScanningResult
  ) {
    if (
      scanned ||
      lookingUp
    ) {
      return;
    }

    const barcode =
      result.data?.trim();

    if (!barcode) {
      Alert.alert(
        'Barcode not read',
        'ManeLine could not read that barcode. Please try again.'
      );

      return;
    }

    setScanned(true);
    setLookingUp(true);
    setLatestScan(null);

    try {
      /* -----------------------------------------------
         AUTH
         ----------------------------------------------- */

      await getOrCreateGuestUser();

      /* -----------------------------------------------
         PROFILE
         ----------------------------------------------- */

      const profile =
        await getUserHairProfileOrNull();

      if (!profile) {
        setScanned(false);

        router.push(
          '/hairProfileSetup' as never
        );

        return;
      }

      /* -----------------------------------------------
         PRODUCT LOOKUP
         ----------------------------------------------- */

      const product =
        await getOrImportProductByBarcode(
          barcode
        );

      /* ===============================================
         OCR FALLBACK:
         PRODUCT IDENTITY ALSO MISSING
         =============================================== */

      if (!product) {
        setScanned(false);

        Alert.alert(
          'Product not identified',
          'ManeLine could not identify this barcode online. You can still continue by scanning the ingredient label.',
          [
            {
              text:
                'Try barcode again',

              style:
                'cancel',
            },

            {
              text:
                'Scan ingredient label',

              onPress: () => {
                router.push({
                  pathname:
                    '/scan-ingredients',

                  params: {
                    barcode,
                  },
                });
              },
            },
          ]
        );

        return;
      }

      /* ===============================================
         OCR FALLBACK:
         PRODUCT FOUND BUT INGREDIENTS MISSING
         =============================================== */

      if (
        !product.ingredients ||
        product.ingredients.length ===
          0
      ) {
        setScanned(false);

        Alert.alert(
          'Ingredients needed',
          `${product.name} was identified, but ManeLine could not verify its ingredient list online. Scan the ingredient label to continue.`,
          [
            {
              text:
                'Try barcode again',

              style:
                'cancel',
            },

            {
              text:
                'Scan ingredient label',

              onPress: () => {
                router.push({
                  pathname:
                    '/scan-ingredients',

                  params: {
                    barcode,

                    productId:
                      product.id,

                    productName:
                      product.name,

                    brand:
                      product.brand,

                    category:
                      product.category,
                  },
                });
              },
            },
          ]
        );

        return;
      }

      /* ===============================================
         NORMAL PRODUCT ANALYSIS
         =============================================== */

      const compatibility =
        calculateCompatibility(
          product,
          profile
        );

      const explanation =
        await generateProductExplanation({
          product,
          profile,
          compatibility,
        });

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

      await saveScanToFirebaseHistory(
        scanItem
      );

      /*
       * Immediately update History UI.
       */
      setHistory(
        (current) => [
          scanItem,

          ...current.filter(
            (item) =>
              item.id !==
              scanItem.id
          ),
        ]
      );

      setLatestScan({
        item:
          scanItem,

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
     RESET
     ======================================================= */

  function resetScanner() {
    setScanned(false);

    setLatestScan(null);
  }

  /* =======================================================
     OPEN HISTORY
     ======================================================= */

  async function openHistory() {
    setActiveView(
      'history'
    );

    await loadHistory();
  }

  /* =======================================================
     PERMISSION LOADING
     ======================================================= */

  if (!permission) {
    return (
      <View
        style={
          styles.centeredScreen
        }
      >
        <ActivityIndicator
          color={
            COLORS.oxfordBlue
          }
        />
      </View>
    );
  }

  /* =======================================================
     CAMERA PERMISSION
     ======================================================= */

  if (
    !permission.granted &&
    activeView ===
      'scan'
  ) {
    return (
      <View
        style={
          styles.centeredScreen
        }
      >
        <View
          style={
            styles.permissionCard
          }
        >
          <View
            style={
              styles.permissionIcon
            }
          >
            <Ionicons
              name="camera-outline"
              size={34}
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
            ManeLine needs your
            camera to scan product
            barcodes and ingredient
            labels.
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
        </View>
      </View>
    );
  }

  /* =======================================================
     MAIN UI
     ======================================================= */

  return (
    <View
      style={
        styles.screen
      }
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
              18,

            paddingBottom:
              140,
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
          <Text
            style={
              styles.eyebrow
            }
          >
            PRODUCT SCANNER
          </Text>

          <Text
            style={
              styles.title
            }
          >
            Know what works
            for your hair.
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Scan products,
            understand their
            ingredients, and keep
            your results in one
            place.
          </Text>
        </View>

        {/* ===============================================
            SCAN / HISTORY SWITCH
            =============================================== */}

        <View
          style={
            styles.viewSwitcher
          }
        >
          <Pressable
            style={[
              styles.viewSwitchButton,

              activeView ===
                'scan' &&
                styles.viewSwitchButtonActive,
            ]}
            onPress={() =>
              setActiveView(
                'scan'
              )
            }
          >
            <Ionicons
              name="scan-outline"
              size={17}
              color={
                activeView ===
                'scan'
                  ? COLORS.white
                  : COLORS.oxfordBlue
              }
            />

            <Text
              style={[
                styles.viewSwitchText,

                activeView ===
                  'scan' &&
                  styles.viewSwitchTextActive,
              ]}
            >
              Scan
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.viewSwitchButton,

              activeView ===
                'history' &&
                styles.viewSwitchButtonActive,
            ]}
            onPress={() =>
              void openHistory()
            }
          >
            <Ionicons
              name="time-outline"
              size={17}
              color={
                activeView ===
                'history'
                  ? COLORS.white
                  : COLORS.oxfordBlue
              }
            />

            <Text
              style={[
                styles.viewSwitchText,

                activeView ===
                  'history' &&
                  styles.viewSwitchTextActive,
              ]}
            >
              History
            </Text>
          </Pressable>
        </View>

        {/* ===============================================
            SCAN VIEW
            =============================================== */}

        {activeView ===
        'scan' ? (
          <>
            <View
              style={
                styles.cameraWrap
              }
            >
              <CameraView
                style={
                  styles.camera
                }
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

              <View
                pointerEvents="none"
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

                  <Text
                    style={
                      styles.lookupTitle
                    }
                  >
                    Looking up
                    product...
                  </Text>

                  <Text
                    style={
                      styles.lookupText
                    }
                  >
                    Checking product
                    data and verified
                    ingredient sources.
                  </Text>
                </View>
              ) : null}
            </View>

            <Text
              style={
                styles.scanHelp
              }
            >
              Hold the barcode
              inside the frame. If
              ManeLine cannot verify
              ingredients online,
              you'll be prompted to
              photograph the
              ingredient label.
            </Text>

            {scanned &&
            !lookingUp &&
            !latestScan ? (
              <Pressable
                style={
                  styles.secondaryButton
                }
                onPress={
                  resetScanner
                }
              >
                <Ionicons
                  name="refresh-outline"
                  size={17}
                  color={
                    COLORS.oxfordBlue
                  }
                />

                <Text
                  style={
                    styles.secondaryButtonText
                  }
                >
                  Scan another
                  product
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          /* =============================================
             HISTORY VIEW
             ============================================= */

          <View
            style={
              styles.historySection
            }
          >
            <View
              style={
                styles.historyHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.historyEyebrow
                  }
                >
                  YOUR SCANS
                </Text>

                <Text
                  style={
                    styles.historyTitle
                  }
                >
                  Scan history
                </Text>
              </View>

              <Pressable
                style={
                  styles.refreshHistoryButton
                }
                onPress={() =>
                  void loadHistory()
                }
              >
                <Ionicons
                  name="refresh-outline"
                  size={17}
                  color={
                    COLORS.oxfordBlue
                  }
                />
              </Pressable>
            </View>

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
                  Loading history...
                </Text>
              </View>
            ) : history.length ===
              0 ? (
              <View
                style={
                  styles.emptyHistoryCard
                }
              >
                <View
                  style={
                    styles.emptyHistoryIcon
                  }
                >
                  <Ionicons
                    name="time-outline"
                    size={25}
                    color={
                      COLORS.oxfordBlue
                    }
                  />
                </View>

                <Text
                  style={
                    styles.emptyHistoryTitle
                  }
                >
                  No scans yet
                </Text>

                <Text
                  style={
                    styles.emptyHistoryText
                  }
                >
                  Products you analyze
                  will appear here.
                </Text>

                <Pressable
                  style={
                    styles.emptyHistoryButton
                  }
                  onPress={() =>
                    setActiveView(
                      'scan'
                    )
                  }
                >
                  <Text
                    style={
                      styles.emptyHistoryButtonText
                    }
                  >
                    Scan a product
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View
                style={
                  styles.historyList
                }
              >
                {history.map(
                  (item) => (
                    <HistoryCard
                      key={
                        item.id
                      }
                      item={
                        item
                      }
                      expanded={
                        expandedHistoryId ===
                        item.id
                      }
                      onToggle={() =>
                        setExpandedHistoryId(
                          (
                            current
                          ) =>
                            current ===
                            item.id
                              ? null
                              : item.id
                        )
                      }
                    />
                  )
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ===============================================
          RESULT MODAL
          =============================================== */}

      <Modal
        visible={
          !!latestScan
        }
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
            {latestScan ? (
              <>
                <View
                  style={
                    styles.modalHeader
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

                <Text
                  style={
                    styles.modalBrand
                  }
                >
                  {
                    latestScan
                      .product
                      .brand
                  }
                </Text>

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  {
                    latestScan
                      .product
                      .name
                  }
                </Text>

                <View
                  style={
                    styles.modalScoreCard
                  }
                >
                  <Text
                    style={
                      styles.modalScore
                    }
                  >
                    {
                      latestScan
                        .item
                        .compatibilityScore
                    }
                    %
                  </Text>

                  <Text
                    style={
                      styles.modalScoreLabel
                    }
                  >
                    {
                      latestScan
                        .item
                        .compatibilityLabel
                    }
                  </Text>
                </View>

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
                  {
                    latestScan
                      .item
                      .summary
                  }
                </Text>

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
                  ?.slice(
                    0,
                    3
                  )
                  .map(
                    (
                      reason
                    ) => (
                      <Text
                        key={
                          reason
                        }
                        style={
                          styles.bulletText
                        }
                      >
                        • {reason}
                      </Text>
                    )
                  )}

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
                      Cautions
                    </Text>

                    {latestScan
                      .item
                      .cautions
                      .slice(
                        0,
                        2
                      )
                      .map(
                        (
                          caution
                        ) => (
                          <Text
                            key={
                              caution
                            }
                            style={
                              styles.bulletText
                            }
                          >
                            •{' '}
                            {
                              caution
                            }
                          </Text>
                        )
                      )}
                  </>
                ) : null}

                <Pressable
                  style={
                    styles.historyButton
                  }
                  onPress={() => {
                    setLatestScan(
                      null
                    );

                    setScanned(
                      false
                    );

                    void openHistory();
                  }}
                >
                  <Text
                    style={
                      styles.historyButtonText
                    }
                  >
                    View in history
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={
                      COLORS.white
                    }
                  />
                </Pressable>
              </>
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
  onToggle,
}: {
  item: ScanHistoryItem;

  expanded: boolean;

  onToggle:
    () => void;
}) {
  return (
    <Pressable
      style={[
        styles.historyCard,

        expanded &&
          styles.historyCardExpanded,
      ]}
      onPress={
        onToggle
      }
    >
      <View
        style={
          styles.historyCardTop
        }
      >
        <View
          style={
            styles.historyProductIcon
          }
        >
          <Text
            style={
              styles.historyProductEmoji
            }
          >
            🧴
          </Text>
        </View>

        <View
          style={{ flex: 1 }}
        >
          <Text
            style={
              styles.historyBrand
            }
            numberOfLines={1}
          >
            {item.brand ||
              'Unknown brand'}
          </Text>

          <Text
            style={
              styles.historyProductName
            }
            numberOfLines={
              expanded
                ? undefined
                : 1
            }
          >
            {
              item.productName
            }
          </Text>

          <Text
            style={
              styles.historyDate
            }
          >
            {formatHistoryDate(
              item.scannedAt
            )}
          </Text>
        </View>

        {item.compatibilityScore !==
        null &&
        item.compatibilityScore !==
          undefined ? (
          <View
            style={
              styles.historyScore
            }
          >
            <Text
              style={
                styles.historyScoreText
              }
            >
              {
                item.compatibilityScore
              }
              %
            </Text>
          </View>
        ) : null}

        <Ionicons
          name={
            expanded
              ? 'chevron-up'
              : 'chevron-down'
          }
          size={18}
          color={
            COLORS.mutedText
          }
        />
      </View>

      {expanded ? (
        <View
          style={
            styles.historyDetails
          }
        >
          {item.compatibilityLabel ? (
            <View
              style={
                styles.historyLabelPill
              }
            >
              <Text
                style={
                  styles.historyLabelText
                }
              >
                {
                  item.compatibilityLabel
                }
              </Text>
            </View>
          ) : null}

          <Text
            style={
              styles.historySummary
            }
          >
            {item.summary}
          </Text>

          {item.matchReasons?.length ? (
            <>
              <Text
                style={
                  styles.historyDetailHeading
                }
              >
                Why it matched
              </Text>

              {item.matchReasons
                .slice(
                  0,
                  3
                )
                .map(
                  (
                    reason,
                    index
                  ) => (
                    <Text
                      key={`${reason}-${index}`}
                      style={
                        styles.historyDetailText
                      }
                    >
                      • {reason}
                    </Text>
                  )
                )}
            </>
          ) : null}

          {item.cautions?.length ? (
            <>
              <Text
                style={
                  styles.historyDetailHeading
                }
              >
                Cautions
              </Text>

              {item.cautions
                .slice(
                  0,
                  2
                )
                .map(
                  (
                    caution,
                    index
                  ) => (
                    <Text
                      key={`${caution}-${index}`}
                      style={
                        styles.historyDetailText
                      }
                    >
                      • {caution}
                    </Text>
                  )
                )}
            </>
          ) : null}

          <View
            style={
              styles.ingredientCount
            }
          >
            <Ionicons
              name="flask-outline"
              size={14}
              color={
                COLORS.green
              }
            />

            <Text
              style={
                styles.ingredientCountText
              }
            >
              {
                item.ingredients
                  ?.length ??
                0
              }{' '}
              ingredients saved
            </Text>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatHistoryDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  return date.toLocaleDateString(
    undefined,
    {
      month:
        'short',

      day:
        'numeric',

      year:
        'numeric',
    }
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

    centeredScreen: {
      flex: 1,

      padding: 24,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.background,
    },

    content: {
      paddingHorizontal:
        20,
    },

    /* HEADER */

    header: {
      padding: 20,

      marginBottom:
        13,

      borderRadius:
        28,

      backgroundColor:
        COLORS.oxfordBlue,
    },

    eyebrow: {
      fontSize: 10,

      fontWeight:
        '900',

      letterSpacing:
        1,

      color:
        COLORS.lemonCream,
    },

    title: {
      marginTop: 6,

      maxWidth: 310,

      fontSize: 30,

      lineHeight: 35,

      fontWeight:
        '900',

      letterSpacing:
        -0.6,

      color:
        COLORS.white,
    },

    subtitle: {
      marginTop: 8,

      maxWidth: 330,

      fontSize: 13,

      lineHeight: 20,

      color:
        '#E7ECF4',
    },

    /* VIEW SWITCHER */

    viewSwitcher: {
      marginBottom:
        14,

      padding: 4,

      borderRadius:
        17,

      flexDirection:
        'row',

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.lightBorder,
    },

    viewSwitchButton: {
      flex: 1,

      minHeight: 43,

      borderRadius:
        13,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 6,
    },

    viewSwitchButtonActive: {
      backgroundColor:
        COLORS.oxfordBlue,
    },

    viewSwitchText: {
      fontSize: 11,

      fontWeight:
        '900',

      color:
        COLORS.oxfordBlue,
    },

    viewSwitchTextActive: {
      color:
        COLORS.white,
    },

    /* CAMERA */

    cameraWrap: {
      height: 360,

      borderRadius:
        28,

      overflow:
        'hidden',

      position:
        'relative',

      backgroundColor:
        COLORS.oxfordBlue,
    },

    camera: {
      flex: 1,
    },

    scanFrame: {
      position:
        'absolute',

      width: 230,

      height: 150,

      left: '50%',

      top: '50%',

      marginLeft:
        -115,

      marginTop:
        -75,
    },

    cornerTopLeft: {
      position:
        'absolute',

      left: 0,

      top: 0,

      width: 44,

      height: 44,

      borderTopWidth:
        5,

      borderLeftWidth:
        5,

      borderColor:
        COLORS.lemonCream,

      borderTopLeftRadius:
        14,
    },

    cornerTopRight: {
      position:
        'absolute',

      right: 0,

      top: 0,

      width: 44,

      height: 44,

      borderTopWidth:
        5,

      borderRightWidth:
        5,

      borderColor:
        COLORS.lemonCream,

      borderTopRightRadius:
        14,
    },

    cornerBottomLeft: {
      position:
        'absolute',

      left: 0,

      bottom: 0,

      width: 44,

      height: 44,

      borderBottomWidth:
        5,

      borderLeftWidth:
        5,

      borderColor:
        COLORS.lemonCream,

      borderBottomLeftRadius:
        14,
    },

    cornerBottomRight: {
      position:
        'absolute',

      right: 0,

      bottom: 0,

      width: 44,

      height: 44,

      borderBottomWidth:
        5,

      borderRightWidth:
        5,

      borderColor:
        COLORS.lemonCream,

      borderBottomRightRadius:
        14,
    },

    lookupOverlay: {
      ...StyleSheet.absoluteFillObject,

      padding: 30,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        'rgba(32,49,75,0.86)',
    },

    lookupTitle: {
      marginTop: 11,

      fontSize: 15,

      fontWeight:
        '900',

      color:
        COLORS.white,
    },

    lookupText: {
      marginTop: 4,

      maxWidth: 230,

      textAlign:
        'center',

      fontSize: 10,

      lineHeight: 15,

      color:
        '#E7ECF4',
    },

    scanHelp: {
      marginTop: 12,

      marginBottom:
        16,

      fontSize: 12,

      lineHeight: 18,

      color:
        COLORS.mutedText,
    },

    /* HISTORY */

    historySection: {
      paddingBottom:
        20,
    },

    historyHeader: {
      marginBottom:
        13,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    historyEyebrow: {
      fontSize: 9,

      fontWeight:
        '900',

      letterSpacing:
        0.9,

      color:
        COLORS.green,
    },

    historyTitle: {
      marginTop: 2,

      fontSize: 22,

      fontWeight:
        '900',

      color:
        COLORS.oxfordBlue,
    },

    refreshHistoryButton: {
      width: 39,

      height: 39,

      borderRadius:
        13,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.lemonCream,
    },

    historyLoading: {
      paddingVertical:
        40,

      alignItems:
        'center',

      gap: 9,
    },

    historyLoadingText: {
      fontSize: 11,

      fontWeight:
        '800',

      color:
        COLORS.mutedText,
    },

    historyList: {
      gap: 8,
    },

    historyCard: {
      padding: 12,

      borderRadius:
        17,

      borderWidth: 1,

      borderColor:
        COLORS.lightBorder,

      backgroundColor:
        COLORS.white,
    },

    historyCardExpanded: {
      borderColor:
        COLORS.lightBlue,
    },

    historyCardTop: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 9,
    },

    historyProductIcon: {
      width: 40,

      height: 40,

      borderRadius:
        13,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.lemonCream,
    },

    historyProductEmoji: {
      fontSize: 19,
    },

    historyBrand: {
      fontSize: 9,

      fontWeight:
        '900',

      textTransform:
        'uppercase',

      color:
        COLORS.green,
    },

    historyProductName: {
      marginTop: 2,

      fontSize: 12,

      fontWeight:
        '900',

      color:
        COLORS.oxfordBlue,
    },

    historyDate: {
      marginTop: 2,

      fontSize: 9,

      color:
        COLORS.mutedText,
    },

    historyScore: {
      minWidth: 45,

      paddingHorizontal:
        7,

      paddingVertical:
        6,

      borderRadius:
        10,

      alignItems:
        'center',

      backgroundColor:
        COLORS.lightBlue,
    },

    historyScoreText: {
      fontSize: 11,

      fontWeight:
        '900',

      color:
        COLORS.oxfordBlue,
    },

    historyDetails: {
      marginTop: 12,

      paddingTop: 12,

      borderTopWidth:
        1,

      borderTopColor:
        COLORS.lightBorder,
    },

    historyLabelPill: {
      alignSelf:
        'flex-start',

      paddingHorizontal:
        8,

      paddingVertical:
        5,

      borderRadius:
        999,

      backgroundColor:
        COLORS.lemonCream,
    },

    historyLabelText: {
      fontSize: 9,

      fontWeight:
        '900',

      color:
        COLORS.green,
    },

    historySummary: {
      marginTop: 9,

      fontSize: 11,

      lineHeight: 17,

      color:
        COLORS.brown,
    },

    historyDetailHeading: {
      marginTop: 11,

      marginBottom: 4,

      fontSize: 10,

      fontWeight:
        '900',

      color:
        COLORS.oxfordBlue,
    },

    historyDetailText: {
      marginBottom: 3,

      fontSize: 10,

      lineHeight: 15,

      color:
        COLORS.mutedText,
    },

    ingredientCount: {
      marginTop: 11,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 5,
    },

    ingredientCountText: {
      fontSize: 9,

      fontWeight:
        '800',

      color:
        COLORS.green,
    },

    emptyHistoryCard: {
      padding: 25,

      borderRadius:
        22,

      alignItems:
        'center',

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.lightBorder,
    },

    emptyHistoryIcon: {
      width: 52,

      height: 52,

      borderRadius:
        17,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.lemonCream,
    },

    emptyHistoryTitle: {
      marginTop: 11,

      fontSize: 15,

      fontWeight:
        '900',

      color:
        COLORS.oxfordBlue,
    },

    emptyHistoryText: {
      marginTop: 4,

      fontSize: 11,

      color:
        COLORS.mutedText,
    },

    emptyHistoryButton: {
      marginTop: 14,

      paddingHorizontal:
        14,

      paddingVertical:
        10,

      borderRadius:
        13,

      backgroundColor:
        COLORS.oxfordBlue,
    },

    emptyHistoryButtonText: {
      fontSize: 10,

      fontWeight:
        '900',

      color:
        COLORS.white,
    },

    /* GENERAL BUTTONS */

    secondaryButton: {
      minHeight: 46,

      paddingHorizontal:
        13,

      borderRadius:
        15,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 6,

      backgroundColor:
        COLORS.lemonCream,
    },

    secondaryButtonText: {
      fontSize: 11,

      fontWeight:
        '900',

      color:
        COLORS.oxfordBlue,
    },

    /* PERMISSION */

    permissionCard: {
      width: '100%',

      padding: 24,

      borderRadius:
        28,

      alignItems:
        'center',

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.lightBorder,
    },

    permissionIcon: {
      width: 62,

      height: 62,

      borderRadius:
        20,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.lemonCream,
    },

    permissionTitle: {
      marginTop: 12,

      fontSize: 20,

      fontWeight:
        '900',

      color:
        COLORS.oxfordBlue,
    },

    permissionText: {
      marginTop: 7,

      textAlign:
        'center',

      fontSize: 12,

      lineHeight: 18,

      color:
        COLORS.mutedText,
    },

    primaryButton: {
      marginTop: 17,

      paddingHorizontal:
        17,

      paddingVertical:
        13,

      borderRadius:
        15,

      backgroundColor:
        COLORS.oxfordBlue,
    },

    primaryButtonText: {
      fontSize: 12,

      fontWeight:
        '900',

      color:
        COLORS.white,
    },

    /* RESULT MODAL */

    modalOverlay: {
      flex: 1,

      justifyContent:
        'flex-end',

      backgroundColor:
        'rgba(32,49,75,0.45)',
    },

    modalCard: {
      maxHeight: '86%',

      padding: 22,

      borderTopLeftRadius:
        30,

      borderTopRightRadius:
        30,

      backgroundColor:
        COLORS.background,
    },

    modalHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    modalEmoji: {
      fontSize: 42,
    },

    modalBrand: {
      marginTop: 12,

      fontSize: 10,

      fontWeight:
        '900',

      letterSpacing:
        0.8,

      textTransform:
        'uppercase',

      color:
        COLORS.green,
    },

    modalTitle: {
      marginTop: 4,

      fontSize: 27,

      lineHeight: 32,

      fontWeight:
        '900',

      color:
        COLORS.oxfordBlue,
    },

    modalScoreCard: {
      marginTop: 14,

      padding: 17,

      borderRadius:
        23,

      backgroundColor:
        COLORS.oxfordBlue,
    },

    modalScore: {
      fontSize: 43,

      fontWeight:
        '900',

      color:
        COLORS.white,
    },

    modalScoreLabel: {
      marginTop: 2,

      fontWeight:
        '900',

      color:
        COLORS.lemonCream,
    },

    modalSectionTitle: {
      marginTop: 17,

      marginBottom: 6,

      fontSize: 13,

      fontWeight:
        '900',

      color:
        COLORS.oxfordBlue,
    },

    modalText: {
      fontSize: 12,

      lineHeight: 19,

      color:
        COLORS.mutedText,
    },

    bulletText: {
      marginBottom: 4,

      fontSize: 12,

      lineHeight: 19,

      color:
        COLORS.mutedText,
    },

    historyButton: {
      marginTop: 20,

      minHeight: 50,

      borderRadius:
        16,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 8,

      backgroundColor:
        COLORS.green,
    },

    historyButtonText: {
      fontSize: 13,

      fontWeight:
        '900',

      color:
        COLORS.white,
    },
  });