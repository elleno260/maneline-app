import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { userProfile } from "../../data/userProfile";

export default function ProfileHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.profileImage} />

      <View style={styles.profileInfo}>
        <Text style={styles.name}>{userProfile.name}</Text>
        <Text style={styles.hairSummary}>{userProfile.hairSummary}</Text>

        <View style={styles.proBadge}>
          <Ionicons name="star" size={14} color={COLORS.lightBlue} />
          <Text style={styles.proBadgeText}>{userProfile.membership}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 164,
    backgroundColor: COLORS.oxfordBlue,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 35,
    paddingTop: 18,
  },
  profileImage: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: COLORS.background,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "serif",
    marginBottom: 4,
  },
  hairSummary: {
    color: COLORS.lightBlue,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  proBadge: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
  },
  proBadgeText: {
    color: COLORS.lightBlue,
    fontSize: 12,
  },
});