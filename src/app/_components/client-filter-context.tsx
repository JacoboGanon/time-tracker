"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "~/trpc/react";

/** Use this sentinel to represent "All companies" in the selector */
export const ALL_CLIENTS_ID = "__all__" as const;

type ProjectFilterContextValue = {
  clients: { id: string; name: string; members?: { role: string }[] }[];
  projects: {
    id: string;
    name: string;
    code: string | null;
    clientId: string;
    client: { id: string; name: string };
  }[];
  /** `null` before data loads, a client ID, or `ALL_CLIENTS_ID` */
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  /** Returns [selectedProjectId] if set, otherwise all project IDs for the selected client (or all projects when "All") */
  activeProjectIds: string[];
  /** Projects for the currently selected client, or all projects when "All" */
  clientProjects: ProjectFilterContextValue["projects"];
  /** Whether "All companies" is selected */
  isAllClients: boolean;
};

const ProjectFilterContext = createContext<ProjectFilterContextValue | null>(
  null,
);

export function ProjectFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: clients } = api.clients.list.useQuery();
  const { data: projects } = api.project.list.useQuery();

  const [selectedClientId, setSelectedClientIdRaw] = useState<string | null>(
    null,
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  const isAllClients = selectedClientId === ALL_CLIENTS_ID;

  // Auto-select first client when data loads
  useEffect(() => {
    if (selectedClientId) return;
    if (clients?.length) {
      setSelectedClientIdRaw(clients[0]!.id);
    }
  }, [clients, selectedClientId]);

  // When switching client, clear project selection
  const setSelectedClientId = useCallback(
    (id: string | null) => {
      setSelectedClientIdRaw(id);
      setSelectedProjectId(null);
    },
    [],
  );

  // If current client disappears from the list, reset (but not for "All")
  useEffect(() => {
    if (!clients?.length) return;
    if (
      selectedClientId &&
      selectedClientId !== ALL_CLIENTS_ID &&
      !clients.some((c) => c.id === selectedClientId)
    ) {
      setSelectedClientIdRaw(clients[0]!.id);
      setSelectedProjectId(null);
    }
  }, [clients, selectedClientId]);

  const clientProjects = useMemo(
    () =>
      isAllClients
        ? (projects ?? [])
        : (projects ?? []).filter((p) => p.clientId === selectedClientId),
    [projects, selectedClientId, isAllClients],
  );

  // If selected project is no longer in the client's project list, clear it
  useEffect(() => {
    if (selectedProjectId && !clientProjects.some((p) => p.id === selectedProjectId)) {
      setSelectedProjectId(null);
    }
  }, [clientProjects, selectedProjectId]);

  const activeProjectIds = useMemo(() => {
    if (selectedProjectId) return [selectedProjectId];
    return clientProjects.map((p) => p.id);
  }, [selectedProjectId, clientProjects]);

  return (
    <ProjectFilterContext.Provider
      value={{
        clients: clients ?? [],
        projects: projects ?? [],
        selectedClientId,
        setSelectedClientId,
        selectedProjectId,
        setSelectedProjectId,
        activeProjectIds,
        clientProjects,
        isAllClients,
      }}
    >
      {children}
    </ProjectFilterContext.Provider>
  );
}

export function useProjectFilter() {
  const ctx = useContext(ProjectFilterContext);
  if (!ctx) {
    throw new Error(
      "useProjectFilter must be used within ProjectFilterProvider",
    );
  }
  return ctx;
}
