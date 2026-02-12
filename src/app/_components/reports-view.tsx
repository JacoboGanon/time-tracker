"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Clock,
  DollarSign,
  Download,
  FolderKanban,
  Save,
  Users,
} from "lucide-react";

import { api } from "~/trpc/react";
import { useFilteredProjects } from "./client-filter-context";
import { ReportsViewSkeleton } from "./view-skeletons";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
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

const toCurrency = (amountCents: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);

const formatHours = (minutes: number): string =>
  `${(minutes / 60).toFixed(1)}h`;

const ALL_VALUE = "__all__";

export function ReportsView() {
  const utils = api.useUtils();
  const { data: projects } = useFilteredProjects();

  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [projectId, setProjectId] = useState(ALL_VALUE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset project filter when selected project leaves the filtered list
  useEffect(() => {
    if (projectId === ALL_VALUE || !projects) return;
    if (!projects.some((p) => p.id === projectId)) {
      setProjectId(ALL_VALUE);
    }
  }, [projects, projectId]);

  const filters = useMemo(
    () => ({
      startDate: toDateAtStartOfDay(startDate) ?? new Date(),
      endDate: toDateAtEndOfDay(endDate) ?? new Date(),
      projectId: projectId === ALL_VALUE ? undefined : projectId,
    }),
    [startDate, endDate, projectId],
  );

  const summaryQuery = api.report.summary.useQuery(filters);
  const summary = summaryQuery.data?.summary;

  const generateSnapshot = api.report.generate.useMutation({
    onSuccess: async () => {
      await utils.report.list.invalidate();
    },
    onError: (error) => setErrorMsg(error.message),
  });

  if (summaryQuery.isLoading) {
    return <ReportsViewSkeleton />;
  }

  const exportPdf = async () => {
    try {
      const payload = await utils.report.exportPdf.fetch({
        title: "Time Tracker Report",
        filters,
      });
      const href = `data:application/pdf;base64,${payload.base64}`;
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = payload.fileName;
      anchor.click();
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : "Failed to export report",
      );
    }
  };

  const statCards = [
    {
      label: "Total Revenue",
      value: summary ? toCurrency(summary.totalBillableAmountCents) : "$0.00",
      icon: DollarSign,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
    },
    {
      label: "Hours Tracked",
      value: summary ? formatHours(summary.totalMinutes) : "0.0h",
      icon: Clock,
      iconBg: "bg-teal-500/10",
      iconColor: "text-teal-400",
    },
    {
      label: "Projects",
      value: summary?.byProject.length ?? 0,
      icon: FolderKanban,
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
    },
    {
      label: "Team Members",
      value: summary?.byMember.length ?? 0,
      icon: Users,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analyze your time data and generate client-ready reports.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => generateSnapshot.mutate(filters)}
            disabled={generateSnapshot.isPending}
          >
            <Save className="size-3.5" />
            Save Snapshot
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-teal-600 hover:bg-teal-500"
            onClick={exportPdf}
          >
            <Download className="size-3.5" />
            Export PDF
          </Button>
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
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-muted-foreground uppercase">
            To
          </Label>
          <Input
            type="date"
            className="h-9 w-[150px]"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-muted-foreground uppercase">
            Project
          </Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="h-9 w-[200px]">
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
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border-sidebar-border bg-sidebar">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-10 items-center justify-center rounded-lg ${card.iconBg}`}
                >
                  <card.icon className={`size-4.5 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-tight">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Breakdowns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Project */}
        <Card className="border-sidebar-border bg-sidebar">
          <CardContent className="pt-5">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">By Project</h3>
            </div>
            <div className="space-y-3">
              {summary?.byProject.map((item) => {
                const pct =
                  summary.totalMinutes > 0
                    ? (item.totalMinutes / summary.totalMinutes) * 100
                    : 0;
                return (
                  <div key={item.projectId}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm">{item.projectName}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatHours(item.totalMinutes)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-teal-500 transition-all duration-500"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {!summary?.byProject.length && (
                <p className="text-sm text-muted-foreground/50">
                  No data for this period.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* By Member */}
        <Card className="border-sidebar-border bg-sidebar">
          <CardContent className="pt-5">
            <div className="mb-4 flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">By Team Member</h3>
            </div>
            <div className="space-y-3">
              {summary?.byMember.map((item) => {
                const pct =
                  summary.totalMinutes > 0
                    ? (item.totalMinutes / summary.totalMinutes) * 100
                    : 0;
                return (
                  <div key={item.userId}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm">{item.userName}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatHours(item.totalMinutes)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all duration-500"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {!summary?.byMember.length && (
                <p className="text-sm text-muted-foreground/50">
                  No data for this period.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* By Activity */}
        <Card className="border-sidebar-border bg-sidebar lg:col-span-2">
          <CardContent className="pt-5">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">By Activity Type</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {summary?.byActivity.map((item) => (
                <div
                  key={item.activityTypeId}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 px-3 py-2.5"
                >
                  <span className="text-sm">{item.activityTypeName}</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {formatHours(item.totalMinutes)}
                  </Badge>
                </div>
              ))}
              {!summary?.byActivity.length && (
                <p className="text-sm text-muted-foreground/50">
                  No data for this period.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
