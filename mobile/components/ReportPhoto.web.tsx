import React, { useEffect, useState } from "react";
import { Image, ImageStyle, StyleProp, View } from "react-native";
import { API_URL, getToken } from "../lib/api";
import { useApp } from "../lib/provider";
import { Text } from "./ui";
export function ReportPhoto({
  uri,
  style,
  contain = false,
}: {
  uri: string;
  style?: StyleProp<ImageStyle>;
  contain?: boolean;
}) {
  const { t } = useApp();
  const [source, setSource] = useState(uri.startsWith("/uploads/") ? "" : uri),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!uri.startsWith("/uploads/")) return;
    const controller = new AbortController();
    let url = "";
    void fetch(API_URL + uri, {
      headers: { Authorization: `Bearer ${getToken()}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        url = URL.createObjectURL(await response.blob());
        setSource(url);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [uri]);
  if (failed)
    return (
      <View style={{ padding: 10 }}>
        <Text muted size={11}>
          {t("photoUnavailable")}
        </Text>
      </View>
    );
  return (
    <Image
      accessibilityLabel={t("photos")}
      source={source ? { uri: source } : undefined}
      resizeMode={contain ? "contain" : "cover"}
      style={style}
    />
  );
}
