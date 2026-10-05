import React from "react";
import { View } from "react-native";
import { Check } from "lucide-react-native";
import { FadeInUp } from "./index";
export function SuccessCheck() {
  return (
    <FadeInUp>
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: "#16a34a15",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Check size={56} color="#16a34a" />
      </View>
    </FadeInUp>
  );
}
