"use client";

import { useState } from "react";
import {
  Clock,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Settings,
  Timer,
  Users,
} from "lucide-react";

import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";
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
  const projectsQuery = api.project.list.useQuery();
  const clientsQuery = api.clients.list.useQuery();
  const session = authClient.useSession();
  const currentUserId = session.data?.user?.id;
  const [managingClientId, setManagingClientId] = useState<string | null>(null);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const projectsByClient = (clientsQuery.data ?? []).map((client) => ({
    ...client,
    projects: (projectsQuery.data ?? []).filter((p) => p.client.id === client.id),
  }));

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent"
              onClick={() => onNavigate("timer")}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
                <Clock className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Time Tracker</span>
                <span className="truncate text-xs text-muted-foreground">Workspace</span>
              </div>
            </SidebarMenuButton>
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

        <SidebarGroup>
          <SidebarGroupLabel>
            <FolderKanban className="mr-1.5 size-3.5" />
            Projects
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projectsByClient.map((client) =>
                client.projects.length > 0 ? (
                  <div key={client.id}>
                    <div className="mb-1 mt-2 flex items-center gap-1 px-2 first:mt-0">
                      <p className="flex-1 truncate text-[10px] font-medium tracking-widest text-muted-foreground/60 uppercase">
                        {client.name}
                      </p>
                      {client.createdById === currentUserId && (
                        <button
                          onClick={() => setManagingClientId(client.id)}
                          className="flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground/40 transition-colors hover:bg-accent hover:text-muted-foreground group-has-[[data-collapsible=icon]]/sidebar-wrapper:hidden"
                        >
                          <Users className="size-3" />
                        </button>
                      )}
                    </div>
                    {client.projects.map((project) => (
                      <SidebarMenuItem key={project.id}>
                        <SidebarMenuButton
                          className="text-xs"
                          onClick={() => onNavigate("entries")}
                          tooltip={`${client.name} / ${project.name}`}
                        >
                          <LayoutDashboard className="size-3.5 text-muted-foreground/70" />
                          <span className="truncate">{project.name}</span>
                        </SidebarMenuButton>
                        {project.code && (
                          <SidebarMenuBadge className="text-[9px] font-mono opacity-60">
                            {project.code}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    ))}
                  </div>
                ) : null,
              )}
              {!projectsQuery.data?.length && (
                <p className="px-2 py-2 text-xs text-muted-foreground/50">
                  No projects yet
                </p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
      {managingClientId && currentUserId && (
        <ClientMembersDialog
          clientId={managingClientId}
          clientName={
            clientsQuery.data?.find((c) => c.id === managingClientId)?.name ??
            ""
          }
          currentUserId={currentUserId}
          open={!!managingClientId}
          onOpenChange={(open) => !open && setManagingClientId(null)}
        />
      )}
    </Sidebar>
  );
}
