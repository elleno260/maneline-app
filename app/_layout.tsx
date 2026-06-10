import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useAuthListener } from "../hooks/useAuthListener";
import { useAuthStore } from "../store/authStore";
import { HairProfileProvider } from "../context/HairProfileContext";

export default function RootLayout() {
  useAuthListener();

  const router = useRouter();
  const segments = useSegments();

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const loading = useAuthStore((state) => state.loading);

  useEffect(() => {
    if (loading) return;

    const onLoginScreen = segments[0] === "login";

    if (!isLoggedIn && !onLoginScreen) {
      router.replace("/login");
    }

    if (isLoggedIn && onLoginScreen) {
      router.replace("/(tabs)");
    }
  }, [isLoggedIn, loading, segments]);

  return (
    <HairProfileProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </HairProfileProvider>
  );
}