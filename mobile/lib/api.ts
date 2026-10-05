import { Platform } from "react-native";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

function getApiUrl() {
  const configured = (
    process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000"
  ).replace(/\/$/, "");
  if (Platform.OS === "web") return configured;

  try {
    const url = new URL(configured);
    const localHost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(
      url.hostname,
    );
    if (!localHost) return configured;

    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const host = new URL(
        hostUri.includes("://") ? hostUri : `http://${hostUri}`,
      ).hostname;
      if (host && !["localhost", "127.0.0.1", "0.0.0.0"].includes(host)) {
        url.hostname = host;
        return url.toString().replace(/\/$/, "");
      }
    }

    // Android's emulator routes 10.0.2.2 to the development computer.
    if (Platform.OS === "android") {
      url.hostname = "10.0.2.2";
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    // Keep the configured URL so the network error explains what was attempted.
  }
  return configured;
}

export const API_URL = getApiUrl();
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
  let response: Response;
  try {
    response = await fetch(API_URL + path, {
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
  } catch {
    throw new ApiError(`Could not reach the Aman server at ${API_URL}.`, 0);
  }
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
