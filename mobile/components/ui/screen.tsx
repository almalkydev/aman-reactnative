import React from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { ArrowLeft, ArrowRight, Inbox } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useApp, useColors } from "../../lib/provider";
import { PressableScale, Shimmer } from "../motion";
import { Text, Row } from "./typography";
import { Card, Button } from "./controls";

export function Screen({
  children,
  title,
  subtitle,
  back = false,
  refresh,
  onRefresh,
  action,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  back?: boolean;
  refresh?: boolean;
  onRefresh?: () => void;
  action?: React.ReactNode;
}) {
  const c = useColors();
  const { rtl, t } = useApp();
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <View
        style={{
          height: collapsed ? 44 : 0,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: c.background,
          overflow: "hidden",
          borderBottomWidth: collapsed ? 1 : 0,
          borderColor: c.border,
          justifyContent: "center",
        }}
      >
        {collapsed ? (
          <Text weight="semibold" style={{ textAlign: "center" }}>
            {title}
          </Text>
        ) : null}
      </View>
      <ScrollView
        onScroll={(e) => {
          const next = e.nativeEvent.contentOffset.y > 85;
          if (next !== collapsed) setCollapsed(next);
        }}
        scrollEventThrottle={32}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refresh}
              onRefresh={onRefresh}
              tintColor={c.foreground}
            />
          ) : undefined
        }
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 100,
          width: "100%",
          maxWidth: 880,
          alignSelf: "center",
          gap: 22,
        }}
      >
        {back ? (
          <PressableScale onPress={() => router.back()} label={t("back")}>
            <Row>
              {rtl ? (
                <ArrowRight size={19} color={c.foreground} />
              ) : (
                <ArrowLeft size={19} color={c.foreground} />
              )}
              <Text muted>{t("back")}</Text>
            </Row>
          </PressableScale>
        ) : null}
        <Row
          style={{ justifyContent: "space-between", alignItems: "flex-start" }}
        >
          <View style={{ flex: 1 }}>
            <Text size={30} weight="semibold" style={{ letterSpacing: -1.2 }}>
              {title}
            </Text>
            {subtitle ? (
              <Text muted size={13} style={{ marginTop: 4 }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {action}
        </Row>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Empty({ message }: { message?: string }) {
  const { t } = useApp();
  const c = useColors();
  return (
    <View style={{ paddingVertical: 50, alignItems: "center", gap: 10 }}>
      <Inbox color={c.muted} size={32} strokeWidth={1.25} />
      <Text weight="medium">{message || t("noReports")}</Text>
      <Text muted size={12}>
        {t("noReportsHint")}
      </Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const { t } = useApp();
  return (
    <Card>
      <Text style={{ marginBottom: 14 }}>{message}</Text>
      <Button variant="secondary" onPress={onRetry}>
        {t("retry")}
      </Button>
    </Card>
  );
}

export function Skeleton() {
  return (
    <View>
      <Shimmer height={100} />
      <Shimmer />
      <Shimmer />
      <Shimmer />
    </View>
  );
}
