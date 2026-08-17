import { Stack, Redirect } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="hairProfileSetup" />
      <Stack.Screen name="editAvatar" />
      <Stack.Screen name="review-scan" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
