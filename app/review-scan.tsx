import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value ?? "";
}

export default function ReviewScanScreen() {
  const params = useLocalSearchParams();

  const extractedText = getParamValue(params.extractedText);
  const productName = getParamValue(params.productName);
  const brand = getParamValue(params.brand);
  const barcode = getParamValue(params.barcode);

  const [editableText, setEditableText] = useState(extractedText);

  function handleAnalyze() {
    if (!editableText.trim()) {
      Alert.alert(
        "No ingredient text",
        "Please add or correct the ingredient text before analyzing."
      );
      return;
    }

    router.push({
      pathname: "/results",
      params: {
        extractedText: editableText,
        productName,
        brand,
        barcode,
      },
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.pageLabel}>Review Scan</Text>
      <Text style={styles.title}>Check the ingredient text</Text>

      <Text style={styles.subtitle}>
        ML Kit read the label, but ingredient text can be tiny. Review and fix
        anything that looks wrong before analyzing.
      </Text>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Tip</Text>
        <Text style={styles.tipText}>
          Make sure the text starts near “Ingredients:” and includes the full
          ingredient list.
        </Text>
      </View>

      <TextInput
        style={styles.textBox}
        value={editableText}
        onChangeText={setEditableText}
        multiline
        textAlignVertical="top"
        placeholder="Ingredient text will appear here..."
        placeholderTextColor="#9A6B4F"
      />

      <Pressable style={styles.primaryButton} onPress={handleAnalyze}>
        <Text style={styles.primaryButtonText}>Analyze Product</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Go Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#FFF8F1",
  },
  pageLabel: {
    fontSize: 13,
    color: "#9A6B4F",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#2F1B12",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B4E3D",
    lineHeight: 22,
    marginBottom: 18,
  },
  tipCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2D2C3",
    padding: 16,
    marginBottom: 16,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2F1B12",
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    color: "#6B4E3D",
    lineHeight: 20,
  },
  textBox: {
    minHeight: 260,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2D2C3",
    padding: 16,
    fontSize: 15,
    color: "#2F1B12",
    lineHeight: 22,
    marginBottom: 18,
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
    fontWeight: "900",
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#2F1B12",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#2F1B12",
    fontWeight: "900",
    fontSize: 16,
  },
});