import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import type { RoutineStep } from "../data/routine";

type Props = {
  step: RoutineStep;
};

export default function RoutineStepCard({ step }: Props) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => Alert.alert(step.step, step.product)}
    >
      <View style={styles.numberCircle}>
        <Text style={styles.number}>{step.id}</Text>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.stepName}>{step.step}</Text>
        <Text style={styles.productName}>{step.product}</Text>
      </View>

      {step.status === "check" ? (
        <Ionicons name="checkmark" size={24} color="#78A85C" />
      ) : (
        <Text style={styles.dashIcon}>—</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 62,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 10,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  numberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brown,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  number: {
    color: COLORS.white,
    fontSize: 21,
  },
  textContainer: {
    flex: 1,
  },
  stepName: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 4,
  },
  productName: {
    fontSize: 13,
    color: COLORS.black,
  },
  dashIcon: {
    fontSize: 24,
    color: "#B8931F",
    paddingRight: 6,
  },
});