import { Text, StyleSheet, View } from "react-native";
import { COLORS } from "../constants/colors";

type Props = {
  label: string;
};

export default function MatchBadge({ label }: Props) {
  const isOkay = label.toLowerCase().includes("okay");

  return (
    <View style={[styles.badge, isOkay && styles.okayBadge]}>
      <Text style={[styles.text, isOkay && styles.okayText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: "#D8F7B8",
    borderWidth: 1,
    borderColor: "#9AC879",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  okayBadge: {
    backgroundColor: COLORS.lemon,
    borderColor: "#E1D67A",
  },
  text: {
    color: COLORS.greenText,
    fontSize: 11,
    fontWeight: "700",
  },
  okayText: {
    color: "#9A8A25",
  },
});