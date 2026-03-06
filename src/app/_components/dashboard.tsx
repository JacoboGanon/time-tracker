"use client";

import { useCallback } from "react";
import { Keyboard } from "lucide-react";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { usePersistedState } from "~/hooks/use-persisted-state";
import {
  ShortcutProvider,
  useShortcut,
  useShortcuts,
  formatKeyForDisplay,
} from "~/hooks/use-keyboard-shortcuts";
import { Separator } from "~/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

import { ErrorBoundary } from "~/components/error-boundary";

import { AppSidebar, type ViewId } from "./app-sidebar";
import { ProjectFilterProvider } from "./client-filter-context";
import { KeyboardShortcutsDialog } from "./keyboard-shortcuts-dialog";
import { TimerView } from "./timer-view";
import { EntriesView } from "./entries-view";
import { ReportsView } from "./reports-view";
import { SettingsView } from "./settings-view";

const VIEW_COMPONENTS: Record<ViewId, React.ComponentType> = {
  timer: TimerView,
  entries: EntriesView,
  reports: ReportsView,
  settings: SettingsView,
};

const VIEW_LABELS: Record<ViewId, string> = {
  timer: "Timer",
  entries: "Entries",
  reports: "Reports",
  settings: "Settings",
};

interface TimeTrackerDashboardProps {
  userName: string;
}

function DashboardShortcuts({
  onNavigate,
}: {
  onNavigate: (view: ViewId) => void;
}) {
  const { setDialogOpen } = useShortcuts();

  useShortcut("nav-timer", useCallback(() => onNavigate("timer"), [onNavigate]));
  useShortcut("nav-entries", useCallback(() => onNavigate("entries"), [onNavigate]));
  useShortcut("nav-reports", useCallback(() => onNavigate("reports"), [onNavigate]));
  useShortcut("nav-settings", useCallback(() => onNavigate("settings"), [onNavigate]));
  useShortcut("show-shortcuts", useCallback(() => setDialogOpen(true), [setDialogOpen]));

  return null;
}

function ShortcutsButton() {
  const { setDialogOpen, bindings } = useShortcuts();
  const shortcutKey = bindings["show-shortcuts"] ?? "?";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
        >
          <Keyboard className="size-3.5" />
          <kbd className="hidden font-mono text-[10px] sm:inline">
            {formatKeyForDisplay(shortcutKey)}
          </kbd>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Keyboard shortcuts</TooltipContent>
    </Tooltip>
  );
}

export function TimeTrackerDashboard({ userName }: TimeTrackerDashboardProps) {
  const [activeView, setActiveView] = usePersistedState<ViewId>("tt:activeView", "timer");
  const ActiveComponent = VIEW_COMPONENTS[activeView];

  return (
    <ProjectFilterProvider>
      <ShortcutProvider>
        <DashboardShortcuts onNavigate={setActiveView} />
        <KeyboardShortcutsDialog />
        <SidebarProvider>
          <AppSidebar
            activeView={activeView}
            onNavigate={setActiveView}
            userName={userName}
          />
          <SidebarInset>
            <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 !h-4" />
              <span className="flex-1 text-sm font-medium text-muted-foreground">
                {VIEW_LABELS[activeView]}
              </span>
              <ShortcutsButton />
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-6">
              <ErrorBoundary key={activeView}>
                <ActiveComponent />
              </ErrorBoundary>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </ShortcutProvider>
    </ProjectFilterProvider>
  );
}
