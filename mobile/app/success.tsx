import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Text, Button } from "../components/ui";
import { SuccessCheck } from "../components/motion/SuccessCheck";
import { Confetti } from "../components/motion/Confetti";
import { FadeInUp } from "../components/motion";
import { useApp, useColors } from "../lib/provider";
export default function Success() {
  const { t, pendingCount } = useApp();
  const c = useColors();
  const router = useRouter();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.background,
        justifyContent: "center",
        padding: 32,
      }}
    >
      <View
        style={{ width: "100%", maxWidth: 420, alignSelf: "center", gap: 24 }}
      >
        <View style={{ alignItems: "center" }}>
          <SuccessCheck />
          <Confetti />
        </View>
        <FadeInUp delay={200}>
          <Text
            size={30}
            weight="semibold"
            style={{ textAlign: "center", letterSpacing: -1 }}
          >
            {t("saved")}
          </Text>
          <Text muted style={{ textAlign: "center", marginTop: 12 }}>
            {t("savedHint")}
          </Text>
          {pendingCount ? (
            <Text
              muted
              size={11}
              style={{ textAlign: "center", marginTop: 16 }}
            >
              {t("queued")}
            </Text>
          ) : null}
        </FadeInUp>
        <Button onPress={() => router.dismissTo("/")}>{t("backHome")}</Button>
      </View>
    </View>
  );
}
