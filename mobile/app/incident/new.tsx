import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
import { Sparkles } from "lucide-react-native";
import {
  Screen,
  Card,
  Text,
  Input,
  Select,
  Button,
  Tabs,
  Label,
  Row,
  Badge,
  ErrorState,
  Skeleton,
} from "../../components/ui";
import { PhotoPicker } from "../../components/PhotoPicker";
import { useApp, useColors } from "../../lib/provider";
import { useResource } from "../../lib/useResource";
import { savePending } from "../../lib/storage";
import { api } from "../../lib/api";
import type { Site } from "../../lib/types";
type Suggestion = {
  category: string;
  suggested_severity: string;
  suggested_team: string;
};
export default function NewIncident() {
  const { user, t, sync, notify, online } = useApp();
  const c = useColors();
  const router = useRouter();
  const sites = useResource<Site[]>("/sites");
  const [title, setTitle] = useState(""),
    [severity, setSeverity] = useState("medium"),
    [category, setCategory] = useState("Equipment"),
    [description, setDescription] = useState(""),
    [photos, setPhotos] = useState<string[]>([]),
    [site, setSite] = useState(user?.site_id || 1),
    [busy, setBusy] = useState(false),
    [aiBusy, setAiBusy] = useState(false),
    [error, setError] = useState(""),
    [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const categories = [
    { value: "Equipment", label: t("equipmentCategory") },
    { value: "Housekeeping", label: t("housekeepingCategory") },
    { value: "Electrical", label: t("electricalCategory") },
    { value: "Fire safety", label: t("fireCategory") },
    { value: "Other", label: t("otherCategory") },
  ];
  if (!categories.some((v) => v.value === category))
    categories.push({ value: category, label: category });
  async function suggest() {
    if (!description.trim()) {
      setError(t("required"));
      return;
    }
    setAiBusy(true);
    setError("");
    try {
      setSuggestion(
        await api<Suggestion>("/incidents/suggest", {
          method: "POST",
          body: JSON.stringify({ description }),
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
    } finally {
      setAiBusy(false);
    }
  }
  async function submit() {
    if (busy) return;
    if (!title.trim() || !description.trim() || !site) {
      setError(t("required"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const id = Crypto.randomUUID();
      await savePending({
        id,
        user_id: user!.id,
        kind: "incidents",
        payload: JSON.stringify({
          id,
          title: title.trim(),
          severity,
          category,
          description: description.trim(),
          photos,
          site_id: site,
        }),
        synced: 0,
        created_at: new Date().toISOString(),
      });
      void sync();
      router.replace("/success");
    } catch (e) {
      notify(e instanceof Error ? e.message : t("error"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen title={t("reportIncident")} subtitle={t("incidentHint")} back>
      {sites.loading ? (
        <Skeleton />
      ) : sites.error ? (
        <ErrorState message={sites.error} onRetry={() => void sites.reload()} />
      ) : (
        <>
          <Card style={{ gap: 22 }}>
            <Input
              label={t("title")}
              placeholder={t("titlePlaceholder")}
              value={title}
              onChangeText={setTitle}
              maxLength={150}
            />
            <View>
              <Label>{t("severity")}</Label>
              <Tabs
                value={severity}
                onChange={setSeverity}
                values={["low", "medium", "high", "critical"].map((value) => ({
                  value,
                  label: t(value),
                }))}
              />
            </View>
            <Select
              label={t("category")}
              value={category}
              onChange={setCategory}
              options={categories}
            />
            <Select
              label={t("site")}
              value={site}
              onChange={setSite}
              options={(sites.data || []).map((s) => ({
                value: s.id,
                label: t(s.name),
              }))}
            />
            <Input
              label={t("description")}
              placeholder={t("descriptionPlaceholder")}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={5000}
            />
            <Button
              variant="secondary"
              disabled={aiBusy || !online}
              onPress={() => void suggest()}
              icon={<Sparkles size={16} color={c.foreground} />}
            >
              {t(aiBusy ? "loading" : "suggestAI")}
            </Button>
            <Text muted size={10}>
              {t("aiConsent")}
            </Text>
          </Card>
          {suggestion ? (
            <Card style={{ gap: 12 }}>
              <Row>
                <Sparkles size={16} color={c.foreground} />
                <Text weight="semibold">{t("aiSuggestion")}</Text>
              </Row>
              <Text>{suggestion.category}</Text>
              <Badge value={suggestion.suggested_severity} />
              <Text muted size={12}>
                {t("team")}: {suggestion.suggested_team}
              </Text>
              <Text muted size={11}>
                {t("aiNote")}
              </Text>
              <Button
                onPress={() => {
                  setCategory(suggestion.category);
                  setSeverity(suggestion.suggested_severity);
                  setSuggestion(null);
                }}
              >
                {t("apply")}
              </Button>
              <Button variant="ghost" onPress={() => setSuggestion(null)}>
                {t("dismiss")}
              </Button>
            </Card>
          ) : null}
          <Card style={{ gap: 14 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <Text weight="medium">{t("photos")}</Text>
              <Text muted size={11}>
                {photos.length}/4
              </Text>
            </Row>
            <PhotoPicker photos={photos} onChange={setPhotos} />
          </Card>
          {error ? (
            <Text size={12} style={{ color: c.danger }}>
              {error}
            </Text>
          ) : null}
          <Button disabled={busy} onPress={() => void submit()}>
            {t(busy ? "saving" : "submitIncident")}
          </Button>
          <Text muted size={11} style={{ textAlign: "center" }}>
            {t("offlineHint")}
          </Text>
        </>
      )}
    </Screen>
  );
}
