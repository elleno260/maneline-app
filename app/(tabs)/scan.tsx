import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { fetchProductByBarcode } from "../../services/barcodeService";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
// Temporary/local OCR helper to avoid missing module error for
// ../services/ocrService. Returns an object with `fullText`.
async function recognizeTextFromImage(
  uri: string,
): Promise<{ fullText: string }> {
  // Placeholder implementation: replace with real OCR service integration.
  // For now, return an empty string so UI flows continue to work.
  return { fullText: "" };
}

export default function ScanScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [hasScannedBarcode, setHasScannedBarcode] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();


  async function openBarcodeScanner() {
  if (!cameraPermission?.granted) {
    const permission = await requestCameraPermission();

    if (!permission.granted) {
      Alert.alert(
        "Camera permission needed",
        "Please allow camera access so ManeLine can scan barcodes."
      );
      return;
    }
  }

  setHasScannedBarcode(false);
  setScannerVisible(true);
}

async function handleRealBarcodeScanned(result: BarcodeScanningResult) {
  if (hasScannedBarcode) return;

  setHasScannedBarcode(true);
  setScannerVisible(false);

  const scannedBarcode = result.data;

  await handleBarcodeLookup(scannedBarcode);
}

function isUsefulIngredientText(text: string) {
  const cleaned = text.trim();

  if (cleaned.length < 25) return false;

  const lower = cleaned.toLowerCase();

  const ingredientSignals = [
    "ingredients",
    "aqua",
    "water",
    "glycerin",
    "alcohol",
    "oil",
    "butter",
    "extract",
    "fragrance",
    "parfum",
    "sulfate",
    "chloride",
    "acid",
  ];

  const signalMatches = ingredientSignals.filter((word) =>
    lower.includes(word)
  ).length;

  const hasCommas = cleaned.includes(",");
  const hasMultipleWords = cleaned.split(/\s+/).length >= 6;

  return signalMatches >= 1 && (hasCommas || hasMultipleWords);
}

  async function runOCR(uri: string) {
    try {
      setIsScanning(true);

     const result = await recognizeTextFromImage(uri);
const extractedText = result.fullText?.trim() || "";

setRecognizedText(extractedText);

if (!isUsefulIngredientText(extractedText)) {
  Alert.alert(
    "We could not read the label clearly",
    "The photo may be blurry, too dark, too far away, or missing the ingredient list. Try taking another photo in better lighting.",
    [
      {
        text: "Try Again",
        onPress: handleTakePhoto,
      },
      {
        text: "Upload Photo",
        onPress: handleUploadImage,
      },
      {
        text: "Enter Manually",
        onPress: () =>
          router.push({
            pathname: "/review-scan",
            params: {
              imageUri: uri,
              extractedText: "",
            },
          }),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]
  );

  return;
}

router.push({
  pathname: "/review-scan",
  params: {
    imageUri: uri,
    extractedText,
  },
});
    } catch (error: any) {
      Alert.alert("Scan Error", error.message || "Something went wrong.");
    } finally {
      setIsScanning(false);
    }
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Camera permission needed",
        "Please allow camera access so ManeLine can scan product labels.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setImageUri(uri);

    await runOCR(uri);
  }

  async function handleUploadImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Photo permission needed",
        "Please allow photo access so you can upload product label images.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setImageUri(uri);

    await runOCR(uri);
  }

  async function handleBarcodeLookup(barcode: string) {
  try {
    const product = await fetchProductByBarcode(barcode);

   if (!product.found) {
  Alert.alert(
    "Product not found",
    "We could not find this barcode in the product databases. You can still analyze it by scanning the ingredient label.",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Scan Label",
        onPress: handleTakePhoto,
      },
      {
        text: "Upload Label",
        onPress: handleUploadImage,
      },
    ]
  );

  return;
}

    router.push({
      pathname: "/results",
      params: {
        barcode: product.barcode,
        productName: product.productName || "",
        brand: product.brand || "",
        extractedText: product.ingredientsText || "",
      },
    });
  } catch (error: any) {
    Alert.alert("Barcode Error", error.message);
  }
}

if (scannerVisible) {
  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={handleRealBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: [
            "ean13",
            "ean8",
            "upc_a",
            "upc_e",
            "code128",
            "code39",
            "qr",
          ],
        }}
      />

      <View style={styles.cameraOverlay}>
        <Text style={styles.cameraTitle}>Scan product barcode</Text>
        <Text style={styles.cameraSubtitle}>
          Hold the barcode inside the camera view.
        </Text>

        <Pressable
          style={styles.cancelScanButton}
          onPress={() => setScannerVisible(false)}
        >
          <Text style={styles.cancelScanButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Scan a Product</Text>

      <Text style={styles.subtitle}>
        Take or upload a clear photo of the product label. ManeLine will use ML
        Kit to read the ingredient list.
      </Text>
      <View style={styles.instructionCard}>
        <Text style={styles.instructionTitle}>For best results</Text>
          <Text style={styles.instructionText}>
            Scan the barcode first. If the product is not found, take a clear photo of
            the ingredient label in good lighting. Keep the label flat and avoid glare.
           </Text>
      </View>

      <View style={styles.card}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>
              No product label selected yet
            </Text>
          </View>
        )}

        {isScanning ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Reading ingredients...</Text>
          </View>
        ) : null}
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={handleTakePhoto}
        disabled={isScanning}
      >
        <Text style={styles.primaryButtonText}>Take Label Photo</Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={handleUploadImage}
        disabled={isScanning}
      >
        <Text style={styles.secondaryButtonText}>Upload From Photos</Text>
      </Pressable>

  <Pressable
  style={styles.secondaryButton}
  onPress={openBarcodeScanner}
  disabled={isScanning}
>
  <Text style={styles.secondaryButtonText}>Scan Barcode</Text>
</Pressable>
<Pressable
  style={styles.secondaryButton}
  onPress={() =>
    router.push({
      pathname: "/review-scan",
      params: {
        extractedText: "",
      },
    })
  }
  disabled={isScanning}
>
  <Text style={styles.secondaryButtonText}>Enter Ingredients Manually</Text>
</Pressable>

      {recognizedText ? (
        <View style={styles.resultPreview}>
          <Text style={styles.resultTitle}>Detected Text Preview</Text>
          <Text style={styles.resultText} numberOfLines={8}>
            {recognizedText}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#FFF8F1",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#2F1B12",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B4E3D",
    lineHeight: 22,
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2D2C3",
    padding: 16,
    marginBottom: 22,
  },
  previewImage: {
    width: "100%",
    height: 280,
    borderRadius: 16,
    backgroundColor: "#EFE7DE",
  },
  placeholderBox: {
    height: 280,
    borderRadius: 16,
    backgroundColor: "#FFF8F1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2D2C3",
    borderStyle: "dashed",
  },
  placeholderIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  placeholderText: {
    color: "#6B4E3D",
    fontSize: 15,
    fontWeight: "600",
  },
  loadingBox: {
    marginTop: 14,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "#6B4E3D",
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#2F1B12",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#2F1B12",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  secondaryButtonText: {
    color: "#2F1B12",
    fontWeight: "700",
    fontSize: 16,
  },
  resultPreview: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2D2C3",
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2F1B12",
    marginBottom: 8,
  },
  resultText: {
    color: "#6B4E3D",
    fontSize: 14,
    lineHeight: 20,
  },

  cameraContainer: {
  flex: 1,
  backgroundColor: "#000000",
},
camera: {
  flex: 1,
},
cameraOverlay: {
  position: "absolute",
  left: 20,
  right: 20,
  bottom: 40,
  backgroundColor: "rgba(47, 27, 18, 0.92)",
  borderRadius: 22,
  padding: 20,
  alignItems: "center",
},
cameraTitle: {
  color: "#FFFFFF",
  fontSize: 22,
  fontWeight: "900",
  marginBottom: 6,
},
cameraSubtitle: {
  color: "#EAD8C8",
  fontSize: 14,
  textAlign: "center",
  marginBottom: 16,
},
cancelScanButton: {
  backgroundColor: "#FFFFFF",
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 14,
},
cancelScanButtonText: {
  color: "#2F1B12",
  fontWeight: "900",
},
instructionCard: {
  backgroundColor: "#FFFFFF",
  borderRadius: 18,
  borderWidth: 1,
  borderColor: "#E2D2C3",
  padding: 16,
  marginBottom: 20,
},
instructionTitle: {
  fontSize: 16,
  fontWeight: "900",
  color: "#2F1B12",
  marginBottom: 6,
},
instructionText: {
  fontSize: 14,
  color: "#6B4E3D",
  lineHeight: 20,
},
});
