import React, { useEffect, useState } from "react";
import { Pressable, Text, View, StyleProp, ViewStyle } from "react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useApp, useColors } from "../../lib/provider";
export function FadeInUp({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const { reduced } = useApp();
  return (
    <MotiView
      from={{ opacity: reduced ? 1 : 0, translateY: reduced ? 0 : 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 300, delay: reduced ? 0 : delay }}
    >
      {children}
    </MotiView>
  );
}
export function PressableScale({
  children,
  onPress,
  style,
  disabled = false,
  label,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  label?: string;
}) {
  const [pressed, setPressed] = useState(false);
  const { reduced } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => {
        if (!reduced)
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
        onPress?.();
      }}
      style={[style, { opacity: disabled ? 0.45 : 1 }]}
    >
      <MotiView
        animate={{ scale: pressed && !reduced ? 0.97 : 1 }}
        transition={{ type: "timing", duration: 180 }}
      >
        {children}
      </MotiView>
    </Pressable>
  );
}
export function CountUp({ value }: { value: number }) {
  const { reduced } = useApp();
  const c = useColors();
  const [shown, setShown] = useState(reduced ? value : 0);
  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      const fraction = Math.min((Date.now() - start) / 800, 1);
      setShown(Math.round(value * (1 - Math.pow(1 - fraction, 3))));
      if (fraction === 1) clearInterval(timer);
    }, 32);
    return () => clearInterval(timer);
  }, [value, reduced]);
  return (
    <Text
      style={{
        fontFamily: "Inter_600SemiBold",
        fontSize: 34,
        letterSpacing: -1.6,
        color: c.foreground,
        fontVariant: ["tabular-nums"],
      }}
    >
      {shown}
    </Text>
  );
}
export function PulseGlow({ children }: { children: React.ReactNode }) {
  const { reduced } = useApp();
  return (
    <MotiView
      from={{ opacity: 1 }}
      animate={{ opacity: reduced ? 1 : 0.65 }}
      transition={{
        type: "timing",
        duration: 1600,
        loop: !reduced,
        repeatReverse: true,
      }}
    >
      {children}
    </MotiView>
  );
}
export function Shimmer({ height = 72 }: { height?: number }) {
  const c = useColors();
  const { reduced } = useApp();
  return (
    <View
      accessible
      accessibilityLabel="Loading"
      style={{
        height,
        backgroundColor: c.subtle,
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      <MotiView
        from={{ translateX: -300 }}
        animate={{ translateX: 500 }}
        transition={{ type: "timing", duration: 1400, loop: !reduced }}
      >
        <LinearGradient
          colors={[c.subtle, c.border, c.subtle]}
          style={{ height, width: 200, opacity: reduced ? 0 : 0.4 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </MotiView>
    </View>
  );
}
