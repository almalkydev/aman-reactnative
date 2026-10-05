import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import {
  Screen,
  Input,
  Tabs,
  Text,
  Button,
  ErrorState,
  Skeleton,
  Empty,
  Row,
  Sheet,
} from "./ui";
import { ReportRow } from "./ReportRow";
import { FadeInUp, PressableScale } from "./motion";
import { useApp, useColors } from "../lib/provider";
import { useResource } from "../lib/useResource";
import { pending } from "../lib/storage";
import { api } from "../lib/api";
import type { Report } from "../lib/types";
export function ReportList({ kind }: { kind: "incidents" | "inspections" }) {
  const { user, t, sync, revision, notify, rtl, reduced, online } = useApp();
  const c = useColors();
  const router = useRouter();
  const resource = useResource<Report[]>("/" + kind);
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [severity, setSeverity] = useState("all"),
    [local, setLocal] = useState<Report[]>([]),
    [refreshing, setRefreshing] = useState(false),
    [closeId, setCloseId] = useState<string | null>(null);
  const incident = kind === "incidents";
  useEffect(() => {
    if (!user) return;
    void pending(user.id).then((rows) =>
      setLocal(
        rows
          .filter((r) => r.kind === kind)
          .map((r) => ({
            ...JSON.parse(r.payload),
            user_id: user.id,
            created_at: r.created_at,
            status:
              kind === "incidents"
                ? "open"
                : JSON.parse(r.payload).answers.some(
                      (a: { result: string }) => a.result === "fail",
                    )
                  ? "failed"
                  : "completed",
            pending: true,
          })),
      ),
    );
  }, [user, kind, revision]);
  async function refresh() {
    setRefreshing(true);
    if (!reduced) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sync();
    await resource.reload();
    setRefreshing(false);
  }
  const rows = [
    ...local,
    ...(resource.data || []).filter((r) => !local.some((l) => l.id === r.id)),
  ].filter(
    (r) =>
      (status === "all" || r.status === status) &&
      (severity === "all" || r.severity === severity) &&
      `${r.title || r.equipment_name} ${r.site_name || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  async function close() {
    if (!closeId) return;
    try {
      await api(`/incidents/${closeId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "closed" }),
      });
      setCloseId(null);
      await resource.reload();
      notify(t("saved"));
    } catch (e) {
      notify(e instanceof Error ? e.message : t("error"));
    }
  }
  function actions(report: Report) {
    return (
      <Row style={{ paddingHorizontal: 8 }}>
        <Button
          variant="secondary"
          onPress={() => router.push(`/report/incidents/${report.id}`)}
        >
          {t("assign")}
        </Button>
        <Button onPress={() => setCloseId(report.id)}>{t("close")}</Button>
      </Row>
    );
  }
  return (
    <Screen
      title={t(kind)}
      subtitle={t(incident ? "incidentsHint" : "inspectionsHint")}
      refresh={refreshing}
      onRefresh={() => void refresh()}
      action={
        <PressableScale
          label={t("newReport")}
          onPress={() =>
            router.push(incident ? "/incident/new" : "/inspection/new")
          }
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: c.foreground,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Plus color={c.background} size={20} />
          </View>
        </PressableScale>
      }
    >
      <Input placeholder={t("search")} value={query} onChangeText={setQuery} />
      <Tabs
        value={status}
        onChange={setStatus}
        values={(incident
          ? ["all", "open", "in_progress", "closed"]
          : ["all", "in_progress", "completed", "failed"]
        ).map((value) => ({ value, label: t(value) }))}
      />
      {incident ? (
        <Tabs
          value={severity}
          onChange={setSeverity}
          values={["all", "low", "medium", "high", "critical"].map((value) => ({
            value,
            label: t(value),
          }))}
        />
      ) : null}
      {resource.loading ? (
        <Skeleton />
      ) : resource.error && !local.length ? (
        <ErrorState
          message={resource.error}
          onRetry={() => void resource.reload()}
        />
      ) : !rows.length ? (
        <Empty />
      ) : (
        <View>
          {rows.map((report, i) => (
            <FadeInUp key={report.id} delay={Math.min(i, 4) * 60}>
              {incident &&
              user?.role !== "worker" &&
              !report.pending &&
              online ? (
                <Swipeable
                  renderRightActions={rtl ? undefined : () => actions(report)}
                  renderLeftActions={rtl ? () => actions(report) : undefined}
                  overshootRight={false}
                  overshootLeft={false}
                >
                  <ReportRow report={report} kind={kind} />
                </Swipeable>
              ) : (
                <ReportRow report={report} kind={kind} />
              )}
            </FadeInUp>
          ))}
        </View>
      )}
      {resource.cached ? (
        <Text muted size={11}>
          {t("cached")}
        </Text>
      ) : null}
      <Sheet
        open={!!closeId}
        onClose={() => setCloseId(null)}
        title={t("close")}
      >
        <Button onPress={() => void close()}>{t("close")}</Button>
        <Button variant="ghost" onPress={() => setCloseId(null)}>
          {t("cancel")}
        </Button>
      </Sheet>
    </Screen>
  );
}
