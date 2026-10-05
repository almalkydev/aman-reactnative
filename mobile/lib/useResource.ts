import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api";
import { readCache, writeCache } from "./storage";
import { useApp } from "./provider";
export function useResource<T>(path: string) {
  const { user, revision } = useApp();
  const [data, setData] = useState<T | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [cached, setCached] = useState(false);
  const load = useCallback(async () => {
    if (!user) return;
    setError("");
    const key = `${user.id}:${path}`;
    try {
      const result = await api<T>(path);
      await writeCache(key, result);
      setData(result);
      setCached(false);
    } catch (e) {
      const saved = await readCache<T>(key);
      if (saved && !(e instanceof ApiError && e.status === 401)) {
        setData(saved);
        setCached(true);
      } else setError(e instanceof Error ? e.message : "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }, [path, user?.id]);
  useEffect(() => {
    setLoading(true);
    setData(null);
    void load();
  }, [load]);
  useEffect(() => {
    if (revision) void load();
  }, [revision, load]);
  return { data, loading, error, cached, reload: load };
}
