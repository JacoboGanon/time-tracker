"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import { api } from "~/trpc/react";
import { useFilteredProjects } from "./client-filter-context";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const toDateAtStartOfDay = (value: string): Date | undefined => {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00`);
};

const toDateAtEndOfDay = (value: string): Date | undefined => {
  if (!value) return undefined;
  return new Date(`${value}T23:59:59`);
};

const toDatetimeLocalValue = (date: Date): string => {
  const withOffset = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return withOffset.toISOString().slice(0, 16);
};

const formatHours = (minutes: number): string =>
  `${(minutes / 60).toFixed(1)}h`;

type EditDraft = {
  startAt: string;
  endAt: string;
  activityTypeId: string;
  description: string;
  isBillable: boolean;
};

const ALL_VALUE = "__all__";

export function EntriesView() {
  const utils = api.useUtils();
  const { data: projects } = useFilteredProjects();
  const activitiesQuery = api.activityType.list.useQuery();

  const [filterStart, setFilterStart] = useState(
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const [filterEnd, setFilterEnd] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [filterProject, setFilterProject] = useState(ALL_VALUE);
  const [filterActivity, setFilterActivity] = useState(ALL_VALUE);

  // Reset project filter when selected project leaves the filtered list
  useEffect(() => {
    if (filterProject === ALL_VALUE || !projects) return;
    if (!projects.some((p) => p.id === filterProject)) {
      setFilterProject(ALL_VALUE);
    }
  }, [projects, filterProject]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const listFilters = useMemo(
    () => ({
      startDate: toDateAtStartOfDay(filterStart),
      endDate: toDateAtEndOfDay(filterEnd),
      projectId: filterProject === ALL_VALUE ? undefined : filterProject,
      activityTypeId: filterActivity === ALL_VALUE ? undefined : filterActivity,
    }),
    [filterStart, filterEnd, filterProject, filterActivity],
  );

  const entriesQuery = api.timeEntry.list.useQuery(listFilters);

  const updateEntry = api.timeEntry.update.useMutation({
    onSuccess: async () => {
      await utils.timeEntry.list.invalidate();
      setEditingId(null);
      setEditDraft(null);
    },
    onError: (error) => setErrorMsg(error.message),
  });

  const deleteEntry = api.timeEntry.delete.useMutation({
    onSuccess: async () => {
      await utils.timeEntry.list.invalidate();
    },
    onError: (error) => setErrorMsg(error.message),
  });

  const totalMinutes = (entriesQuery.data ?? []).reduce(
    (sum, e) => sum + e.durationMinutes,
    0,
  );
  const billableMinutes = (entriesQuery.data ?? []).reduce(
    (sum, e) => sum + (e.isBillable ? e.durationMinutes : 0),
    0,
  );

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups = new Map<string, typeof entriesQuery.data>();
    for (const entry of entriesQuery.data ?? []) {
      const dateKey = new Date(entry.startAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (!groups.has(dateKey)) groups.set(dateKey, []);
      groups.get(dateKey)!.push(entry);
    }
    return Array.from(groups.entries());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entriesQuery.data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Entries</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage all your time entries.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono text-xs">
            {formatHours(totalMinutes)} total
          </Badge>
          <Badge
            variant="outline"
            className="border-teal-400/30 font-mono text-xs text-teal-400"
          >
            {formatHours(billableMinutes)} billable
          </Badge>
        </div>
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

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-sidebar-border bg-sidebar p-4">
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-muted-foreground uppercase">
            From
          </Label>
          <Input
            type="date"
            className="h-9 w-[150px]"
            value={filterStart}
            onChange={(e) => setFilterStart(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-muted-foreground uppercase">
            To
          </Label>
          <Input
            type="date"
            className="h-9 w-[150px]"
            value={filterEnd}
            onChange={(e) => setFilterEnd(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-muted-foreground uppercase">
            Project
          </Label>
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All Projects</SelectItem>
              {projects?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-muted-foreground uppercase">
            Activity
          </Label>
          <Select value={filterActivity} onValueChange={setFilterActivity}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All Activities</SelectItem>
              {activitiesQuery.data?.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grouped entries */}
      <div className="space-y-6">
        {groupedEntries.map(([dateLabel, entries]) => (
          <div key={dateLabel}>
            <div className="mb-2 flex items-center gap-2">
              <CalendarDays className="size-3.5 text-muted-foreground/60" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                {dateLabel}
              </h3>
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-mono text-muted-foreground/60">
                {formatHours(
                  entries!.reduce((s, e) => s + e.durationMinutes, 0),
                )}
              </span>
            </div>
            <div className="space-y-1">
              {entries!.map((entry) => (
                <div
                  key={entry.id}
                  className="group rounded-lg border border-transparent bg-sidebar px-4 py-3 transition-colors hover:border-sidebar-border"
                >
                  {editingId === entry.id && editDraft ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          type="datetime-local"
                          value={editDraft.startAt}
                          onChange={(e) =>
                            setEditDraft((d) =>
                              d ? { ...d, startAt: e.target.value } : null,
                            )
                          }
                        />
                        <Input
                          type="datetime-local"
                          value={editDraft.endAt}
                          onChange={(e) =>
                            setEditDraft((d) =>
                              d ? { ...d, endAt: e.target.value } : null,
                            )
                          }
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Select
                          value={editDraft.activityTypeId}
                          onValueChange={(v) =>
                            setEditDraft((d) =>
                              d ? { ...d, activityTypeId: v } : null,
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {activitiesQuery.data?.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={editDraft.description}
                          onChange={(e) =>
                            setEditDraft((d) =>
                              d ? { ...d, description: e.target.value } : null,
                            )
                          }
                          placeholder="Description"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={editDraft.isBillable}
                            onChange={(e) =>
                              setEditDraft((d) =>
                                d
                                  ? { ...d, isBillable: e.target.checked }
                                  : null,
                              )
                            }
                            className="size-3.5 accent-teal-500"
                          />
                          Billable
                        </label>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(null);
                              setEditDraft(null);
                            }}
                          >
                            <X className="mr-1 size-3" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-500"
                            onClick={() => {
                              if (!editDraft) return;
                              updateEntry.mutate({
                                entryId: entry.id,
                                startAt: new Date(editDraft.startAt),
                                endAt: new Date(editDraft.endAt),
                                activityTypeId: editDraft.activityTypeId,
                                description: editDraft.description,
                                isBillable: editDraft.isBillable,
                              });
                            }}
                            disabled={updateEntry.isPending}
                          >
                            <Check className="mr-1 size-3" />
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div
                          className={`size-2 shrink-0 rounded-full ${entry.isBillable ? "bg-teal-400" : "bg-muted-foreground/30"}`}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {entry.project.name}
                            <span className="ml-1.5 font-normal text-muted-foreground">
                              &middot; {entry.activityType.name}
                            </span>
                          </p>
                          {entry.description && (
                            <p className="truncate text-xs text-muted-foreground/70">
                              {entry.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
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
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          {formatHours(entry.durationMinutes)}
                        </Badge>
                        <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => {
                              setEditingId(entry.id);
                              setEditDraft({
                                startAt: toDatetimeLocalValue(
                                  new Date(entry.startAt),
                                ),
                                endAt: toDatetimeLocalValue(
                                  new Date(entry.endAt),
                                ),
                                activityTypeId: entry.activityTypeId,
                                description: entry.description,
                                isBillable: entry.isBillable,
                              });
                            }}
                          >
                            <Pencil className="size-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-destructive hover:text-destructive"
                            onClick={() =>
                              deleteEntry.mutate({ entryId: entry.id })
                            }
                            disabled={deleteEntry.isPending}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {!entriesQuery.data?.length && (
          <p className="py-12 text-center text-sm text-muted-foreground/50">
            No entries for the selected filters.
          </p>
        )}
      </div>
    </div>
  );
}
