import React from "react";
import { Tabs, usePathname } from "expo-router";
import { useWindowDimensions } from "react-native";
import { BlurView } from "expo-blur";
import {
  Home,
  ClipboardCheck,
  TriangleAlert,
  Settings,
} from "lucide-react-native";
import { useApp, useColors } from "../../lib/provider";
import { MotiView } from "moti";
export default function TabLayout() {
  const { t, dark, reduced, rtl } = useApp();
  const c = useColors();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const index = Math.max(
    0,
    ["/", "/inspections", "/incidents", "/settings"].indexOf(pathname),
  );
  const indicatorX = ((rtl ? 3 - index : index) * width) / 4 + width / 8 - 10;
  const icons = {
    index: Home,
    inspections: ClipboardCheck,
    incidents: TriangleAlert,
    settings: Settings,
  };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.foreground,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: {
          borderTopColor: c.border,
          backgroundColor: dark ? "#09090be8" : "#fffffff0",
          height: 78,
          paddingTop: 8,
          paddingBottom: 18,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
          marginTop: 4,
        },
        tabBarBackground: () => (
          <BlurView
            tint={dark ? "dark" : "light"}
            intensity={50}
            style={{ position: "absolute", inset: 0, direction: "ltr" }}
          >
            <MotiView
              animate={{ translateX: indicatorX }}
              transition={{ type: "timing", duration: reduced ? 0 : 250 }}
              style={{
                position: "absolute",
                top: 8,
                left: 0,
                width: 20,
                height: 2,
                borderRadius: 2,
                backgroundColor: c.foreground,
              }}
            />
          </BlurView>
        ),
      }}
    >
      {Object.entries(icons).map(([name, Icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: t(name === "index" ? "home" : name),
            tabBarIcon: ({ focused, color }) => (
              <MotiView
                animate={{ scale: focused && !reduced ? 1.08 : 1 }}
                transition={{ type: "timing", duration: 220 }}
                style={{
                  paddingTop: 5,
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={focused ? 1.8 : 1.4}
                  color={color}
                />
              </MotiView>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
