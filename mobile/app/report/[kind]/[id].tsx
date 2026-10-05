import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  Screen,
  Card,
  Text,
  Row,
  Badge,
  Select,
  Button,
  Separator,
  Skeleton,
  ErrorState,
} from "../../../components/ui";
import { PhotoGrid } from "../../../components/PhotoPicker";
import { useApp, useColors } from "../../../lib/provider";
import { useResource } from "../../../lib/useResource";
import { pending } from "../../../lib/storage";
import { api } from "../../../lib/api";
import type { Report, User } from "../../../lib/types";
export default function Detail() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  const valid = kind === "incidents" || kind === "inspections";
  const { user, t, notify, language, online } = useApp();
  const c = useColors();
  const resource = useResource<Report>(valid ? `/${kind}/${id}` : "/invalid");
  const [local, setLocal] = useState<Report | null>(null),
    [people, setPeople] = useState<User[]>([]),
    [status, setStatus] = useState("open"),
    [assigned, setAssigned] = useState<number | null>(null),
    [busy, setBusy] = useState(false);
  const data = local || resource.data;
  useEffect(() => {
    if (!user) return;
    void pending(user.id).then((rows) => {
      const row = rows.find((r) => r.id === id);
      if (row)
        setLocal({
          ...JSON.parse(row.payload),
          created_at: row.created_at,
          pending: true,
          status:
            kind === "incidents"
              ? "open"
              : JSON.parse(row.payload).answers.some(
                    (a: { result: string }) => a.result === "fail",
                  )
                ? "failed"
                : "completed",
          reporter_name: user.name,
        });
    });
  }, [id, user]);
  useEffect(() => {
    if (data) {
      setStatus(data.status);
      setAssigned(data.assigned_to || null);
    }
  }, [data]);
  useEffect(() => {
    if (user?.role !== "worker" && online && kind === "incidents")
      void api<User[]>("/users")
        .then(setPeople)
        .catch(() => {});
  }, [user, online, kind]);
  async function save() {
    if (!data) return;
    setBusy(true);
    try {
      await api(`/incidents/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, assigned_to: assigned }),
      });
      await resource.reload();
      notify(t("saved"));
    } catch (e) {
      notify(e instanceof Error ? e.message : t("error"));
    } finally {
      setBusy(false);
    }
  }
  function eventText(value: string) {
    if (value.startsWith("Status changed to "))
      return `${t("statusChanged")} ${t(value.replace("Status changed to ", ""))}`;
    if (value.startsWith("Report created")) return t("reportCreated");
    if (value === "Report assigned") return t("reportAssigned");
    if (value === "Assignment removed") return t("assignmentRemoved");
    return value;
  }
  return (
    <Screen
      title={data?.title || data?.equipment_name || t("details")}
      subtitle={data?.site_name}
      back
    >
      {!data && resource.loading ? (
        <Skeleton />
      ) : !data ? (
        <ErrorState
          message={resource.error || t("error")}
          onRetry={() => void resource.reload()}
        />
      ) : (
        <>
          <Row>
            <Badge value={data.status} />
            {data.severity ? <Badge value={data.severity} /> : null}
            {data.pending ? (
              <Text muted size={11}>
                {t("queued")}
              </Text>
            ) : null}
          </Row>
          <Card style={{ gap: 14 }}>
            <Text muted size={11}>
              {t("reportedBy")}
            </Text>
            <Text weight="medium">{data.reporter_name || user?.name}</Text>
            <Text muted size={11}>
              {new Date(data.created_at).toLocaleString(
                language === "ar" ? "ar-OM" : "en-GB",
                { timeZone: "Asia/Muscat" },
              )}
            </Text>
            {data.description ? (
              <>
                <Separator />
                <Text>{data.description}</Text>
                <Text muted size={12}>
                  {data.category}
                </Text>
              </>
            ) : null}
          </Card>
          {kind === "inspections" ? (
            data.answers?.map((answer, i) => (
              <Card key={answer.question_id} style={{ gap: 12 }}>
                <Text muted size={10}>
                  {t("question")} {i + 1}
                </Text>
                <Text>
                  {(answer.text ? t(answer.text) : null) ||
                    `${t("questionFallback")} ${i + 1}`}
                </Text>
                <Badge value={answer.result} />
                {answer.note ? <Text muted>{answer.note}</Text> : null}
                {answer.photo_url ? (
                  <PhotoGrid photos={[answer.photo_url]} />
                ) : null}
              </Card>
            ))
          ) : (
            <>
              {data.photos?.length ? (
                <Card>
                  <PhotoGrid photos={data.photos} />
                </Card>
              ) : null}
              <Card style={{ gap: 12 }}>
                <Text weight="semibold">{t("assignedTo")}</Text>
                <Text muted>{data.assigned_name || t("unassigned")}</Text>
              </Card>
              {user?.role !== "worker" && !data.pending ? (
                <Card style={{ gap: 18 }}>
                  <Select
                    label={t("status")}
                    value={status}
                    onChange={setStatus}
                    options={["open", "in_progress", "closed"].map((value) => ({
                      value,
                      label: t(value),
                    }))}
                  />
                  <Select
                    label={t("assignedTo")}
                    value={assigned || 0}
                    onChange={(v) => setAssigned(v || null)}
                    options={[
                      { value: 0, label: t("unassigned") },
                      ...people
                        .filter(
                          (p) =>
                            p.site_id === data.site_id || p.role === "admin",
                        )
                        .map((p) => ({ value: p.id, label: p.name })),
                    ]}
                  />
                  <Button
                    disabled={busy || !online}
                    onPress={() => void save()}
                  >
                    {t(busy ? "saving" : "save")}
                  </Button>
                  {!online ? (
                    <Text muted size={11}>
                      {t("onlineRequired")}
                    </Text>
                  ) : null}
                </Card>
              ) : null}
              <Card style={{ gap: 18 }}>
                <Text weight="semibold">{t("timeline")}</Text>
                {data.timeline?.length ? (
                  data.timeline.map((event) => (
                    <Row key={event.id} style={{ alignItems: "flex-start" }}>
                      <View
                        style={{
                          width: 7,
                          height: 7,
                          marginTop: 6,
                          borderRadius: 5,
                          backgroundColor: c.foreground,
                        }}
                      />
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text size={12}>{eventText(event.text)}</Text>
                        <Text muted size={10}>
                          {event.name} ·{" "}
                          {new Date(event.created_at).toLocaleString(
                            language === "ar" ? "ar-OM" : "en-GB",
                          )}
                        </Text>
                      </View>
                    </Row>
                  ))
                ) : (
                  <Text muted>{t("queued")}</Text>
                )}
              </Card>
            </>
          )}
          {resource.cached ? (
            <Text muted size={11}>
              {t("cached")}
            </Text>
          ) : null}
        </>
      )}
    </Screen>
  );
}
