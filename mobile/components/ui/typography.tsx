import React from "react";
import {
  Text as NativeText,
  View,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useApp, useColors } from "../../lib/provider";

export function Text({
  children,
  muted = false,
  size = 14,
  weight = "regular",
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  size?: number;
  weight?: "regular" | "medium" | "semibold";
  style?: StyleProp<TextStyle>;
}) {
  const c = useColors();
  const { rtl } = useApp();
  return (
    <NativeText
      style={[
        {
          color: muted ? c.muted : c.foreground,
          fontSize: size,
          lineHeight: size * 1.5,
          fontFamily: rtl
            ? Platform.OS === "web"
              ? "Arial"
              : Platform.OS === "android"
                ? "sans-serif"
                : undefined
            : weight === "semibold"
              ? "Inter_600SemiBold"
              : weight === "medium"
                ? "Inter_500Medium"
                : "Inter_400Regular",
          textAlign: rtl ? "right" : "left",
          fontWeight: rtl
            ? weight === "semibold"
              ? "600"
              : weight === "medium"
                ? "500"
                : "400"
            : undefined,
        },
        style,
      ]}
    >
      {children}
    </NativeText>
  );
}

export function Row({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { rtl } = useApp();
  return (
    <View
      style={[
        {
          direction: "ltr",
          flexDirection: rtl ? "row-reverse" : "row",
          alignItems: "center",
          gap: 10,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
