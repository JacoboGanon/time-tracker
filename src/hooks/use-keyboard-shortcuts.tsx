"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePersistedState } from "./use-persisted-state";

// ── Shortcut definitions ──

export type ShortcutDef = {
  id: string;
  label: string;
  defaultKey: string;
  group: "navigation" | "actions" | "other";
};

export const SHORTCUTS: ShortcutDef[] = [
  { id: "nav-timer", label: "Go to Timer", defaultKey: "1", group: "navigation" },
  { id: "nav-entries", label: "Go to Entries", defaultKey: "2", group: "navigation" },
  { id: "nav-reports", label: "Go to Reports", defaultKey: "3", group: "navigation" },
  { id: "nav-settings", label: "Go to Settings", defaultKey: "4", group: "navigation" },
  { id: "new-entry", label: "New time entry", defaultKey: "n", group: "actions" },
  { id: "start-stop", label: "Start / stop timer", defaultKey: "s", group: "actions" },
  { id: "show-shortcuts", label: "Show keyboard shortcuts", defaultKey: "?", group: "other" },
];

export const SHORTCUT_GROUPS: { key: ShortcutDef["group"]; label: string }[] = [
  { key: "navigation", label: "Navigation" },
  { key: "actions", label: "Actions" },
  { key: "other", label: "Other" },
];

// ── Key helpers ──

export function eventToKeyString(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.metaKey) parts.push("meta");
  if (e.ctrlKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  // Only add shift modifier for non-printable keys (e.g. shift+tab)
  // For printable chars like "?" (shift+/), e.key already reflects the shifted char
  if (e.shiftKey && e.key.length > 1) parts.push("shift");

  // Ignore standalone modifier keys
  if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
    return parts.join("+") || "modifier";
  }

  const key = e.key === " " ? "space" : e.key.toLowerCase();
  parts.push(key);
  return parts.join("+");
}

export function formatKeyForDisplay(key: string): string {
  const isMac =
    typeof navigator !== "undefined" && navigator.userAgent.includes("Mac");

  return key
    .split("+")
    .map((part) => {
      switch (part) {
        case "meta":
          return isMac ? "⌘" : "Win";
        case "ctrl":
          return isMac ? "⌃" : "Ctrl";
        case "alt":
          return isMac ? "⌥" : "Alt";
        case "shift":
          return "⇧";
        case "space":
          return "Space";
        case "escape":
          return "Esc";
        case "arrowup":
          return "↑";
        case "arrowdown":
          return "↓";
        case "arrowleft":
          return "←";
        case "arrowright":
          return "→";
        case "backspace":
          return "⌫";
        case "delete":
          return "Del";
        case "enter":
          return "↵";
        case "tab":
          return "Tab";
        default:
          return part.toUpperCase();
      }
    })
    .join(" + ");
}

// ── Context ──

type Bindings = Record<string, string>;

type ShortcutContextValue = {
  bindings: Bindings;
  updateBinding: (actionId: string, key: string) => void;
  resetBinding: (actionId: string) => void;
  resetAll: () => void;
  register: (actionId: string, callback: () => void) => () => void;
  capturing: boolean;
  setCapturing: (capturing: boolean) => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
};

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

// ── Provider ──

export function ShortcutProvider({ children }: { children: ReactNode }) {
  const [customBindings, setCustomBindings] = usePersistedState<Bindings>(
    "tt:shortcutBindings",
    {},
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const callbacksRef = useRef(new Map<string, () => void>());

  const bindings = useMemo(() => {
    const result: Bindings = {};
    for (const s of SHORTCUTS) {
      result[s.id] = customBindings[s.id] ?? s.defaultKey;
    }
    return result;
  }, [customBindings]);

  const updateBinding = useCallback(
    (actionId: string, key: string) => {
      setCustomBindings((prev) => ({ ...prev, [actionId]: key }));
    },
    [setCustomBindings],
  );

  const resetBinding = useCallback(
    (actionId: string) => {
      setCustomBindings((prev) => {
        const next = { ...prev };
        delete next[actionId];
        return next;
      });
    },
    [setCustomBindings],
  );

  const resetAll = useCallback(() => {
    setCustomBindings({});
  }, [setCustomBindings]);

  const register = useCallback((actionId: string, callback: () => void) => {
    callbacksRef.current.set(actionId, callback);
    return () => {
      callbacksRef.current.delete(actionId);
    };
  }, []);

  // Global keydown listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (capturing) return;

      // Skip when typing in form fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      const keyCombo = eventToKeyString(e);

      for (const [actionId, binding] of Object.entries(bindings)) {
        if (binding === keyCombo) {
          const callback = callbacksRef.current.get(actionId);
          if (callback) {
            e.preventDefault();
            callback();
            return;
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [bindings, capturing]);

  return (
    <ShortcutContext.Provider
      value={{
        bindings,
        updateBinding,
        resetBinding,
        resetAll,
        register,
        capturing,
        setCapturing,
        dialogOpen,
        setDialogOpen,
      }}
    >
      {children}
    </ShortcutContext.Provider>
  );
}

// ── Hooks ──

export function useShortcuts() {
  const ctx = useContext(ShortcutContext);
  if (!ctx)
    throw new Error("useShortcuts must be used within ShortcutProvider");
  return ctx;
}

export function useShortcut(actionId: string, callback: () => void) {
  const { register } = useShortcuts();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return register(actionId, () => callbackRef.current());
  }, [actionId, register]);
}
