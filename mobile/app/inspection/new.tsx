import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
import { MotiView } from "moti";
import { Check, X, Minus } from "lucide-react-native";
import {
  Screen,
  Card,
  Text,
  Row,
  Input,
  Select,
  Button,
  Progress,
  Badge,
  Skeleton,
  ErrorState,
} from "../../components/ui";
import { PhotoPicker } from "../../components/PhotoPicker";
import { FadeInUp, PressableScale } from "../../components/motion";
import { useApp, useColors } from "../../lib/provider";
import { useResource } from "../../lib/useResource";
import { readCache, writeCache, savePending } from "../../lib/storage";
import { api } from "../../lib/api";
import type { Site, Template, Question, Answer } from "../../lib/types";
export default function NewInspection() {
  const { user, t, sync, notify, reduced } = useApp();
  const c = useColors();
  const router = useRouter();
  const sites = useResource<Site[]>("/sites"),
    templates = useResource<Template[]>("/templates");
  const [template, setTemplate] = useState(1),
    [site, setSite] = useState(user?.site_id || 1),
    [equipment, setEquipment] = useState(""),
    [questions, setQuestions] = useState<Question[]>([]),
    [answers, setAnswers] = useState<Answer[]>([]),
    [step, setStep] = useState(-1),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const question = questions[step];
  const answer = answers[step];
  const review = step === questions.length && step >= 0;
  async function start() {
    if (!equipment.trim()) {
      setError(t("required"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      let list: Question[];
      try {
        list = await api<Question[]>(`/templates/${template}/questions`);
        await writeCache(`${user!.id}:/templates/${template}/questions`, list);
      } catch {
        list =
          (await readCache<Question[]>(
            `${user!.id}:/templates/${template}/questions`,
          )) || [];
      }
      if (!list.length) throw new Error(t("noTemplates"));
      setQuestions(list);
      setAnswers(
        list.map((q) => ({
          question_id: q.id,
          text: q.text,
          result: "na",
          note: "",
        })),
      );
      setStep(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
    } finally {
      setBusy(false);
    }
  }
  const [chosen, setChosen] = useState<number[]>([]);
  function update(value: Partial<Answer>) {
    setAnswers((previous) =>
      previous.map((a, i) => (i === step ? { ...a, ...value } : a)),
    );
    if (value.result)
      setChosen((previous) =>
        previous.includes(step) ? previous : [...previous, step],
      );
  }
  function next() {
    if (!chosen.includes(step)) {
      setError(t("required"));
      return;
    }
    if (answer.result === "fail" && !answer.note.trim()) {
      setError(t("failNote"));
      return;
    }
    setError("");
    setStep(step + 1);
  }
  async function submit() {
    if (busy) return;
    if (
      chosen.length !== questions.length ||
      answers.some((a) => a.result === "fail" && !a.note.trim())
    ) {
      setError(t("failNote"));
      return;
    }
    setBusy(true);
    try {
      const id = Crypto.randomUUID();
      await savePending({
        id,
        user_id: user!.id,
        kind: "inspections",
        payload: JSON.stringify({
          id,
          template_id: template,
          site_id: site,
          equipment_name: equipment.trim(),
          answers,
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
    <Screen
      title={t(step < 0 ? "newInspection" : review ? "summary" : "checklist")}
      subtitle={step < 0 ? t("inspectHint") : equipment}
      back
    >
      {step < 0 ? (
        <>
          {sites.loading || templates.loading ? (
            <Skeleton />
          ) : sites.error || templates.error ? (
            <ErrorState
              message={sites.error || templates.error}
              onRetry={() => {
                void sites.reload();
                void templates.reload();
              }}
            />
          ) : (
            <Card style={{ gap: 22 }}>
              <Select
                label={t("template")}
                value={template}
                options={(templates.data || []).map((v) => ({
                  value: v.id,
                  label: t(v.name),
                }))}
                onChange={setTemplate}
              />
              <Select
                label={t("site")}
                value={site}
                options={(sites.data || []).map((v) => ({
                  value: v.id,
                  label: t(v.name),
                }))}
                onChange={setSite}
              />
              <Input
                label={t("equipment")}
                value={equipment}
                onChangeText={setEquipment}
                placeholder={t("equipmentPlaceholder")}
                maxLength={120}
              />
              <Text muted size={12}>
                {templates.data?.find((v) => v.id === template)
                  ?.question_count || 9}{" "}
                {t("checks")} · {t("offlineHint")}
              </Text>
              <Button disabled={busy} onPress={() => void start()}>
                {t("start")}
              </Button>
            </Card>
          )}
        </>
      ) : (
        <>
          <Row style={{ justifyContent: "space-between" }}>
            <Text muted size={12}>
              {t("progress")}
            </Text>
            <Text size={12} weight="medium">
              {Math.min(step + 1, questions.length)} / {questions.length}
            </Text>
          </Row>
          <Progress value={chosen.length / questions.length} />
          {review ? (
            <>
              <Card style={{ gap: 16 }}>
                <Text size={21} weight="semibold">
                  {t("inspectionReady")}
                </Text>
                <Text muted size={12}>
                  {t("reviewHint")}
                </Text>
                <Row>
                  {["pass", "fail", "na"].map((result) => (
                    <View key={result} style={{ flex: 1, gap: 8 }}>
                      <Text size={26} weight="semibold">
                        {answers.filter((a) => a.result === result).length}
                      </Text>
                      <Badge value={result} />
                    </View>
                  ))}
                </Row>
              </Card>
              {answers.map((a, i) => (
                <Card key={a.question_id} style={{ gap: 10 }}>
                  <Row style={{ justifyContent: "space-between" }}>
                    <Text muted size={11}>
                      {t("question")} {i + 1}
                    </Text>
                    <PressableScale onPress={() => setStep(i)}>
                      <Text size={12}>{t("edit")}</Text>
                    </PressableScale>
                  </Row>
                  <Text>{t(questions[i].text)}</Text>
                  <Badge value={a.result} />
                  {a.note ? (
                    <Text muted size={12}>
                      {a.note}
                    </Text>
                  ) : null}
                </Card>
              ))}
              <Button disabled={busy} onPress={() => void submit()}>
                {t(busy ? "saving" : "submitInspection")}
              </Button>
            </>
          ) : question ? (
            <FadeInUp key={step}>
              <Card style={{ gap: 24 }}>
                <Text muted size={10} style={{ letterSpacing: 1.5 }}>
                  {t("question").toUpperCase()}{" "}
                  {String(step + 1).padStart(2, "0")}
                </Text>
                <Text
                  size={23}
                  weight="semibold"
                  style={{ letterSpacing: -0.5 }}
                >
                  {t(question.text)}
                </Text>
                <Row style={{ gap: 8 }}>
                  {(["pass", "fail", "na"] as const).map((result) => {
                    const Icon =
                      result === "pass" ? Check : result === "fail" ? X : Minus;
                    const active =
                      chosen.includes(step) && answer.result === result;
                    const color =
                      result === "pass"
                        ? c.success
                        : result === "fail"
                          ? c.danger
                          : c.muted;
                    return (
                      <PressableScale
                        key={result}
                        onPress={() => update({ result })}
                        style={{ flex: 1 }}
                      >
                        <MotiView
                          animate={{
                            backgroundColor: active ? color + "15" : c.card,
                            borderColor: active ? color : c.border,
                          }}
                          transition={{
                            type: "timing",
                            duration: reduced ? 0 : 200,
                          }}
                          style={{
                            borderWidth: 1,
                            borderRadius: 12,
                            paddingVertical: 18,
                            alignItems: "center",
                            gap: 7,
                          }}
                        >
                          <Icon size={21} color={active ? color : c.muted} />
                          <Text
                            size={12}
                            weight="medium"
                            style={{ color: active ? color : c.foreground }}
                          >
                            {t(result)}
                          </Text>
                        </MotiView>
                      </PressableScale>
                    );
                  })}
                </Row>
                {chosen.includes(step) && answer.result === "fail" ? (
                  <MotiView
                    from={{
                      opacity: reduced ? 1 : 0,
                      translateX: reduced ? 0 : -5,
                    }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: "spring", damping: 12 }}
                    style={{ gap: 16 }}
                  >
                    <Input
                      label={t("notes")}
                      placeholder={t("notesPlaceholder")}
                      value={answer.note}
                      onChangeText={(note) => update({ note })}
                      multiline
                      maxLength={2000}
                    />
                    <PhotoPicker
                      photos={answer.photo_url ? [answer.photo_url] : []}
                      onChange={(p) => update({ photo_url: p[0] || null })}
                      max={1}
                    />
                  </MotiView>
                ) : null}
                <Button onPress={next}>
                  {t(step === questions.length - 1 ? "review" : "next")}
                </Button>
                {step > 0 ? (
                  <Button
                    variant="ghost"
                    onPress={() => {
                      setError("");
                      setStep(step - 1);
                    }}
                  >
                    {t("back")}
                  </Button>
                ) : null}
              </Card>
            </FadeInUp>
          ) : null}
        </>
      )}
      {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
    </Screen>
  );
}
