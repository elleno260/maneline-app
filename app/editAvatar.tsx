import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../store/authStore";
import {
  getUserProfile,
  updateUserProfile,
} from "../services/userProfileService";

const skinToneOptions = [
  "Light",
  "Medium light",
  "Medium",
  "Medium deep",
  "Deep",
];

const avatarHairShapeOptions = [
  "Straight",
  "Wavy",
  "Curly",
  "Coily",
  "Locs",
  "Braids",
  "Bald",
];

const avatarHairLengthOptions = [
  "Buzz cut",
  "Short",
  "Chin length",
  "Shoulder length",
  "Mid-back",
  "Long",
];

const avatarHairColorOptions = [
  "Black",
  "Brown",
  "Blonde",
  "Red",
  "Gray",
  "Colored/Dyed",
];

const shirtColorOptions = [
  "Cream",
  "Brown",
  "Black",
  "Pink",
  "Green",
  "Blue",
  "Purple",
];

export default function EditAvatarScreen() {
  const user = useAuthStore((state) => state.user);

  const [skinTone, setSkinTone] = useState("");
  const [avatarHairShape, setAvatarHairShape] = useState("");
  const [avatarHairLength, setAvatarHairLength] = useState("");
  const [avatarHairColor, setAvatarHairColor] = useState("");
  const [shirtColor, setShirtColor] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadAvatar() {
      if (!user) return;

      try {
        const profile = await getUserProfile(user.uid);

        if (profile?.avatar) {
          setSkinTone(profile.avatar.skinTone || "");
          setAvatarHairShape(profile.avatar.hairShape || "");
          setAvatarHairLength(profile.avatar.hairLength || "");
          setAvatarHairColor(profile.avatar.hairColor || "");
          setShirtColor(profile.avatar.shirtColor || "");
        }
      } catch (error: any) {
        Alert.alert("Error", error.message);
      } finally {
        setLoading(false);
      }
    }

    loadAvatar();
  }, [user]);

  async function handleSaveAvatar() {
    if (!user) {
      Alert.alert("Error", "No user is signed in.");
      return;
    }

    if (
      !skinTone ||
      !avatarHairShape ||
      !avatarHairLength ||
      !avatarHairColor ||
      !shirtColor
    ) {
      Alert.alert("Almost there", "Please complete all avatar options.");
      return;
    }

    try {
      setSaving(true);

      await updateUserProfile(user.uid, {
        avatar: {
          skinTone,
          hairShape: avatarHairShape,
          hairLength: avatarHairLength,
          hairColor: avatarHairColor,
          shirtColor,
        },
      });

      Alert.alert("Saved", "Your avatar has been updated.");
      router.back();
    } catch (error: any) {
      Alert.alert("Save Error", error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading avatar...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Avatar</Text>
      <Text style={styles.subtitle}>
        Update how your profile avatar appears in the app.
      </Text>

      <Text style={styles.sectionTitle}>Skin tone</Text>
      <View style={styles.optionGroup}>
        {skinToneOptions.map((option) => (
          <Pressable
            key={option}
            style={[styles.option, skinTone === option && styles.selectedOption]}
            onPress={() => setSkinTone(option)}
          >
            <Text
              style={[
                styles.optionText,
                skinTone === option && styles.selectedOptionText,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Hair shape</Text>
      <View style={styles.optionGroup}>
        {avatarHairShapeOptions.map((option) => (
          <Pressable
            key={option}
            style={[
              styles.option,
              avatarHairShape === option && styles.selectedOption,
            ]}
            onPress={() => setAvatarHairShape(option)}
          >
            <Text
              style={[
                styles.optionText,
                avatarHairShape === option && styles.selectedOptionText,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Hair length</Text>
      <View style={styles.optionGroup}>
        {avatarHairLengthOptions.map((option) => (
          <Pressable
            key={option}
            style={[
              styles.option,
              avatarHairLength === option && styles.selectedOption,
            ]}
            onPress={() => setAvatarHairLength(option)}
          >
            <Text
              style={[
                styles.optionText,
                avatarHairLength === option && styles.selectedOptionText,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Hair color</Text>
      <View style={styles.optionGroup}>
        {avatarHairColorOptions.map((option) => (
          <Pressable
            key={option}
            style={[
              styles.option,
              avatarHairColor === option && styles.selectedOption,
            ]}
            onPress={() => setAvatarHairColor(option)}
          >
            <Text
              style={[
                styles.optionText,
                avatarHairColor === option && styles.selectedOptionText,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Shirt color</Text>
      <View style={styles.optionGroup}>
        {shirtColorOptions.map((option) => (
          <Pressable
            key={option}
            style={[styles.option, shirtColor === option && styles.selectedOption]}
            onPress={() => setShirtColor(option)}
          >
            <Text
              style={[
                styles.optionText,
                shirtColor === option && styles.selectedOptionText,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.avatarPreview}>
        <Text style={styles.avatarTitle}>Avatar Preview</Text>

        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>
            {avatarHairShape === "Curly" || avatarHairShape === "Coily"
              ? "🧑‍🦱"
              : avatarHairShape === "Bald"
              ? "👤"
              : "🧑"}
          </Text>
        </View>

        <Text style={styles.avatarText}>
          Skin tone: {skinTone || "Not selected"}
        </Text>

        <Text style={styles.avatarText}>
          Hair: {avatarHairColor || "Color"} • {avatarHairShape || "Shape"} •{" "}
          {avatarHairLength || "Length"}
        </Text>

        <Text style={styles.avatarText}>
          Shirt: {shirtColor || "Not selected"}
        </Text>
      </View>

      <Pressable
        style={[styles.saveButton, saving && styles.disabledButton]}
        onPress={handleSaveAvatar}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Saving..." : "Save Avatar"}
        </Text>
      </Pressable>

      <Pressable style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#FFF8F1",
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: 28,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2F1B12",
    marginTop: 20,
    marginBottom: 10,
  },
  optionGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  option: {
    borderWidth: 1,
    borderColor: "#D7C1AF",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: "#2F1B12",
    borderColor: "#2F1B12",
  },
  optionText: {
    color: "#2F1B12",
    fontWeight: "500",
  },
  selectedOptionText: {
    color: "#FFFFFF",
  },
  avatarPreview: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#E2D2C3",
  },
  avatarTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2F1B12",
    marginBottom: 10,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FFF8F1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2D2C3",
  },
  avatarEmoji: {
    fontSize: 56,
  },
  avatarText: {
    fontSize: 14,
    color: "#6B4E3D",
    textAlign: "center",
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: "#2F1B12",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 32,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  cancelButtonText: {
    color: "#2F1B12",
    fontWeight: "700",
    fontSize: 16,
  },
});