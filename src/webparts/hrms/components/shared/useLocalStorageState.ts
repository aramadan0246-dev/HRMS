import * as React from "react";

/** Same as React.useState, but persists the value to localStorage under `key`. */
export function useLocalStorageState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = React.useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

  const setPersisted = (next: T): void => {
    setValue(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // localStorage unavailable (private browsing, quota) - state still works for this session
    }
  };

  return [value, setPersisted];
}
