import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

const COLORS = {
  lemonCream: '#FFF9C7',
  brown: '#3D2920',
  lightBlue: '#95BFFF',
  oxfordBlue: '#20314B',
  green: '#667D41',
  background: '#FFFDF2',
  inactive: '#8A8F98',
  border: '#E7E2CB',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: COLORS.oxfordBlue,
        tabBarInactiveTintColor: COLORS.inactive,

        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 12,
          paddingTop: 8,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },

        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="scan-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* NEW ROUTINE TAB */}
      <Tabs.Screen
        name="routine"
        options={{
          title: 'Routine',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="calendar-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* OLD HISTORY PAGE — HIDDEN */}
      <Tabs.Screen
        name="results"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="search-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}