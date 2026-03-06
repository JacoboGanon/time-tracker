"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, RotateCcw, X } from "lucide-react";

import {
  SHORTCUTS,
  SHORTCUT_GROUPS,
  eventToKeyString,
  formatKeyForDisplay,
  useShortcuts,
} from "~/hooks/use-keyboard-shortcuts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

function KeyBadge({
  shortcutKey,
  onClick,
}: {
  shortcutKey: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-w-[2rem] items-center justify-center rounded-md border border-border/60 bg-background/80 px-2 py-0.5 font-mono text-xs font-medium text-muted-foreground transition-colors hover:border-teal-400/40 hover:text-foreground"
    >
      {formatKeyForDisplay(shortcutKey)}
    </button>
  );
}

function RecordingBadge({
  onCapture,
  onCancel,
}: {
  onCapture: (key: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        onCancel();
        return;
      }

      // Ignore standalone modifier keys
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;

      const keyString = eventToKeyString(e.nativeEvent);
      onCapture(keyString);
    },
    [onCapture, onCancel],
  );

  return (
    <span
      ref={ref}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onBlur={onCancel}
      className="inline-flex min-w-[2rem] animate-pulse items-center justify-center rounded-md border border-teal-400/50 bg-teal-500/10 px-2 py-0.5 text-xs font-medium text-teal-400 outline-none"
    >
      Press a key…
    </span>
  );
}

export function KeyboardShortcutsDialog() {
  const {
    bindings,
    updateBinding,
    resetBinding,
    resetAll,
    setCapturing,
    dialogOpen,
    setDialogOpen,
  } = useShortcuts();

  const [recordingId, setRecordingId] = useState<string | null>(null);

  const startRecording = (actionId: string) => {
    setRecordingId(actionId);
    setCapturing(true);
  };

  const stopRecording = () => {
    setRecordingId(null);
    setCapturing(false);
  };

  const handleCapture = (actionId: string, key: string) => {
    updateBinding(actionId, key);
    stopRecording();
  };

  const handleReset = (actionId: string) => {
    resetBinding(actionId);
    stopRecording();
  };

  // Find conflicts: multiple actions bound to the same key
  const conflicts = new Set<string>();
  const keyToActions = new Map<string, string[]>();
  for (const [actionId, key] of Object.entries(bindings)) {
    const existing = keyToActions.get(key) ?? [];
    existing.push(actionId);
    keyToActions.set(key, existing);
    if (existing.length > 1) {
      for (const id of existing) conflicts.add(id);
    }
  }

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        if (!open) stopRecording();
        setDialogOpen(open);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="size-4 text-muted-foreground" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {SHORTCUT_GROUPS.map(({ key: groupKey, label: groupLabel }) => {
            const groupShortcuts = SHORTCUTS.filter(
              (s) => s.group === groupKey,
            );
            if (groupShortcuts.length === 0) return null;

            return (
              <div key={groupKey}>
                <h4 className="mb-2 text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
                  {groupLabel}
                </h4>
                <div className="space-y-1">
                  {groupShortcuts.map((shortcut) => {
                    const currentKey = bindings[shortcut.id] ?? shortcut.defaultKey;
                    const isRecording = recordingId === shortcut.id;
                    const isConflict = conflicts.has(shortcut.id);
                    const isCustom = currentKey !== shortcut.defaultKey;

                    return (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
                      >
                        <span className="text-sm text-foreground/80">
                          {shortcut.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isConflict && !isRecording && (
                            <span className="text-[10px] text-amber-400">
                              conflict
                            </span>
                          )}
                          {isRecording ? (
                            <div className="flex items-center gap-1">
                              <RecordingBadge
                                onCapture={(key) =>
                                  handleCapture(shortcut.id, key)
                                }
                                onCancel={stopRecording}
                              />
                              <button
                                type="button"
                                onClick={stopRecording}
                                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <KeyBadge
                                shortcutKey={currentKey}
                                onClick={() => startRecording(shortcut.id)}
                              />
                              {isCustom && (
                                <button
                                  type="button"
                                  onClick={() => handleReset(shortcut.id)}
                                  className="rounded p-0.5 text-muted-foreground/40 transition-colors hover:text-foreground"
                                  title="Reset to default"
                                >
                                  <RotateCcw className="size-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={resetAll}
          >
            <RotateCcw className="mr-1.5 size-3" />
            Reset all to defaults
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
