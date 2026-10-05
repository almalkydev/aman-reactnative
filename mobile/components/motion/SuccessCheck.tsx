import React, { useEffect } from "react";
import { View } from "react-native";
import LottieView from "lottie-react-native";
import { Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useApp } from "../../lib/provider";
const animation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 36,
  w: 120,
  h: 120,
  nm: "Success check",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Check",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [0, 0, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "sh",
          ks: {
            a: 0,
            k: {
              i: [
                [0, 0],
                [0, 0],
                [0, 0],
              ],
              o: [
                [0, 0],
                [0, 0],
                [0, 0],
              ],
              v: [
                [32, 60],
                [52, 80],
                [88, 40],
              ],
              c: false,
            },
          },
          nm: "Path",
        },
        {
          ty: "st",
          c: { a: 0, k: [0.086, 0.64, 0.29, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 7 },
          lc: 2,
          lj: 2,
          nm: "Stroke",
        },
        {
          ty: "tm",
          s: { a: 0, k: 0 },
          e: {
            a: 1,
            k: [
              {
                t: 0,
                s: [0],
                e: [100],
                i: { x: [0.667], y: [1] },
                o: { x: [0.333], y: [0] },
              },
              { t: 25, s: [100] },
            ],
          },
          o: { a: 0, k: 0 },
          m: 1,
          nm: "Draw",
        },
      ],
      ip: 0,
      op: 36,
      st: 0,
      bm: 0,
    },
  ],
};
export function SuccessCheck() {
  const { reduced } = useApp();
  useEffect(() => {
    if (!reduced)
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
  }, [reduced]);
  return (
    <View
      style={{
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#16a34a15",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {reduced ? (
        <Check size={56} color="#16a34a" />
      ) : (
        <LottieView
          source={animation}
          autoPlay
          loop={false}
          style={{ width: 120, height: 120 }}
        />
      )}
    </View>
  );
}
