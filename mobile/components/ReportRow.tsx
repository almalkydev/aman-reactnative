import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowUpRight,
  ClipboardCheck,
  TriangleAlert,
  ChevronLeft,
} from "lucide-react-native";
import { Text, Row, Badge } from "./ui";
import { PressableScale } from "./motion";
import { useApp, useColors } from "../lib/provider";
import type { Report } from "../lib/types";
export function ReportRow({
  report,
  kind,
}: {
  report: Report;
  kind: "incidents" | "inspections";
}) {
  const c = useColors();
  const { rtl, language, t } = useApp();
  const router = useRouter();
  const Icon = kind === "incidents" ? TriangleAlert : ClipboardCheck;
  return (
    <PressableScale onPress={() => router.push(`/report/${kind}/${report.id}`)}>
      <Row
        style={{
          paddingVertical: 17,
          borderBottomWidth: 1,
          borderColor: c.border,
          alignItems: "flex-start",
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: c.subtle,
          }}
        >
          <Icon size={17} color={c.foreground} strokeWidth={1.4} />
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text weight="medium" size={13}>
            {report.title || report.equipment_name}
          </Text>
          <Text muted size={11}>
            {(report.site_name ? t(report.site_name) : null) || t("site")} ·{" "}
            {new Date(report.created_at).toLocaleDateString(
              language === "ar" ? "ar-OM" : "en-GB",
              { day: "numeric", month: "short" },
            )}
          </Text>
          <Row style={{ flexWrap: "wrap" }}>
            <Badge value={report.status} />
            {report.severity ? <Badge value={report.severity} /> : null}
            {report.pending ? (
              <Text size={10} muted>
                {t("queued")}
              </Text>
            ) : null}
          </Row>
        </View>
        {rtl ? (
          <ChevronLeft color={c.muted} size={15} />
        ) : (
          <ArrowUpRight color={c.muted} size={15} />
        )}
      </Row>
    </PressableScale>
  );
}
