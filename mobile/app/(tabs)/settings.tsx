import React, { useState } from "react";
import { View } from "react-native";
import {
  ShieldCheck,
  Globe,
  Sun,
  CloudCheck,
  LogOut,
} from "lucide-react-native";
import {
  Screen,
  Card,
  Text,
  Row,
  Separator,
  Tabs,
  Button,
  Sheet,
} from "../../components/ui";
import { useApp, useColors } from "../../lib/provider";
export default function Settings() {
  const {
    user,
    t,
    theme,
    setTheme,
    language,
    setLanguage,
    logout,
    pendingCount,
    sync,
    syncing,
    online,
  } = useApp();
  const c = useColors();
  const [confirm, setConfirm] = useState(false);
  return (
    <Screen title={t("settings")} subtitle={t("settingsHint")}>
      <Card>
        <Row>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: c.subtle,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text weight="semibold" size={18}>
              {user?.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text weight="semibold" size={16}>
              {user?.name}
            </Text>
            <Text size={12} muted>
              {user?.email}
            </Text>
          </View>
        </Row>
        <Separator />
        <Row style={{ justifyContent: "space-between" }}>
          <Text muted size={12}>
            {t("account")}
          </Text>
          <Text size={12}>{t(user?.role || "worker")}</Text>
        </Row>
      </Card>
      <Card style={{ gap: 16 }}>
        <Row>
          <Sun color={c.foreground} size={18} />
          <Text weight="medium">{t("appearance")}</Text>
        </Row>
        <Tabs
          value={theme}
          onChange={(v) => setTheme(v as typeof theme)}
          values={["system", "light", "dark"].map((value) => ({
            value,
            label: t(value),
          }))}
        />
        <Separator />
        <Row>
          <Globe color={c.foreground} size={18} />
          <Text weight="medium">{t("language")}</Text>
        </Row>
        <Tabs
          value={language}
          onChange={(v) => setLanguage(v as "en" | "ar")}
          values={[
            { value: "en", label: "English" },
            { value: "ar", label: "العربية" },
          ]}
        />
      </Card>
      <Card style={{ gap: 16 }}>
        <Row>
          <CloudCheck color={c.foreground} size={18} />
          <Text weight="medium">{t("syncDetails")}</Text>
        </Row>
        <Text muted size={12}>
          {pendingCount
            ? `${pendingCount} ${t("pending")}`
            : t(online ? "allSynced" : "offline")}
        </Text>
        <Button
          variant="secondary"
          disabled={syncing}
          onPress={() => void sync()}
        >
          {t(syncing ? "syncing" : "syncNow")}
        </Button>
      </Card>
      <Card style={{ gap: 12 }}>
        <Row>
          <ShieldCheck color={c.muted} size={18} />
          <Text weight="medium">{t("about")}</Text>
        </Row>
        <Text muted size={12}>
          {t("demoNote")}
        </Text>
        <Text size={10} muted>
          {t("version")}
        </Text>
      </Card>
      <Button
        variant="secondary"
        onPress={() => setConfirm(true)}
        icon={<LogOut size={16} color={c.foreground} />}
      >
        {t("signOut")}
      </Button>
      <Sheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t("signOut")}
      >
        {pendingCount ? <Text muted>{t("signOutPending")}</Text> : null}
        <Button
          variant="danger"
          disabled={syncing}
          onPress={() => void logout()}
        >
          {t("signOut")}
        </Button>
        <Button variant="ghost" onPress={() => setConfirm(false)}>
          {t("cancel")}
        </Button>
      </Sheet>
    </Screen>
  );
}
