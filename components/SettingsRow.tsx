import { Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

type Props = {
  label: string;
  isLast?: boolean;
  danger?: boolean;
  onPress: (label: string) => void;
};

export default function SettingsRow({
  label,
  isLast = false,
  danger = false,
  onPress,
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        isLast && styles.lastRow,
        pressed && styles.pressedRow,
      ]}
      onPress={() => onPress(label)}
    >
      <Text style={[styles.text, danger && styles.dangerText]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#5E5E5E" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: "#B9B9B9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  text: {
    fontSize: 15,
    color: COLORS.black,
    fontWeight: "600",
    flex: 1,
  },
  dangerText: {
    color: COLORS.red,
  },
  pressedRow: {
    opacity: 0.6,
  },
});