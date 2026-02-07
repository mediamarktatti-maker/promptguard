import { useEffect, useMemo, useState } from "react";

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const initial = useMemo(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  }, [initialValue, key]);

  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota / privacy mode
    }
  }, [key, value]);

  return [value, setValue] as const;
}
