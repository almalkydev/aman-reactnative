import "../global.css";
import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { AppProvider, useApp, useColors } from "../lib/provider";
import { Text } from "../components/ui";
import { SyncBanner } from "../components/SyncBanner";
import { FadeInUp } from "../components/motion";
function Navigation() {
  const { ready, user, dark, reduced, toast, rtl } = useApp();
  const c = useColors();
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: c.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <FadeInUp>
          <Text size={64} weight="semibold" style={{ letterSpacing: -5 }}>
            aman
          </Text>
        </FadeInUp>
      </View>
    );
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{
        flex: 1,
        backgroundColor: c.background,
        direction: rtl ? "rtl" : "ltr",
      }}
    >
      <StatusBar style={dark ? "light" : "dark"} />
      {user ? <SyncBanner /> : null}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: reduced ? "none" : "fade_from_bottom",
          contentStyle: { backgroundColor: c.background },
        }}
      >
        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" />
        </Stack.Protected>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="inspection/new" />
          <Stack.Screen name="incident/new" />
          <Stack.Screen name="report/[kind]/[id]" />
          <Stack.Screen name="success" options={{ gestureEnabled: false }} />
        </Stack.Protected>
      </Stack>
      {toast ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: 100,
            left: 24,
            right: 24,
            maxWidth: 560,
            alignSelf: "center",
            padding: 15,
            borderRadius: 12,
            backgroundColor: c.foreground,
          }}
        >
          <Text style={{ color: c.background, textAlign: "center" }}>
            {toast}
          </Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
export default function Root() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  if (!loaded && !error) return <ActivityIndicator style={{ flex: 1 }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <Navigation />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
