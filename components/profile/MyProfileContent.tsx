import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useHairProfile,
  type HairProfile,
} from "../../context/HairProfileContext";

const hairGoals = [
  "Moisture",
  "Length Retention",
  "Scalp Health",
  "Definition",
  "Growth",
];

const profileFields: {
  label: string;
  key: keyof HairProfile;
  options: string[];
}[] = [
  {
    label: "Hair Type",
    key: "hairType",
    options: [
      "1A",
      "1B",
      "1C",
      "2A",
      "2B",
      "2C",
      "3A",
      "3B",
      "3C",
      "4A",
      "4B",
      "4C",
    ],
  },
  {
    label: "Porosity",
    key: "porosity",
    options: ["Low", "Medium", "High"],
  },
  {
    label: "Density",
    key: "density",
    options: ["Fine", "Medium", "Thick"],
  },
  {
    label: "Scalp",
    key: "scalp",
    options: ["Normal", "Dry", "Oily", "Sensitive", "Dandruff Prone"],
  },
  {
    label: "Chemical History",
    key: "chemicalHistory",
    options: [
      "None",
      "Heat Damage",
      "Color Damage",
      "Relaxed",
      "Bleached",
      "Heat/Color Damage",
    ],
  },
  {
    label: "Hair Color",
    key: "hairColor",
    options: ["Black", "Brown", "Ash Brown", "Blonde", "Red", "Color Treated"],
  },
];

export default function MyProfileContent() {
  const { hairProfile, setHairProfile } = useHairProfile();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<keyof HairProfile | null>(
    null
  );

  const handleSaveProfile = () => {
    setIsEditingProfile(false);
    setOpenDropdown(null);
  };

  return (
    <View style={styles.profileContent}>
      <View style={styles.profileCard}>
        <Text style={styles.cardTitle}>My Hair Profile</Text>

        {profileFields.map((field, index) => {
          const isLast = index === profileFields.length - 1;

          if (isEditingProfile) {
            return (
              <DropdownField
                key={field.key}
                label={field.label}
                value={hairProfile[field.key]}
                options={field.options}
                isOpen={openDropdown === field.key}
                isLast={isLast}
                onToggle={() =>
                  setOpenDropdown(openDropdown === field.key ? null : field.key)
                }
                onSelect={(value) => {
                  setHairProfile((current) => ({
                    ...current,
                    [field.key]: value,
                  }));
                  setOpenDropdown(null);
                }}
              />
            );
          }

          return (
            <View
              key={field.key}
              style={[styles.profileRow, isLast && styles.lastProfileRow]}
            >
              <Text style={styles.profileLabel}>{field.label}</Text>
              <Text style={styles.profileValue}>{hairProfile[field.key]}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.goalsTitle}>My Hair Goals</Text>

      <View style={styles.goalsContainer}>
        {hairGoals.map((goal) => (
          <View key={goal} style={styles.goalPill}>
            <Text style={styles.goalText}>{goal}</Text>
          </View>
        ))}
      </View>

      {isEditingProfile ? (
        <Pressable style={styles.saveButton} onPress={handleSaveProfile}>
          <Text style={styles.editButtonText}>Save Hair Profile</Text>
        </Pressable>
      ) : (
        <Pressable
          style={styles.editButton}
          onPress={() => setIsEditingProfile(true)}
        >
          <Text style={styles.editButtonText}>Edit Hair Profile</Text>
        </Pressable>
      )}
    </View>
  );
}

type DropdownFieldProps = {
  label: string;
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  isLast?: boolean;
};

function DropdownField({
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
  isLast = false,
}: DropdownFieldProps) {
  return (
    <View style={[styles.dropdownContainer, isLast && styles.lastProfileRow]}>
      <Pressable style={styles.dropdownHeader} onPress={onToggle}>
        <Text style={styles.profileLabel}>{label}</Text>

        <View style={styles.dropdownValueRow}>
          <Text style={styles.profileValue}>{value}</Text>
          <Ionicons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={18}
            color="#3B251A"
          />
        </View>
      </Pressable>

      {isOpen && (
        <View style={styles.dropdownOptions}>
          {options.map((option, index) => (
            <Pressable
              key={option}
              style={[
                styles.dropdownOption,
                index === options.length - 1 && styles.lastDropdownOption,
              ]}
              onPress={() => onSelect(option)}
            >
              <Text style={styles.dropdownOptionText}>{option}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  profileContent: {
    paddingHorizontal: 22,
    paddingTop: 26,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D1D1",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingTop: 14,
    paddingBottom: 10,
    marginBottom: 25,
  },
  cardTitle: {
    fontSize: 15,
    color: "#000000",
    fontWeight: "700",
    marginBottom: 13,
  },
  profileRow: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: "#C7C7C7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lastProfileRow: {
    borderBottomWidth: 0,
  },
  profileLabel: {
    fontSize: 13,
    color: "#000000",
    fontWeight: "500",
  },
  profileValue: {
    fontSize: 13,
    color: "#000000",
    textAlign: "right",
    maxWidth: "62%",
  },

  dropdownContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#C7C7C7",
  },
  dropdownHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "62%",
  },
  dropdownOptions: {
    backgroundColor: "#FDF9E4",
    borderWidth: 1,
    borderColor: "#D1D1D1",
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  dropdownOption: {
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E7E1C8",
  },
  lastDropdownOption: {
    borderBottomWidth: 0,
  },
  dropdownOptionText: {
    fontSize: 13,
    color: "#000000",
  },

  goalsTitle: {
    fontSize: 17,
    color: "#000000",
    fontWeight: "500",
    marginLeft: -14,
    marginBottom: 17,
  },
  goalsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginLeft: -8,
    marginBottom: 50,
  },
  goalPill: {
    minWidth: 91,
    height: 22,
    backgroundColor: "#FFF8BD",
    borderWidth: 1,
    borderColor: "#D2C875",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  goalText: {
    fontSize: 13,
    color: "#000000",
    fontWeight: "500",
  },
  editButton: {
    height: 44,
    backgroundColor: "#1D314F",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    height: 44,
    backgroundColor: "#3B251A",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});