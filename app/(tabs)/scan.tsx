import { Ionicons } from '@expo/vector-icons';
import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useState } from 'react';
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
  saveScanToFirebaseHistory,
} from '../../services/scanHistoryFirebaseService';
import type { ScanHistoryItem } from '../../services/scanHistoryFirebaseService';
import type { HairProduct } from '../../types/product.types';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [latestScan, setLatestScan] = useState<{
    item: ScanHistoryItem;
    product: HairProduct;
  } | null>(null);

  async function handleBarcodeScanned(result: BarcodeScanningResult) {
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
      await getOrCreateGuestUser();

      const profile = await getUserHairProfileOrNull();

      if (!profile) {
        setScanned(false);
        router.push('/hairProfileSetup' as never);
        return;
      }

      /*
       * This single service now handles the complete lookup order:
       * Firestore -> INCI (when enabled) -> Open Beauty Facts
       * -> UPCitemdb -> Gemini ingredient search.
       */
      const product = await getOrImportProductByBarcode(barcode);

      if (!product) {
        setNotFoundBarcode(barcode);
        return;
      }

      if (!product.ingredients?.length) {
        Alert.alert(
          'Ingredients needed',
          `${product.name} was identified, but ManeLine could not verify its ingredient list online. Please scan the ingredient label to continue.`
        );

        setScanned(false);
        return;
      }

      if (!product) {
  Alert.alert(
    'Product not identified',
    'We could not find this barcode. Scan the ingredient label to continue.',
    [  
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Scan label',
        onPress: () => {
          router.push({
            pathname: '/review-scan',
            params: {
              barcode,
              scanMode: 'ingredients',
            },
          });
        },
      },
    ]
  );

  return;
}

      const compatibility = calculateCompatibility(product, profile);

      const explanation = await generateProductExplanation({
        product,
        profile,
        compatibility,
      });

      const scanItem = buildScanHistoryItem({
        productId: product.id,
        productName: product.name,
        brand: product.brand,
        barcode,
        ingredients: product.ingredients,
        compatibility,
        aiExplanation: explanation,
      });

      await saveScanToFirebaseHistory(scanItem);

      setLatestScan({
        item: scanItem,
        product,
      });
    } catch (error) {
      console.warn('[ManeLine scan] Scan failed:', error);

      Alert.alert(
        'Scan failed',
        'ManeLine could not finish this scan. Please check your connection and try again.'
      );

      setScanned(false);
    } finally {
      setLookingUp(false);
    }
  }

  function resetScanner() {
    setScanned(false);
    setNotFoundBarcode(null);
    setLatestScan(null);
  }

  if (!permission) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator color="#111827" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centeredScreen}>
        <View style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={42} color="#111827" />
          <Text style={styles.permissionTitle}>Camera access needed</Text>
          <Text style={styles.permissionText}>
            ManeLine needs your camera to scan product barcodes.
          </Text>

          <Pressable style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Allow camera access</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 18,
            paddingBottom: 140,
          },
        ]}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Scan</Text>
          <Text style={styles.title}>Scan a product barcode.</Text>
          <Text style={styles.subtitle}>
            ManeLine looks up the product, reads its ingredients, compares it to
            your hair profile, and saves the result to History.
          </Text>
        </View>

        <View style={styles.cameraWrap}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
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

          <View style={styles.scanFrame}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
          </View>

          {lookingUp ? (
            <View style={styles.lookupOverlay}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.lookupText}>Looking up product...</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.scanHelp}>
          Hold the barcode inside the frame. ManeLine will check saved products,
          Open Beauty Facts, UPCitemdb, and verified ingredient sources.
        </Text>

        {notFoundBarcode ? (
          <View style={styles.notFoundCard}>
            <Ionicons name="alert-circle-outline" size={30} color="#B45309" />
            <Text style={styles.notFoundTitle}>Product not found</Text>
            <Text style={styles.notFoundText}>
              Barcode {notFoundBarcode} could not be identified. Try scanning it
              again or scan the ingredient label instead.
            </Text>

            <Pressable style={styles.secondaryButton} onPress={resetScanner}>
              <Text style={styles.secondaryButtonText}>Scan another product</Text>
            </Pressable>
          </View>
        ) : null}

        {scanned && !lookingUp && !notFoundBarcode && !latestScan ? (
          <Pressable style={styles.secondaryButton} onPress={resetScanner}>
            <Text style={styles.secondaryButtonText}>Scan again</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Modal
        visible={!!latestScan}
        animationType="slide"
        transparent
        onRequestClose={resetScanner}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {latestScan ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalEmoji}>
                    {latestScan.product.imageEmoji ?? '🧴'}
                  </Text>

                  <Pressable onPress={resetScanner} hitSlop={10}>
                    <Ionicons name="close" size={24} color="#111827" />
                  </Pressable>
                </View>

                <Text style={styles.modalBrand}>{latestScan.product.brand}</Text>
                <Text style={styles.modalTitle}>{latestScan.product.name}</Text>

                <View style={styles.modalScoreCard}>
                  <Text style={styles.modalScore}>
                    {latestScan.item.compatibilityScore}%
                  </Text>
                  <Text style={styles.modalScoreLabel}>
                    {latestScan.item.compatibilityLabel}
                  </Text>
                </View>

                <Text style={styles.modalSectionTitle}>ManeLine says</Text>
                <Text style={styles.modalText}>{latestScan.item.summary}</Text>

                <Text style={styles.modalSectionTitle}>Why it matched</Text>
                {latestScan.item.matchReasons?.slice(0, 3).map((reason) => (
                  <Text key={reason} style={styles.bulletText}>
                    • {reason}
                  </Text>
                ))}

                {latestScan.item.cautions?.length ? (
                  <>
                    <Text style={styles.modalSectionTitle}>Cautions</Text>
                    {latestScan.item.cautions.slice(0, 2).map((caution) => (
                      <Text key={caution} style={styles.bulletText}>
                        • {caution}
                      </Text>
                    ))}
                  </>
                ) : null}

                <Pressable
                  style={styles.historyButton}
                  onPress={() => {
                    resetScanner();
                    router.push('/(tabs)/results' as never);
                  }}
                >
                  <Text style={styles.historyButtonText}>View history</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF7F0',
  },
  centeredScreen: {
    flex: 1,
    backgroundColor: '#FFF7F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    paddingHorizontal: 20,
  },
  hero: {
    backgroundColor: '#111827',
    borderRadius: 34,
    padding: 22,
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 12,
    color: '#FBBF24',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '900',
  },
  title: {
    marginTop: 8,
    fontSize: 35,
    lineHeight: 40,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#E5E7EB',
    fontWeight: '700',
  },
  cameraWrap: {
    height: 360,
    borderRadius: 34,
    overflow: 'hidden',
    backgroundColor: '#111827',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scanFrame: {
    position: 'absolute',
    width: 230,
    height: 150,
    left: '50%',
    top: '50%',
    marginLeft: -115,
    marginTop: -75,
  },
  cornerTopLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 44,
    height: 44,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderColor: '#FBBF24',
    borderTopLeftRadius: 14,
  },
  cornerTopRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 44,
    height: 44,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderColor: '#FBBF24',
    borderTopRightRadius: 14,
  },
  cornerBottomLeft: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 44,
    height: 44,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderColor: '#FBBF24',
    borderBottomLeftRadius: 14,
  },
  cornerBottomRight: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 44,
    height: 44,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderColor: '#FBBF24',
    borderBottomRightRadius: 14,
  },
  lookupOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    backgroundColor: 'rgba(17, 24, 39, 0.82)',
    alignItems: 'center',
    gap: 8,
  },
  lookupText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  scanHelp: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 16,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3D5C0',
  },
  permissionTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  permissionText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: '#111827',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  notFoundCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F3D5C0',
    marginTop: 4,
  },
  notFoundTitle: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  notFoundText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
  },
  secondaryButton: {
    marginTop: 14,
    backgroundColor: '#111827',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFF7F0',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    padding: 22,
    maxHeight: '86%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalEmoji: {
    fontSize: 42,
  },
  modalBrand: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '900',
    color: '#D97706',
    textTransform: 'uppercase',
  },
  modalTitle: {
    marginTop: 4,
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '900',
    color: '#111827',
  },
  modalScoreCard: {
    marginTop: 14,
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 18,
  },
  modalScore: {
    color: '#FFFFFF',
    fontSize: 46,
    fontWeight: '900',
  },
  modalScoreLabel: {
    color: '#FBBF24',
    fontWeight: '900',
    marginTop: 2,
  },
  modalSectionTitle: {
    marginTop: 18,
    marginBottom: 7,
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },
  modalText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#4B5563',
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#4B5563',
    marginBottom: 4,
  },
  historyButton: {
    marginTop: 20,
    backgroundColor: '#D97706',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  historyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});