import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import {
  Plus,
  ArrowUpRight,
  ArrowUpLeft,
  ClipboardCheck,
  TriangleAlert,
  ShieldCheck,
  MapPin,
} from "lucide-react-native";
import {
  Screen,
  Text,
  Card,
  Row,
  Button,
  Sheet,
  Skeleton,
  ErrorState,
  Empty,
} from "../../components/ui";
import { CountUp, FadeInUp, PressableScale } from "../../components/motion";
import { Chart } from "../../components/Chart";
import { ReportRow } from "../../components/ReportRow";
import { useApp, useColors } from "../../lib/provider";
import { useResource } from "../../lib/useResource";
import type { Dashboard } from "../../lib/types";
export default function Home() {
  const { user, t, sync, language, rtl } = useApp();
  const DirectionArrow = rtl ? ArrowUpLeft : ArrowUpRight;
  const c = useColors();
  const router = useRouter();
  const [sheet, setSheet] = useState(false),
    [refresh, setRefresh] = useState(false);
  const data = useResource<Dashboard>("/dashboard");
  async function reload() {
    setRefresh(true);
    await sync();
    await data.reload();
    setRefresh(false);
  }
  return (
    <View style={{ flex: 1 }}>
      <Screen
        title={`${t("goodMorning")}, ${user?.name.split(" ")[0]}.`}
        subtitle={new Date().toLocaleDateString(
          language === "ar" ? "ar-OM" : "en-GB",
          {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "Asia/Muscat",
          },
        )}
        refresh={refresh}
        onRefresh={() => void reload()}
        action={
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: c.foreground,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text weight="semibold" style={{ color: c.background }}>
              {user?.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </Text>
          </View>
        }
      >
        <Row style={{ justifyContent: "space-between" }}>
          <Row>
            <MapPin size={13} color={c.muted} />
            <Text size={12} muted>
              {t(user?.role === "admin" ? "allSites" : "siteScope")} · Oman
            </Text>
          </Row>
          <Text size={9} muted style={{ letterSpacing: 1.4 }}>
            {t("demo")}
          </Text>
        </Row>
        {data.loading ? (
          <Skeleton />
        ) : data.error ? (
          <ErrorState message={data.error} onRetry={() => void data.reload()} />
        ) : data.data ? (
          <>
            <FadeInUp>
              <Card
                style={{
                  backgroundColor: c.foreground,
                  padding: 24,
                  borderColor: c.foreground,
                }}
              >
                <Row style={{ justifyContent: "space-between" }}>
                  <Text
                    size={10}
                    style={{
                      color: c.background,
                      opacity: 0.65,
                      letterSpacing: 1.8,
                    }}
                  >
                    {t("safetyPulse").toUpperCase()}
                  </Text>
                  <ShieldCheck
                    color={c.background}
                    size={22}
                    strokeWidth={1.25}
                  />
                </Row>
                <Text
                  size={25}
                  weight="semibold"
                  style={{
                    color: c.background,
                    marginTop: 22,
                    letterSpacing: -0.8,
                  }}
                >
                  {t("siteReady")}
                </Text>
                <Text
                  size={12}
                  style={{ color: c.background, opacity: 0.6, marginTop: 5 }}
                >
                  {t("shiftNote")}
                </Text>
                <View
                  style={{
                    height: 1,
                    backgroundColor: c.background,
                    opacity: 0.15,
                    marginVertical: 20,
                  }}
                />
                <PressableScale onPress={() => router.push("/inspection/new")}>
                  <Row style={{ justifyContent: "space-between" }}>
                    <Text
                      size={12}
                      weight="medium"
                      style={{ color: c.background }}
                    >
                      {t("newInspection")}
                    </Text>
                    <DirectionArrow color={c.background} size={18} />
                  </Row>
                </PressableScale>
              </Card>
            </FadeInUp>
            <Row style={{ alignItems: "stretch", gap: 8 }}>
              {[
                {
                  label: "openIncidents",
                  value: data.data.open_incidents,
                  path: "/incidents",
                  color: c.warning,
                },
                {
                  label: "inspectionsToday",
                  value: data.data.inspections_today,
                  path: "/inspections",
                  color: c.success,
                },
                {
                  label: "failed",
                  value: data.data.failed_inspections,
                  path: "/inspections",
                  color: c.danger,
                },
              ].map((stat, i) => (
                <View key={stat.label} style={{ flex: 1 }}>
                  <FadeInUp delay={(i + 1) * 60}>
                    <PressableScale
                      onPress={() => router.push(stat.path as "/incidents")}
                    >
                      <Card style={{ padding: 13, minHeight: 132 }}>
                        <View
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: 5,
                            backgroundColor: stat.color,
                            marginBottom: 10,
                          }}
                        />
                        <CountUp value={stat.value} />
                        <Text muted size={10} style={{ marginTop: 5 }}>
                          {t(stat.label)}
                        </Text>
                      </Card>
                    </PressableScale>
                  </FadeInUp>
                </View>
              ))}
            </Row>
            <FadeInUp delay={220}>
              <Card>
                <Row
                  style={{ justifyContent: "space-between", marginBottom: 24 }}
                >
                  <Text weight="semibold">{t("trend")}</Text>
                  <Text muted size={10}>
                    {t("lastWeek")}
                  </Text>
                </Row>
                <Chart days={data.data.days} />
              </Card>
            </FadeInUp>
            <View>
              <Row style={{ justifyContent: "space-between" }}>
                <Text weight="semibold" size={17}>
                  {t("activity")}
                </Text>
                <PressableScale onPress={() => router.push("/incidents")}>
                  <Text muted size={11}>
                    {t("viewAll")} ↗
                  </Text>
                </PressableScale>
              </Row>
              {data.data.recent.length ? (
                data.data.recent.map((r, i) => (
                  <FadeInUp key={r.id} delay={Math.min(i, 4) * 60}>
                    <ReportRow report={r} kind={r.kind || "incidents"} />
                  </FadeInUp>
                ))
              ) : (
                <Empty message={t("noActivity")} />
              )}
            </View>
            {data.cached ? (
              <Text muted size={11}>
                {t("cached")}
              </Text>
            ) : null}
          </>
        ) : null}
      </Screen>
      <PressableScale
        label={t("newReport")}
        onPress={() => setSheet(true)}
        style={{ position: "absolute", right: 22, bottom: 20 }}
      >
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: c.foreground,
            boxShadow: "0 5px 14px #00000020",
          }}
        >
          <Plus size={24} color={c.background} />
        </View>
      </PressableScale>
      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title={t("newReport")}
      >
        <Text muted style={{ marginBottom: 10 }}>
          {t("newSubtitle")}
        </Text>
        <Button
          onPress={() => {
            setSheet(false);
            router.push("/inspection/new");
          }}
          icon={<ClipboardCheck size={17} color={c.background} />}
        >
          {t("newInspection")}
        </Button>
        <Button
          variant="secondary"
          onPress={() => {
            setSheet(false);
            router.push("/incident/new");
          }}
          icon={<TriangleAlert size={17} color={c.foreground} />}
        >
          {t("reportIncident")}
        </Button>
      </Sheet>
    </View>
  );
}
