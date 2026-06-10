import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const NAVY = "#1D314F";
const LEMON_CREAM = "#FFF8BD";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: LEMON_CREAM,
        tabBarInactiveTintColor: "#FFFFFF",
        tabBarStyle: {
          backgroundColor: NAVY,
          height: 88,
          paddingTop: 8,
          paddingBottom: 26,
          borderTopWidth: 0,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={30}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="barcode" size={31} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="results"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="sparkles-outline" size={31} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="search" size={33} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={31}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}