import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PhotoCleanerProvider } from "@/context/PhotoCleanerContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="cluster/[id]"
        options={{ title: "Similar Photos", presentation: "card" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const hiddenRef = useRef(false);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular: require("../assets/fonts/Inter_400Regular.ttf"),
    Inter_500Medium: require("../assets/fonts/Inter_500Medium.ttf"),
    Inter_600SemiBold: require("../assets/fonts/Inter_600SemiBold.ttf"),
    Inter_700Bold: require("../assets/fonts/Inter_700Bold.ttf"),
  });

  const hideSplash = () => {
    if (!hiddenRef.current) {
      hiddenRef.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }
  };

  useEffect(() => {
    if (fontsLoaded || fontError) {
      hideSplash();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const timeout = setTimeout(hideSplash, 4000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <PhotoCleanerProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </PhotoCleanerProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
