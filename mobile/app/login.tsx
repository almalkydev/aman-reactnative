import React, { useState } from "react";
import { View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Card, Text, Row, Input, Button, Separator } from "../components/ui";
import { FadeInUp, PressableScale } from "../components/motion";
import { useApp, useColors } from "../lib/provider";
export default function Login() {
  const { login, t, dark, reduced, language, setLanguage } = useApp();
  const c = useColors();
  const [email, setEmail] = useState("worker@aman.demo"),
    [password, setPassword] = useState("AmanDemo2026!"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [show, setShow] = useState(false),
    [shake, setShake] = useState(0);
  async function submit() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await login(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("invalidServer"));
      setShake((v) => v + 1);
      if (!reduced)
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: c.background, overflow: "hidden" }}
    >
      <MotiView
        from={{ translateX: -35, opacity: 0.4 }}
        animate={{ translateX: reduced ? 0 : 35, opacity: 0.8 }}
        transition={{
          type: "timing",
          duration: 7000,
          loop: !reduced,
          repeatReverse: true,
        }}
        style={{ position: "absolute", inset: -80 }}
      >
        <LinearGradient
          colors={
            dark
              ? ["#09090b", "#242428", "#09090b"]
              : ["#ffffff", "#ededf0", "#ffffff"]
          }
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </MotiView>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View
          style={{ maxWidth: 420, width: "100%", alignSelf: "center", gap: 28 }}
        >
          <Row style={{ justifyContent: "space-between" }}>
            <Text size={48} weight="semibold" style={{ letterSpacing: -4 }}>
              aman
              <Text size={14} muted>
                {" "}
                / أمان
              </Text>
            </Text>
            <PressableScale
              onPress={() => setLanguage(language === "en" ? "ar" : "en")}
            >
              <Text muted size={13}>
                {language === "en" ? "العربية" : "English"}
              </Text>
            </PressableScale>
          </Row>
          <FadeInUp delay={80}>
            <View style={{ gap: 8 }}>
              <Row>
                <ShieldCheck size={14} color={c.muted} />
                <Text
                  size={10}
                  muted
                  weight="medium"
                  style={{ letterSpacing: 1.8 }}
                >
                  {t("appTag")}
                </Text>
              </Row>
              <Text
                size={33}
                weight="semibold"
                style={{ letterSpacing: -1.3, lineHeight: 41 }}
              >
                {t("welcome")}
              </Text>
              <Text muted>{t("loginSubtitle")}</Text>
            </View>
          </FadeInUp>
          <MotiView
            key={shake}
            from={{ translateX: shake && !reduced ? -7 : 0 }}
            animate={{ translateX: 0 }}
            transition={{ type: "spring", damping: 9, stiffness: 220 }}
          >
            <FadeInUp delay={160}>
              <Card style={{ padding: 24, gap: 20 }}>
                <Input
                  label={t("email")}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                <View>
                  <Input
                    label={t("password")}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!show}
                    autoComplete="password"
                    onSubmitEditing={() => void submit()}
                  />
                  <PressableScale
                    onPress={() => setShow(!show)}
                    label={t(show ? "hidePassword" : "showPassword")}
                    style={{ position: "absolute", right: 12, top: 40 }}
                  >
                    {show ? (
                      <EyeOff size={18} color={c.muted} />
                    ) : (
                      <Eye size={18} color={c.muted} />
                    )}
                  </PressableScale>
                </View>
                {error ? (
                  <Text size={12} style={{ color: c.danger }}>
                    {error}
                  </Text>
                ) : null}
                <Button
                  onPress={() => void submit()}
                  disabled={busy}
                  icon={<ArrowRight size={16} color={c.background} />}
                >
                  {t(busy ? "signingIn" : "signIn")}
                </Button>
                <Separator />
                <Text size={12} muted>
                  {t("demoAccounts")}
                </Text>
                <Row style={{ flexWrap: "wrap" }}>
                  {["worker", "supervisor", "admin"].map((role) => (
                    <PressableScale
                      key={role}
                      onPress={() => {
                        setEmail(`${role}@aman.demo`);
                        setPassword("AmanDemo2026!");
                      }}
                    >
                      <View
                        style={{
                          padding: 8,
                          paddingHorizontal: 11,
                          borderWidth: 1,
                          borderColor: c.border,
                          borderRadius: 8,
                        }}
                      >
                        <Text size={11}>{t(role)}</Text>
                      </View>
                    </PressableScale>
                  ))}
                </Row>
                <Text size={11} muted>
                  {t("demoPassword")}
                </Text>
              </Card>
            </FadeInUp>
          </MotiView>
          <Text muted size={10} style={{ textAlign: "center", lineHeight: 17 }}>
            {t("demoNote")}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
