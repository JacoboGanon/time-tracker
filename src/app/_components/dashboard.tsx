"use client";

import { useState } from "react";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { Separator } from "~/components/ui/separator";

import { AppSidebar, type ViewId } from "./app-sidebar";
import { ClientFilterProvider } from "./client-filter-context";
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

export function TimeTrackerDashboard({ userName }: TimeTrackerDashboardProps) {
  const [activeView, setActiveView] = useState<ViewId>("timer");
  const ActiveComponent = VIEW_COMPONENTS[activeView];

  return (
    <ClientFilterProvider>
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
            <span className="text-sm font-medium text-muted-foreground">
              {VIEW_LABELS[activeView]}
            </span>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <ActiveComponent />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ClientFilterProvider>
  );
}
