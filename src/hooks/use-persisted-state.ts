import { useCallback, useState } from "react";

/**
 * Like useState, but persists to localStorage under the given key.
 * Reads the initial value from localStorage on mount (client-side only).
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setStateRaw] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) return JSON.parse(stored) as T;
    } catch {
      // ignore parse errors
    }
    return defaultValue;
  });

  const setState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStateRaw((prev) => {
        const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
        try {
          if (next === null || next === undefined) {
            localStorage.removeItem(key);
          } else {
            localStorage.setItem(key, JSON.stringify(next));
          }
        } catch {
          // ignore storage errors
        }
        return next;
      });
    },
    [key],
  );

  return [state, setState];
}
