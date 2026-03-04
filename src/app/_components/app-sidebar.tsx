"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  FileText,
  Layers,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Settings,
  Timer,
  Users,
} from "lucide-react";

import { authClient } from "~/server/better-auth/client";
import { ALL_CLIENTS_ID, useProjectFilter } from "./client-filter-context";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "~/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { ClientMembersDialog } from "./client-members-dialog";

const NAV_ITEMS = [
  { id: "timer", label: "Timer", icon: Timer },
  { id: "entries", label: "Entries", icon: ListTodo },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export type ViewId = (typeof NAV_ITEMS)[number]["id"];

interface AppSidebarProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  userName: string;
}

export function AppSidebar({ activeView, onNavigate, userName }: AppSidebarProps) {
  const {
    clients,
    projects,
    selectedClientId,
    setSelectedClientId,
    selectedProjectId,
    setSelectedProjectId,
    clientProjects,
    isAllClients,
  } = useProjectFilter();

  const [managingClientId, setManagingClientId] = useState<string | null>(null);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const isOwner = selectedClient?.members?.[0]?.role === "owner";

  // Group projects by client for "All" view
  const projectsByClient = useMemo(() => {
    if (!isAllClients) return null;
    const grouped = new Map<string, { clientName: string; projects: typeof projects }>();
    for (const project of projects) {
      const existing = grouped.get(project.clientId);
      if (existing) {
        existing.projects.push(project);
      } else {
        grouped.set(project.clientId, {
          clientName: project.client.name,
          projects: [project],
        });
      }
    }
    return grouped;
  }, [isAllClients, projects]);

  const totalProjectCount = isAllClients ? projects.length : clientProjects.length;

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  {isAllClients ? (
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
                      <Layers className="size-4" />
                    </div>
                  ) : (
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
                      <span className="text-sm font-bold">
                        {selectedClient?.name?.[0]?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                  )}
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {isAllClients
                        ? "All companies"
                        : (selectedClient?.name ?? "Select company")}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {totalProjectCount} project{totalProjectCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground/60" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                {/* All companies option */}
                <DropdownMenuItem
                  onClick={() => setSelectedClientId(ALL_CLIENTS_ID)}
                  className="gap-2"
                >
                  <div className="flex size-6 items-center justify-center rounded bg-teal-500/15 text-teal-400">
                    <Layers className="size-3.5" />
                  </div>
                  <span className="flex-1">All companies</span>
                  {isAllClients && (
                    <Check className="size-4 text-teal-400" />
                  )}
                </DropdownMenuItem>
                {clients.length > 0 && <DropdownMenuSeparator />}
                {clients.map((client) => (
                  <DropdownMenuItem
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className="gap-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded bg-teal-500/15 text-xs font-bold text-teal-400">
                      {client.name[0]?.toUpperCase()}
                    </div>
                    <span className="flex-1 truncate">{client.name}</span>
                    {client.id === selectedClientId && (
                      <Check className="size-4 text-teal-400" />
                    )}
                  </DropdownMenuItem>
                ))}
                {clients.length === 0 && (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No companies yet
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeView === item.id}
                    onClick={() => onNavigate(item.id)}
                    tooltip={item.label}
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Projects — single client */}
        {!isAllClients && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <span className="flex-1">Projects</span>
              {isOwner && (
                <button
                  onClick={() => setManagingClientId(selectedClientId)}
                  className="flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground/40 transition-colors hover:bg-accent hover:text-muted-foreground group-has-[[data-collapsible=icon]]/sidebar-wrapper:hidden"
                >
                  <Users className="size-3" />
                </button>
              )}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {clientProjects.map((project) => {
                  const isActive = selectedProjectId === project.id;
                  return (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton
                        className={`text-xs ${isActive ? "bg-teal-500/10 text-teal-300 hover:bg-teal-500/15" : ""}`}
                        onClick={() => {
                          setSelectedProjectId(isActive ? null : project.id);
                        }}
                        tooltip={project.name}
                      >
                        <LayoutDashboard
                          className={`size-3.5 ${isActive ? "text-teal-400" : "text-muted-foreground/70"}`}
                        />
                        <span className="truncate">{project.name}</span>
                      </SidebarMenuButton>
                      {project.code && (
                        <SidebarMenuBadge className="text-[9px] font-mono opacity-60">
                          {project.code}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
                {clientProjects.length === 0 && (
                  <p className="px-2 py-2 text-xs text-muted-foreground/50">
                    No projects yet
                  </p>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Projects — all clients, grouped */}
        {isAllClients && projectsByClient && (
          <>
            {Array.from(projectsByClient.entries()).map(([clientId, { clientName, projects: groupProjects }]) => (
              <SidebarGroup key={clientId}>
                <SidebarGroupLabel>{clientName}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {groupProjects.map((project) => {
                      const isActive = selectedProjectId === project.id;
                      return (
                        <SidebarMenuItem key={project.id}>
                          <SidebarMenuButton
                            className={`text-xs ${isActive ? "bg-teal-500/10 text-teal-300 hover:bg-teal-500/15" : ""}`}
                            onClick={() => {
                              setSelectedProjectId(isActive ? null : project.id);
                            }}
                            tooltip={project.name}
                          >
                            <LayoutDashboard
                              className={`size-3.5 ${isActive ? "text-teal-400" : "text-muted-foreground/70"}`}
                            />
                            <span className="truncate">{project.name}</span>
                          </SidebarMenuButton>
                          {project.code && (
                            <SidebarMenuBadge className="text-[9px] font-mono opacity-60">
                              {project.code}
                            </SidebarMenuBadge>
                          )}
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
            {projects.length === 0 && (
              <SidebarGroup>
                <SidebarGroupContent>
                  <p className="px-2 py-2 text-xs text-muted-foreground/50">
                    No projects yet
                  </p>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="text-left"
              onClick={async () => {
                await authClient.signOut();
                window.location.href = "/auth/sign-in";
              }}
              tooltip="Sign out"
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-teal-500/15 text-xs font-medium text-teal-300">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate text-xs font-medium">{userName}</span>
                <span className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                  <LogOut className="size-2.5" />
                  Sign out
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Client Members Dialog */}
      {managingClientId && (
        <ClientMembersDialog
          clientId={managingClientId}
          clientName={
            clients.find((c) => c.id === managingClientId)?.name ?? ""
          }
          open={!!managingClientId}
          onOpenChange={(open) => !open && setManagingClientId(null)}
        />
      )}
    </Sidebar>
  );
}
