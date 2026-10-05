import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");
let token: string | null = null;
export async function restoreToken() {
  token =
    Platform.OS === "web" ? null : await SecureStore.getItemAsync("aman.token");
  return token;
}
export async function setToken(value: string | null) {
  token = value;
  if (Platform.OS !== "web") {
    if (value) await SecureStore.setItemAsync("aman.token", value);
    else await SecureStore.deleteItemAsync("aman.token");
  }
}
export function getToken() {
  return token;
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(API_URL + path, {
    ...options,
    signal: options.signal || AbortSignal.timeout(20000),
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response
    .json()
    .catch(() => ({ error: "Server response could not be read." }));
  if (!response.ok)
    throw new ApiError(data.error || "Request failed.", response.status);
  return data as T;
}
export async function uploadPhoto(uri: string) {
  if (uri.startsWith("/uploads/")) return uri;
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    form.append("photo", blob, "photo.jpg");
  } else {
    const ext = uri.split(".").pop()?.toLowerCase();
    form.append("photo", {
      uri,
      name: `photo.${ext === "png" ? "png" : "jpg"}`,
      type: ext === "png" ? "image/png" : "image/jpeg",
    } as unknown as Blob);
  }
  return (await api<{ url: string }>("/upload", { method: "POST", body: form }))
    .url;
}
