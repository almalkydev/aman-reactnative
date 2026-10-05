import React from "react";
import { View, Pressable, useWindowDimensions } from "react-native";
import Svg, {
  Path,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Circle,
} from "react-native-svg";
import { Text, Row } from "./ui";
import { useApp, useColors } from "../lib/provider";
export function Chart({ days }: { days: { day: string; count: number }[] }) {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth - 80, 796);
  const height = 145;
  const c = useColors();
  const { rtl, language, t } = useApp();
  const [selected, setSelected] = React.useState<number | null>(null);
  const data = rtl ? [...days].reverse() : days;
  const max = Math.max(...data.map((d) => d.count), 3);
  const points = data.map((d, i) => ({
    x: 8 + (i * (width - 16)) / Math.max(data.length - 1, 1),
    y: height - 12 - (d.count / max) * (height - 30),
  }));
  const line = points.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  const area = points.length
    ? `${line} L${points[points.length - 1].x},${height} L8,${height} Z`
    : "";
  return (
    <View style={{ gap: 10 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <Text muted size={12}>
          {selected === null
            ? t("lastWeek")
            : new Date(data[selected].day + "T12:00:00").toLocaleDateString(
                language === "ar" ? "ar-OM" : "en-GB",
                { day: "numeric", month: "short" },
              )}
        </Text>
        <Text size={12} weight="medium">
          {selected === null
            ? data.reduce((s, d) => s + d.count, 0)
            : data[selected].count}{" "}
          {t("reports")}
        </Text>
      </Row>
      <View>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={c.foreground} stopOpacity={0.14} />
              <Stop offset="1" stopColor={c.foreground} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {[0, 1, 2].map((i) => (
            <Line
              key={i}
              x1={0}
              y1={20 + i * 50}
              x2={width}
              y2={20 + i * 50}
              stroke={c.border}
              strokeWidth={0.5}
            />
          ))}
          <Path d={area} fill="url(#fill)" />
          <Path
            d={line}
            fill="none"
            stroke={c.foreground}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {selected !== null && points[selected] ? (
            <Circle
              cx={points[selected].x}
              cy={points[selected].y}
              r={5}
              fill={c.foreground}
            />
          ) : null}
        </Svg>
        <View style={{ position: "absolute", inset: 0, flexDirection: "row" }}>
          {data.map((d, i) => (
            <Pressable
              key={d.day}
              accessibilityLabel={`${d.day}: ${d.count}`}
              accessibilityRole="button"
              onPress={() => setSelected(i)}
              style={{ flex: 1 }}
            />
          ))}
        </View>
      </View>
      <Row style={{ justifyContent: "space-between", flexDirection: "row" }}>
        {data.map((d) => (
          <Text key={d.day} muted size={10}>
            {new Date(d.day + "T12:00:00").toLocaleDateString(
              language === "ar" ? "ar-OM" : "en-GB",
              { weekday: "short" },
            )}
          </Text>
        ))}
      </Row>
    </View>
  );
}
