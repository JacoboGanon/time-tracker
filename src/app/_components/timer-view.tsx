"use client";

import { useEffect, useState } from "react";
import {
  CircleDot,
  Clock,
  Play,
  Plus,
  Square,
  Zap,
} from "lucide-react";

import { api } from "~/trpc/react";
import { useFilteredProjects } from "./client-filter-context";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

const toDatetimeLocalValue = (date: Date): string => {
  const withOffset = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return withOffset.toISOString().slice(0, 16);
};

const formatStopwatch = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const formatHours = (minutes: number): string =>
  `${(minutes / 60).toFixed(1)}h`;

export function TimerView() {
  const utils = api.useUtils();
  const { data: projects } = useFilteredProjects();
  const activitiesQuery = api.activityType.list.useQuery();

  // Stopwatch state
  const [swProjectId, setSwProjectId] = useState("");
  const [swActivityId, setSwActivityId] = useState("");
  const [swDescription, setSwDescription] = useState("");
  const [swBillable, setSwBillable] = useState(true);
  const [swStartedAt, setSwStartedAt] = useState<Date | null>(null);
  const [swElapsedMs, setSwElapsedMs] = useState(0);

  // Manual entry dialog
  const [manualOpen, setManualOpen] = useState(false);
  const [meProjectId, setMeProjectId] = useState("");
  const [meActivityId, setMeActivityId] = useState("");
  const [meDescription, setMeDescription] = useState("");
  const [meBillable, setMeBillable] = useState(true);
  const [meStart, setMeStart] = useState(
    toDatetimeLocalValue(new Date(Date.now() - 60 * 60 * 1000)),
  );
  const [meEnd, setMeEnd] = useState(toDatetimeLocalValue(new Date()));

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-select first project/activity + reset when filtered out
  useEffect(() => {
    if (!projects?.length) return;
    const ids = new Set(projects.map((p) => p.id));
    if (!swProjectId || (!ids.has(swProjectId) && !swStartedAt)) {
      setSwProjectId(projects[0]!.id);
    }
    if (!meProjectId || !ids.has(meProjectId)) {
      setMeProjectId(projects[0]!.id);
    }
  }, [projects, swProjectId, meProjectId, swStartedAt]);

  useEffect(() => {
    if (activitiesQuery.data?.length) {
      const first = activitiesQuery.data[0]!.id;
      if (!swActivityId) setSwActivityId(first);
      if (!meActivityId) setMeActivityId(first);
    }
  }, [activitiesQuery.data, swActivityId, meActivityId]);

  // Stopwatch tick
  useEffect(() => {
    if (!swStartedAt) {
      setSwElapsedMs(0);
      return;
    }
    const id = window.setInterval(() => {
      setSwElapsedMs(Date.now() - swStartedAt.getTime());
    }, 1000);
    return () => window.clearInterval(id);
  }, [swStartedAt]);

  // Today's entries
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const todayEntriesQuery = api.timeEntry.list.useQuery({
    startDate: todayStart,
    endDate: todayEnd,
  });

  const todayMinutes = (todayEntriesQuery.data ?? []).reduce(
    (sum, e) => sum + e.durationMinutes,
    0,
  );

  const createStopwatchEntry = api.timeEntry.createFromStopwatch.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.timeEntry.list.invalidate(),
        utils.report.summary.invalidate(),
      ]);
      setSwStartedAt(null);
      setSwDescription("");
    },
    onError: (error) => setErrorMsg(error.message),
  });

  const createManualEntry = api.timeEntry.createManual.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.timeEntry.list.invalidate(),
        utils.report.summary.invalidate(),
      ]);
      setManualOpen(false);
      setMeDescription("");
    },
    onError: (error) => setErrorMsg(error.message),
  });

  const startStopwatch = () => {
    if (!swProjectId || !swActivityId) {
      setErrorMsg("Select a project and activity first");
      return;
    }
    setSwStartedAt(new Date());
    setErrorMsg(null);
  };

  const stopStopwatch = () => {
    if (!swStartedAt) return;
    createStopwatchEntry.mutate({
      projectId: swProjectId,
      activityTypeId: swActivityId,
      startedAt: swStartedAt,
      stoppedAt: new Date(),
      description: swDescription.trim() || "Work session",
      isBillable: swBillable,
    });
  };

  const isRunning = Boolean(swStartedAt);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Timer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your time with the stopwatch or add entries manually.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMsg}
          <button
            className="ml-3 text-xs underline"
            onClick={() => setErrorMsg(null)}
          >
            dismiss
          </button>
        </div>
      )}

      {/* Stopwatch — the hero */}
      <Card className="relative overflow-hidden border-sidebar-border bg-sidebar">
        {isRunning && (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-20 size-60 rounded-full bg-teal-500/8 blur-3xl" />
            <div className="absolute -bottom-10 -right-10 size-40 rounded-full bg-teal-500/5 blur-2xl" />
          </div>
        )}
        <CardContent className="relative pt-6">
          <div className="flex flex-col items-center gap-6">
            {/* Timer display */}
            <div className="text-center">
              <div
                className={`font-mono text-6xl font-light tracking-tight transition-colors duration-500 md:text-7xl ${
                  isRunning ? "text-teal-400" : "text-foreground/30"
                }`}
              >
                {formatStopwatch(swElapsedMs)}
              </div>
              {isRunning && (
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <CircleDot className="size-2.5 animate-pulse text-teal-400" />
                  <span className="text-xs font-medium text-teal-400/80">
                    Recording
                  </span>
                </div>
              )}
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-3">
              {!isRunning ? (
                <Button
                  size="lg"
                  className="h-12 gap-2 rounded-full bg-teal-600 px-8 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 hover:bg-teal-500"
                  onClick={startStopwatch}
                >
                  <Play className="size-4" />
                  Start
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  className="h-12 gap-2 rounded-full px-8 text-sm font-semibold shadow-lg"
                  onClick={stopStopwatch}
                  disabled={createStopwatchEntry.isPending}
                >
                  <Square className="size-3.5" />
                  Stop & Save
                </Button>
              )}
            </div>

            {/* Stopwatch config */}
            <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Project</Label>
                <Select value={swProjectId} onValueChange={setSwProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Activity
                </Label>
                <Select value={swActivityId} onValueChange={setSwActivityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent>
                    {activitiesQuery.data?.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Description
                </Label>
                <Input
                  value={swDescription}
                  onChange={(e) => setSwDescription(e.target.value)}
                  placeholder="What are you working on?"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={swBillable}
                    onChange={(e) => setSwBillable(e.target.checked)}
                    className="size-3.5 rounded accent-teal-500"
                  />
                  Billable
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats + manual entry */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-sidebar-border bg-sidebar">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-teal-500/10">
                <Clock className="size-4 text-teal-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">
                  {formatHours(todayMinutes)}
                </p>
                <p className="text-xs text-muted-foreground">Tracked today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Zap className="size-4 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">
                  {todayEntriesQuery.data?.length ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  Entries today
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={manualOpen} onOpenChange={setManualOpen}>
          <DialogTrigger asChild>
            <Card className="group cursor-pointer border-dashed border-sidebar-border bg-sidebar transition-colors hover:border-teal-400/40 hover:bg-sidebar-accent">
              <CardContent className="flex h-full items-center justify-center pt-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground transition-colors group-hover:text-teal-400">
                  <Plus className="size-4" />
                  Add Manual Entry
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Manual Entry</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Project</Label>
                  <Select value={meProjectId} onValueChange={setMeProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Activity</Label>
                  <Select value={meActivityId} onValueChange={setMeActivityId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select activity" />
                    </SelectTrigger>
                    <SelectContent>
                      {activitiesQuery.data?.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Start</Label>
                  <Input
                    type="datetime-local"
                    value={meStart}
                    onChange={(e) => setMeStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">End</Label>
                  <Input
                    type="datetime-local"
                    value={meEnd}
                    onChange={(e) => setMeEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={meDescription}
                  onChange={(e) => setMeDescription(e.target.value)}
                  placeholder="What did you work on?"
                  rows={2}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={meBillable}
                  onChange={(e) => setMeBillable(e.target.checked)}
                  className="size-3.5 rounded accent-teal-500"
                />
                Billable
              </label>
              <Button
                className="bg-teal-600 hover:bg-teal-500"
                onClick={() =>
                  createManualEntry.mutate({
                    projectId: meProjectId,
                    activityTypeId: meActivityId,
                    startAt: new Date(meStart),
                    endAt: new Date(meEnd),
                    description: meDescription.trim() || "Manual entry",
                    isBillable: meBillable,
                  })
                }
                disabled={createManualEntry.isPending}
              >
                Save Entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's entries */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Today&apos;s Entries
        </h2>
        <div className="space-y-2">
          {todayEntriesQuery.data?.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg border border-sidebar-border bg-sidebar px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`size-2 rounded-full ${entry.isBillable ? "bg-teal-400" : "bg-muted-foreground/30"}`}
                />
                <div>
                  <p className="text-sm font-medium">
                    {entry.project.name}
                    <span className="ml-1.5 text-muted-foreground">
                      &middot; {entry.activityType.name}
                    </span>
                  </p>
                  {entry.description && (
                    <p className="text-xs text-muted-foreground">
                      {entry.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.startAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  &ndash;{" "}
                  {new Date(entry.endAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {formatHours(entry.durationMinutes)}
                </Badge>
              </div>
            </div>
          ))}
          {!todayEntriesQuery.data?.length && (
            <p className="py-8 text-center text-sm text-muted-foreground/50">
              No entries today. Start the timer or add a manual entry.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
