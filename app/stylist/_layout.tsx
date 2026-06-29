import { Stack } from 'expo-router';

export default function StylistLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Stylist Dashboard' }} />
      <Stack.Screen name="clients" options={{ title: 'Clients' }} />
      <Stack.Screen name="client/new" options={{ title: 'Add Client' }} />
      <Stack.Screen name="client/[clientId]/index" options={{ title: 'Client Detail' }} />
      <Stack.Screen name="client/[clientId]/log-visit" options={{ title: 'Log Visit' }} />
      <Stack.Screen name="client/[clientId]/ai" options={{ title: 'AI Recommendation' }} />
    </Stack>
  );
}
