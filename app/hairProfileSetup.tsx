import { useState } from "react";
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
import { updateUserProfile } from "../services/userProfileService";

const hairTypes = ["Straight", "Wavy", "Curly", "Coily", "Not sure"];

const porosityOptions = ["Low", "Medium", "High", "Not sure"];

const densityOptions = ["Low", "Medium", "High", "Not sure"];

const hairGoals = [
  "Moisture",
  "Growth",
  "Definition",
  "Frizz control",
  "Scalp health",
  "Damage repair",
  "Volume",
  "Length retention",
  "Color protection",
];

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

export default function HairProfileSetupScreen() {
  const user = useAuthStore((state) => state.user);

  const [hairType, setHairType] = useState("");
  const [porosity, setPorosity] = useState("");
  const [density, setDensity] = useState("");
  const [goals, setGoals] = useState<string[]>([]);

  const [skinTone, setSkinTone] = useState("");
  const [avatarHairShape, setAvatarHairShape] = useState("");
  const [avatarHairLength, setAvatarHairLength] = useState("");
  const [avatarHairColor, setAvatarHairColor] = useState("");
  const [shirtColor, setShirtColor] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  function toggleGoal(goal: string) {
    if (goals.includes(goal)) {
      setGoals(goals.filter((item) => item !== goal));
    } else {
      setGoals([...goals, goal]);
    }
  }

  async function handleSaveProfile() {
    if (!user) {
      Alert.alert("Error", "No user is signed in.");
      return;
    }

    if (
      !hairType ||
      !porosity ||
      !density ||
      goals.length === 0 ||
      !skinTone ||
      !avatarHairShape ||
      !avatarHairLength ||
      !avatarHairColor ||
      !shirtColor
    ) {
      Alert.alert(
        "Almost there",
        "Please complete your hair profile and avatar setup so we can personalize your experience."
      );
      return;
    }

    try {
      setIsSaving(true);

      await updateUserProfile(user.uid, {
        hairType,
        porosity,
        density,
        goals,
        onboardingComplete: true,
        avatar: {
          skinTone,
          hairShape: avatarHairShape,
          hairLength: avatarHairLength,
          hairColor: avatarHairColor,
          shirtColor,
        },
      });

      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Profile Error", error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Set up your hair profile</Text>

      <Text style={styles.subtitle}>
        Answer a few questions so ManeLine can personalize product suggestions,
        ingredient insights, and your in-app avatar.
      </Text>

      <Text style={styles.sectionTitle}>What is your hair type?</Text>
      <View style={styles.optionGroup}>
        {hairTypes.map((type) => (
          <Pressable
            key={type}
            style={[styles.option, hairType === type && styles.selectedOption]}
            onPress={() => setHairType(type)}
          >
            <Text
              style={[
                styles.optionText,
                hairType === type && styles.selectedOptionText,
              ]}
            >
              {type}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>What is your hair porosity?</Text>
      <Text style={styles.helperText}>
        Porosity helps the app understand how your hair absorbs and holds
        moisture.
      </Text>
      <View style={styles.optionGroup}>
        {porosityOptions.map((option) => (
          <Pressable
            key={option}
            style={[
              styles.option,
              porosity === option && styles.selectedOption,
            ]}
            onPress={() => setPorosity(option)}
          >
            <Text
              style={[
                styles.optionText,
                porosity === option && styles.selectedOptionText,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>What is your hair density?</Text>
      <Text style={styles.helperText}>
        Density helps determine whether lightweight or heavier products may work
        better for you.
      </Text>
      <View style={styles.optionGroup}>
        {densityOptions.map((option) => (
          <Pressable
            key={option}
            style={[styles.option, density === option && styles.selectedOption]}
            onPress={() => setDensity(option)}
          >
            <Text
              style={[
                styles.optionText,
                density === option && styles.selectedOptionText,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>What are your hair goals?</Text>
      <Text style={styles.helperText}>Select all that apply.</Text>
      <View style={styles.optionGroup}>
        {hairGoals.map((goal) => (
          <Pressable
            key={goal}
            style={[styles.option, goals.includes(goal) && styles.selectedOption]}
            onPress={() => toggleGoal(goal)}
          >
            <Text
              style={[
                styles.optionText,
                goals.includes(goal) && styles.selectedOptionText,
              ]}
            >
              {goal}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.divider} />

      <Text style={styles.titleSmall}>Create your avatar</Text>
      <Text style={styles.subtitleSmall}>
        Customize your profile avatar. This is separate from your hair
        recommendation profile.
      </Text>

      <Text style={styles.sectionTitle}>Choose your skin tone</Text>
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

      <Text style={styles.sectionTitle}>Choose your avatar hair shape</Text>
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

      <Text style={styles.sectionTitle}>Choose your avatar hair length</Text>
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

      <Text style={styles.sectionTitle}>Choose your avatar hair color</Text>
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

      <Text style={styles.sectionTitle}>Choose your shirt color</Text>
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
          Hair: {avatarHairColor || "Color"} •{" "}
          {avatarHairShape || "Shape"} • {avatarHairLength || "Length"}
        </Text>

        <Text style={styles.avatarText}>
          Shirt: {shirtColor || "Not selected"}
        </Text>
      </View>

      <Pressable
        style={[styles.saveButton, isSaving && styles.disabledButton]}
        onPress={handleSaveProfile}
        disabled={isSaving}
      >
        <Text style={styles.saveButtonText}>
          {isSaving ? "Saving..." : "Save Hair Profile"}
        </Text>
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
  titleSmall: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2F1B12",
    marginBottom: 8,
  },
  subtitleSmall: {
    fontSize: 15,
    color: "#6B4E3D",
    marginBottom: 22,
    lineHeight: 21,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2F1B12",
    marginTop: 20,
    marginBottom: 10,
  },
  helperText: {
    fontSize: 14,
    color: "#6B4E3D",
    marginBottom: 10,
    lineHeight: 20,
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
  divider: {
    height: 1,
    backgroundColor: "#E2D2C3",
    marginTop: 30,
    marginBottom: 26,
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
    marginBottom: 30,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});