import { View, Text, StyleSheet, Pressable } from "react-native";
//import type { ProfileTab } from "../../app/(tabs)/profile";

export type ProfileTab =
  | 'profile'
  | 'routine'
  | 'settings';

  
type Props = {
  activeTab: ProfileTab;
  setActiveTab: (tab: ProfileTab) => void;
};

export default function ProfileSubTabs({ activeTab, setActiveTab }: Props) {
  return (
    <View style={styles.topTabs}>
      <Pressable
        style={[styles.topTab, activeTab === "profile" && styles.activeTab]}
        onPress={() => setActiveTab("profile")}
      >
        <Text style={styles.topTabText}>My Profile</Text>
      </Pressable>

      <Pressable
        style={[styles.topTab, activeTab === "routine" && styles.activeTab]}
        onPress={() => setActiveTab("routine")}
      >
        <Text style={styles.topTabText}>Routine</Text>
      </Pressable>

      <Pressable
        style={[styles.topTab, activeTab === "settings" && styles.activeTab]}
        onPress={() => setActiveTab("settings")}
      >
        <Text style={styles.topTabText}>Settings</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topTabs: {
    height: 39,
    backgroundColor: "#FFF8BD",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#B8AA73",
  },
  topTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#3B251A",
  },
  topTabText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },
});