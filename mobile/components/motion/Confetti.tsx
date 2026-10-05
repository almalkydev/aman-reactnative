import React from "react";
import { View } from "react-native";
import { MotiView } from "moti";
import { useApp } from "../../lib/provider";
export function Confetti() {
  const { reduced } = useApp();
  if (reduced) return null;
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", left: "50%", top: 60 }}
    >
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * Math.PI) / 6;
        return (
          <MotiView
            key={i}
            from={{
              opacity: 0.7,
              translateX: 0,
              translateY: 0,
              rotate: "0deg",
            }}
            animate={{
              opacity: 0,
              translateX: Math.cos(angle) * 110,
              translateY: Math.sin(angle) * 90 + 20,
              rotate: `${i * 47}deg`,
            }}
            transition={{ type: "timing", duration: 700, delay: 80 }}
            style={{
              position: "absolute",
              width: 4,
              height: 7,
              borderRadius: 1,
              backgroundColor: i % 3 === 0 ? "#16a34a" : "#71717a",
            }}
          />
        );
      })}
    </View>
  );
}
