import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";
import { API_URL, getToken } from "../lib/api";
import { useApp } from "../lib/provider";
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
  return (
    <Image
      accessibilityLabel={t("photos")}
      source={{
        uri: uri.startsWith("/uploads/") ? API_URL + uri : uri,
        headers: uri.startsWith("/uploads/")
          ? { Authorization: `Bearer ${getToken()}` }
          : undefined,
      }}
      resizeMode={contain ? "contain" : "cover"}
      style={style}
    />
  );
}
