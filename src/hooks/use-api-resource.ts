"use client";

import { useCallback, useEffect, useState } from "react";
import { logger } from "@/lib/logger";

export type LoadError = { kind: "timeout" | "request"; status?: number };

export type ApiResource<T> = {
  data: T | null;
  loading: boolean;
  error: LoadError | null;
  refetch: () => void;
};

const DEFAULT_TIMEOUT_MS = 15000;

function isLoadError(value: unknown): value is LoadError {
  if (typeof value !== "object" || value === null || !("kind" in value)) {
    return false;
  }
  const kind = (value as { kind: unknown }).kind;
  return kind === "timeout" || kind === "request";
}

export function useApiResource<T>(
  url: string | null,
  options: { timeoutMs?: number } = {},
): ApiResource<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(url !== null);
  const [error, setError] = useState<LoadError | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (url === null) {
      setLoading(false);
      return;
    }

    let active = true;
    let settled = false;
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      if (!active || settled) return;
      settled = true;
      setError({ kind: "timeout" });
      setLoading(false);
      logger.error("useApiResource: load timed out", { url });
      controller.abort();
    }, timeoutMs);

    (async () => {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw { kind: "request", status: res.status } as LoadError;
        }
        const body = (await res.json()) as T;
        if (!active || settled) return;
        settled = true;
        clearTimeout(timer);
        setData(body);
        setLoading(false);
      } catch (err) {
        if (!active || settled) return;
        settled = true;
        clearTimeout(timer);
        const loadError: LoadError = isLoadError(err)
          ? err
          : { kind: "request" };
        setError(loadError);
        setLoading(false);
        logger.error("useApiResource: load failed", { url, error: loadError });
      }
    })();

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [url, timeoutMs, reloadToken]);

  return { data, loading, error, refetch };
}
