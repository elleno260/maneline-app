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

  async function runOCR(uri: string) {
    try {
      setIsScanning(true);

      const result = await recognizeTextFromImage(uri);
      const extractedText = result.fullText;

      setRecognizedText(extractedText);

      if (!extractedText || extractedText.trim().length === 0) {
        Alert.alert(
          "No text found",
          "We could not detect ingredient text. Try taking a clearer photo with good lighting.",
        );
        return;
      }

      router.push({
        pathname: "/results",
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
        "We could not find this barcode in Open Food Facts."
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Scan a Product</Text>

      <Text style={styles.subtitle}>
        Take or upload a clear photo of the product label. ManeLine will use ML
        Kit to read the ingredient list.
      </Text>

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
  onPress={() => handleBarcodeLookup("3017624010701")}
>
  <Text style={styles.secondaryButtonText}>Test Barcode Lookup</Text>
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
});
