import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { AccessibilityInfo, AppState, useColorScheme } from "react-native";
import * as Network from "expo-network";
import { api, ApiError, restoreToken, setToken } from "./api";
import { pending, readCache, writeCache } from "./storage";
import { syncPending } from "./sync";
import { en, TranslationKey } from "./en";
import { ar } from "./ar";
import { arabicContent } from "./content";
import type { User, Site, Template, Question } from "./types";

type ThemeMode = "system" | "light" | "dark";
type Context = {
  user: User | null;
  ready: boolean;
  dark: boolean;
  theme: ThemeMode;
  language: "en" | "ar";
  rtl: boolean;
  reduced: boolean;
  online: boolean;
  pendingCount: number;
  syncing: boolean;
  recentlySynced: boolean;
  syncError: string;
  toast: string;
  t: (key: TranslationKey | string) => string;
  notify: (message: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setTheme: (mode: ThemeMode) => void;
  setLanguage: (language: "en" | "ar") => void;
  sync: () => Promise<void>;
  revision: number;
};
const AppContext = createContext<Context>(null!);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [user, setUser] = useState<User | null>(null),
    [ready, setReady] = useState(false),
    [theme, changeTheme] = useState<ThemeMode>("system"),
    [language, changeLanguage] = useState<"en" | "ar">("en"),
    [reduced, setReduced] = useState(false),
    [online, setOnline] = useState(true),
    [pendingCount, setPendingCount] = useState(0),
    [syncing, setSyncing] = useState(false),
    [recentlySynced, setRecentlySynced] = useState(false),
    [syncError, setSyncError] = useState(""),
    [toast, setToast] = useState(""),
    [revision, setRevision] = useState(0);
  const t = useCallback(
    (key: TranslationKey | string) =>
      (language === "ar" ? ar : en)[key as TranslationKey] ||
      (language === "ar" ? arabicContent[key] : null) ||
      key,
    [language],
  );
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timeout);
  }, [toast]);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const prefs = await readCache<{
          theme: ThemeMode;
          language: "en" | "ar";
        }>("preferences");
        if (prefs) {
          changeTheme(prefs.theme);
          changeLanguage(prefs.language);
        }
        const token = await restoreToken();
        if (token) {
          try {
            setUser(await api<User>("/me"));
          } catch (error) {
            if (error instanceof ApiError && error.status === 401)
              await setToken(null);
            else setUser(await readCache<User>("session-user"));
          }
        }
      } finally {
        if (active) setReady(true);
      }
    })();
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  const sync = useCallback(async () => {
    if (!user) return;
    const beforeCount = (await pending(user.id)).length;
    setPendingCount(beforeCount);
    setSyncing(beforeCount > 0);
    setSyncError("");
    try {
      await syncPending(user.id);
      setRevision((v) => v + 1);
    } catch (error) {
      setSyncError(
        error instanceof ApiError && error.status === 401
          ? t("sessionExpired")
          : t("syncFailed"),
      );
    } finally {
      const remaining = (await pending(user.id)).length;
      setPendingCount(remaining);
      if (beforeCount > 0 && remaining === 0) setRecentlySynced(true);
      setSyncing(false);
    }
  }, [user, t]);
  useEffect(() => {
    if (!recentlySynced) return;
    const timer = setTimeout(() => setRecentlySynced(false), 2200);
    return () => clearTimeout(timer);
  }, [recentlySynced]);
  useEffect(() => {
    if (!user) return;
    void sync();
    const listener = Network.addNetworkStateListener((state) => {
      const connected =
        !!state.isConnected && state.isInternetReachable !== false;
      setOnline(connected);
      if (connected) void sync();
    });
    void Network.getNetworkStateAsync().then((state) =>
      setOnline(!!state.isConnected && state.isInternetReachable !== false),
    );
    const app = AppState.addEventListener("change", (state) => {
      if (state === "active") void sync();
    });
    return () => {
      listener.remove();
      app.remove();
    };
  }, [user, sync]);
  async function cacheReferenceData(id: number) {
    const [sites, templates] = await Promise.all([
      api<Site[]>("/sites"),
      api<Template[]>("/templates"),
    ]);
    await Promise.all([
      writeCache(`${id}:/sites`, sites),
      writeCache(`${id}:/templates`, templates),
      ...templates.map(async (template) => {
        await writeCache(
          `${id}:/templates/${template.id}/questions`,
          await api<Question[]>(`/templates/${template.id}/questions`),
        );
      }),
    ]);
  }
  async function login(email: string, password: string) {
    const result = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await setToken(result.token);
    await writeCache("session-user", result.user);
    setUser(result.user);
    try {
      await cacheReferenceData(result.user.id);
    } catch {
      setToast(t("noTemplates"));
    }
  }
  async function logout() {
    if (syncing) return;
    await setToken(null);
    await writeCache("session-user", null);
    setUser(null);
    setPendingCount(0);
    setSyncError("");
  }
  function setTheme(mode: ThemeMode) {
    changeTheme(mode);
    void writeCache("preferences", { theme: mode, language });
  }
  function setLanguage(value: "en" | "ar") {
    changeLanguage(value);
    void writeCache("preferences", { theme, language: value });
  }
  return (
    <AppContext.Provider
      value={{
        user,
        ready,
        dark: theme === "system" ? system === "dark" : theme === "dark",
        theme,
        language,
        rtl: language === "ar",
        reduced,
        online,
        pendingCount,
        syncing,
        recentlySynced,
        syncError,
        toast,
        t,
        notify: setToast,
        login,
        logout,
        setTheme,
        setLanguage,
        sync,
        revision,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  return useContext(AppContext);
}
export function useColors() {
  const { dark } = useApp();
  return {
    background: dark ? "#09090b" : "#ffffff",
    foreground: dark ? "#fafafa" : "#09090b",
    card: dark ? "#0a0a0b" : "#ffffff",
    muted: "#71717a",
    border: dark ? "#27272a" : "#e4e4e7",
    subtle: dark ? "#18181b" : "#f7f7f8",
    success: "#16a34a",
    warning: "#d97706",
    danger: "#dc2626",
  };
}
