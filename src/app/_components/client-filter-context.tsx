"use client";

import { createContext, useContext, useMemo, useState } from "react";

import { api } from "~/trpc/react";

type ClientFilterContextValue = {
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
};

const ClientFilterContext = createContext<ClientFilterContextValue | null>(null);

export function ClientFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  return (
    <ClientFilterContext.Provider
      value={{
        selectedClientId,
        setSelectedClientId,
        selectedProjectId,
        setSelectedProjectId,
      }}
    >
      {children}
    </ClientFilterContext.Provider>
  );
}

export function useClientFilter() {
  const ctx = useContext(ClientFilterContext);
  if (!ctx) {
    throw new Error("useClientFilter must be used within ClientFilterProvider");
  }
  return ctx;
}

export function useFilteredProjects() {
  const { selectedClientId } = useClientFilter();
  const query = api.project.list.useQuery();

  const data = useMemo(() => {
    if (!query.data) return undefined;
    if (!selectedClientId) return query.data;
    return query.data.filter((p) => p.client.id === selectedClientId);
  }, [query.data, selectedClientId]);

  return { ...query, data };
}
