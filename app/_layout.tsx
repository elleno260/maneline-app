import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="hairProfileSetup" />
      <Stack.Screen name="editAvatar" />
      <Stack.Screen name="review-scan" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="routine"
                    options={{
                      title: 'Edit Routine',
                      headerBackTitle: 'Back',
                      headerStyle: {
                        backgroundColor: '#FFF7F0',
                      },
                      headerTintColor: '#111827',
                      headerTitleStyle: {
                        fontWeight: '900',
                      },
  }}
/>
    </Stack>
  );
}