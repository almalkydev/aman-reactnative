import React, { useEffect } from "react";
import { View, Pressable, useWindowDimensions } from "react-native";
import {
  Canvas,
  Path,
  Skia,
  LinearGradient,
  vec,
  Line,
  Circle,
} from "@shopify/react-native-skia";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { Text, Row } from "./ui";
import { useApp, useColors } from "../lib/provider";
export function Chart({ days }: { days: { day: string; count: number }[] }) {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth - 80, 796);
  const height = 145;
  const c = useColors();
  const { reduced, rtl, language, t } = useApp();
  const [selected, setSelected] = React.useState<number | null>(null);
  const end = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    end.value = withTiming(1, { duration: reduced ? 0 : 800 });
  }, [reduced]);
  const data = rtl ? [...days].reverse() : days;
  const max = Math.max(...data.map((d) => d.count), 3);
  const points = data.map((d, i) => ({
    x: 8 + (i * (width - 16)) / Math.max(data.length - 1, 1),
    y: height - 12 - (d.count / max) * (height - 30),
  }));
  const line = Skia.Path.Make();
  points.forEach((p, i) =>
    i === 0 ? line.moveTo(p.x, p.y) : line.lineTo(p.x, p.y),
  );
  const area = line.copy();
  if (points.length) {
    area.lineTo(points[points.length - 1].x, height);
    area.lineTo(points[0].x, height);
    area.close();
  }
  return (
    <View style={{ gap: 10 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <Text size={12} muted>
          {selected === null
            ? t("lastWeek")
            : new Date(data[selected].day + "T12:00:00").toLocaleDateString(
                language === "ar" ? "ar-OM" : "en-GB",
                { day: "numeric", month: "short" },
              )}
        </Text>
        <Text size={12} weight="medium">
          {selected === null
            ? data.reduce((sum, d) => sum + d.count, 0)
            : data[selected].count}{" "}
          {t("reports")}
        </Text>
      </Row>
      <View>
        <Canvas style={{ width, height }}>
          {[0, 1, 2].map((i) => (
            <Line
              key={i}
              p1={vec(0, 20 + i * 50)}
              p2={vec(width, 20 + i * 50)}
              color={c.border}
              strokeWidth={0.5}
            />
          ))}
          <Path path={area}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, height)}
              colors={[c.foreground + "20", c.foreground + "00"]}
            />
          </Path>
          <Path
            path={line}
            style="stroke"
            strokeWidth={2.5}
            color={c.foreground}
            end={end}
            strokeCap="round"
            strokeJoin="round"
          />
          {selected !== null && points[selected] ? (
            <Circle
              cx={points[selected].x}
              cy={points[selected].y}
              r={5}
              color={c.foreground}
            />
          ) : null}
        </Canvas>
        <View style={{ position: "absolute", inset: 0, flexDirection: "row" }}>
          {data.map((d, i) => (
            <Pressable
              key={d.day}
              accessibilityRole="button"
              accessibilityLabel={`${d.day}: ${d.count}`}
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
