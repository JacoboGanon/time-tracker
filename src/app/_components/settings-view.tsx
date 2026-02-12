"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Check,
  DollarSign,
  FolderPlus,
  Pencil,
  Plus,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";

import { ClientMembersDialog } from "./client-members-dialog";
import { SettingsViewSkeleton } from "./view-skeletons";

const toCurrency = (amountCents: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);

export function SettingsView() {
  const utils = api.useUtils();
  const clientsQuery = api.clients.list.useQuery();
  const projectsQuery = api.project.list.useQuery();
  const activitiesQuery = api.activityType.list.useQuery();
  const defaultRateQuery = api.rate.getMyDefaultRate.useQuery();

  // Client creation
  const [newClientName, setNewClientName] = useState("");

  // Project creation
  const [selectedClientId, setSelectedClientId] = useState("");
  const [newProjectName, setNewProjectName] = useState("");

  // Activity creation
  const [newActivityName, setNewActivityName] = useState("");

  // Rate
  const [rateDollars, setRateDollars] = useState("150");

  // Client member management
  const [managingClientId, setManagingClientId] = useState<string | null>(null);

  // Inline editing
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editClientName, setEditClientName] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState("");

  // Activity type editing/deleting
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editActivityName, setEditActivityName] = useState("");
  const [deleteActivityDialog, setDeleteActivityDialog] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Error state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (clientsQuery.data?.length && !selectedClientId) {
      setSelectedClientId(clientsQuery.data[0]!.id);
    }
  }, [clientsQuery.data, selectedClientId]);

  useEffect(() => {
    if (defaultRateQuery.data) {
      setRateDollars(
        (defaultRateQuery.data.hourlyRateCents / 100).toString(),
      );
    }
  }, [defaultRateQuery.data]);

  const createClient = api.clients.create.useMutation({
    onSuccess: async () => {
      await utils.clients.list.invalidate();
      setNewClientName("");
    },
  });

  const createProject = api.project.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.project.list.invalidate(),
        utils.timeEntry.list.invalidate(),
      ]);
      setNewProjectName("");
    },
  });

  const createActivityType = api.activityType.create.useMutation({
    onSuccess: async () => {
      await utils.activityType.list.invalidate();
      setNewActivityName("");
    },
  });

  const updateRate = api.rate.setMyDefaultRate.useMutation({
    onSuccess: async () => {
      await utils.rate.getMyDefaultRate.invalidate();
    },
  });

  const [deleteClientDialog, setDeleteClientDialog] = useState<{
    id: string;
    name: string;
    projectCount: number;
  } | null>(null);

  const [deleteProjectDialog, setDeleteProjectDialog] = useState<{
    id: string;
    name: string;
    clientName: string;
  } | null>(null);

  const deleteClient = api.clients.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.clients.list.invalidate(),
        utils.project.list.invalidate(),
        utils.timeEntry.list.invalidate(),
      ]);
      setDeleteClientDialog(null);
    },
  });

  const deleteProject = api.project.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.project.list.invalidate(),
        utils.timeEntry.list.invalidate(),
      ]);
      setDeleteProjectDialog(null);
    },
  });

  const updateClient = api.clients.update.useMutation({
    onSuccess: async () => {
      await utils.clients.list.invalidate();
      setEditingClientId(null);
    },
    onError: (error) => setErrorMsg(error.message),
  });

  const updateProject = api.project.update.useMutation({
    onSuccess: async () => {
      await utils.project.list.invalidate();
      setEditingProjectId(null);
    },
    onError: (error) => setErrorMsg(error.message),
  });

  const updateActivityType = api.activityType.update.useMutation({
    onSuccess: async () => {
      await utils.activityType.list.invalidate();
      setEditingActivityId(null);
    },
    onError: (error) => setErrorMsg(error.message),
  });

  const deleteActivityType = api.activityType.delete.useMutation({
    onSuccess: async () => {
      await utils.activityType.list.invalidate();
      setDeleteActivityDialog(null);
    },
    onError: (error) => {
      setErrorMsg(error.message);
      setDeleteActivityDialog(null);
    },
  });

  const managingClient = clientsQuery.data?.find(
    (c) => c.id === managingClientId,
  );

  if (clientsQuery.isLoading) {
    return <SettingsViewSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your workspace: clients, projects, activities, and rates.
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Clients */}
        <Card className="border-sidebar-border bg-sidebar">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="size-4 text-muted-foreground" />
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              <Input
                placeholder="New client name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newClientName.trim()) {
                    createClient.mutate({ name: newClientName.trim() });
                  }
                }}
              />
              <Button
                size="sm"
                className="shrink-0 bg-teal-600 hover:bg-teal-500"
                onClick={() =>
                  createClient.mutate({
                    name: newClientName.trim() || "New Client",
                  })
                }
                disabled={createClient.isPending}
              >
                <Plus className="mr-1 size-3.5" />
                Add
              </Button>
            </div>
            <div className="space-y-1.5">
              {clientsQuery.data?.map((client) => (
                <div
                  key={client.id}
                  className="group/item flex items-center justify-between rounded-md border border-border/50 bg-background/50 px-3 py-2"
                >
                  {editingClientId === client.id ? (
                    <div className="flex flex-1 items-center gap-1.5">
                      <Input
                        className="h-7 text-sm"
                        value={editClientName}
                        onChange={(e) => setEditClientName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editClientName.trim()) {
                            updateClient.mutate({
                              clientId: client.id,
                              name: editClientName.trim(),
                            });
                          }
                          if (e.key === "Escape") setEditingClientId(null);
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 p-0 text-teal-500"
                        onClick={() => {
                          if (editClientName.trim()) {
                            updateClient.mutate({
                              clientId: client.id,
                              name: editClientName.trim(),
                            });
                          }
                        }}
                        disabled={updateClient.isPending}
                      >
                        <Check className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 p-0"
                        onClick={() => setEditingClientId(null)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{client.name}</span>
                        {client.members?.[0]?.role === "owner" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-muted-foreground/0 transition-colors group-hover/item:text-muted-foreground/40 hover:!text-foreground"
                            onClick={() => {
                              setEditingClientId(client.id);
                              setEditClientName(client.name);
                            }}
                          >
                            <Pencil className="size-3" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          {client._count.members}{" "}
                          {client._count.members === 1 ? "member" : "members"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {client._count.projects}{" "}
                          {client._count.projects === 1 ? "project" : "projects"}
                        </Badge>
                        {client.members?.[0]?.role === "owner" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                              onClick={() => setManagingClientId(client.id)}
                            >
                              <Users className="size-3" />
                              Members
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-muted-foreground/40 hover:text-red-400"
                              onClick={() =>
                                setDeleteClientDialog({
                                  id: client.id,
                                  name: client.name,
                                  projectCount: client._count.projects,
                                })
                              }
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
              {!clientsQuery.data?.length && (
                <p className="py-3 text-center text-xs text-muted-foreground/50">
                  No clients yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card className="border-sidebar-border bg-sidebar">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FolderPlus className="size-4 text-muted-foreground" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-2">
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clientsQuery.data?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  placeholder="New project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      newProjectName.trim() &&
                      selectedClientId
                    ) {
                      createProject.mutate({
                        clientId: selectedClientId,
                        name: newProjectName.trim(),
                      });
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="shrink-0 bg-teal-600 hover:bg-teal-500"
                  onClick={() => {
                    if (!selectedClientId) return;
                    createProject.mutate({
                      clientId: selectedClientId,
                      name: newProjectName.trim() || "Untitled Project",
                    });
                  }}
                  disabled={createProject.isPending || !selectedClientId}
                >
                  <Plus className="mr-1 size-3.5" />
                  Add
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              {projectsQuery.data?.map((project) => {
                const isOwner = clientsQuery.data?.find(
                  (c) => c.id === project.client.id,
                )?.members?.[0]?.role === "owner";
                return (
                  <div
                    key={project.id}
                    className="group/item flex items-center justify-between rounded-md border border-border/50 bg-background/50 px-3 py-2"
                  >
                    {editingProjectId === project.id ? (
                      <div className="flex flex-1 items-center gap-1.5">
                        <Input
                          className="h-7 text-sm"
                          value={editProjectName}
                          onChange={(e) => setEditProjectName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && editProjectName.trim()) {
                              updateProject.mutate({
                                projectId: project.id,
                                name: editProjectName.trim(),
                              });
                            }
                            if (e.key === "Escape") setEditingProjectId(null);
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 shrink-0 p-0 text-teal-500"
                          onClick={() => {
                            if (editProjectName.trim()) {
                              updateProject.mutate({
                                projectId: project.id,
                                name: editProjectName.trim(),
                              });
                            }
                          }}
                          disabled={updateProject.isPending}
                        >
                          <Check className="size-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 shrink-0 p-0"
                          onClick={() => setEditingProjectId(null)}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{project.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({project.client.name})
                          </span>
                          {isOwner && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-muted-foreground/0 transition-colors group-hover/item:text-muted-foreground/40 hover:!text-foreground"
                              onClick={() => {
                                setEditingProjectId(project.id);
                                setEditProjectName(project.name);
                              }}
                            >
                              <Pencil className="size-3" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {project.code && (
                            <Badge
                              variant="secondary"
                              className="font-mono text-[10px]"
                            >
                              {project.code}
                            </Badge>
                          )}
                          {isOwner && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-muted-foreground/40 hover:text-red-400"
                              onClick={() =>
                                setDeleteProjectDialog({
                                  id: project.id,
                                  name: project.name,
                                  clientName: project.client.name,
                                })
                              }
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              {!projectsQuery.data?.length && (
                <p className="py-3 text-center text-xs text-muted-foreground/50">
                  No projects yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Types */}
        <Card className="border-sidebar-border bg-sidebar">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Tag className="size-4 text-muted-foreground" />
              Activity Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              <Input
                placeholder="New activity type"
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newActivityName.trim()) {
                    createActivityType.mutate({
                      name: newActivityName.trim(),
                    });
                  }
                }}
              />
              <Button
                size="sm"
                className="shrink-0 bg-teal-600 hover:bg-teal-500"
                onClick={() =>
                  createActivityType.mutate({
                    name: newActivityName.trim() || "General Work",
                  })
                }
                disabled={createActivityType.isPending}
              >
                <Plus className="mr-1 size-3.5" />
                Add
              </Button>
            </div>
            <div className="space-y-1.5">
              {activitiesQuery.data?.map((activity) => (
                <div
                  key={activity.id}
                  className="group/item flex items-center justify-between rounded-md border border-border/50 bg-background/50 px-3 py-2"
                >
                  {editingActivityId === activity.id ? (
                    <div className="flex flex-1 items-center gap-1.5">
                      <Input
                        className="h-7 text-sm"
                        value={editActivityName}
                        onChange={(e) => setEditActivityName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editActivityName.trim()) {
                            updateActivityType.mutate({
                              activityTypeId: activity.id,
                              name: editActivityName.trim(),
                            });
                          }
                          if (e.key === "Escape") setEditingActivityId(null);
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 p-0 text-teal-500"
                        onClick={() => {
                          if (editActivityName.trim()) {
                            updateActivityType.mutate({
                              activityTypeId: activity.id,
                              name: editActivityName.trim(),
                            });
                          }
                        }}
                        disabled={updateActivityType.isPending}
                      >
                        <Check className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 p-0"
                        onClick={() => setEditingActivityId(null)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{activity.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-muted-foreground/0 transition-colors group-hover/item:text-muted-foreground/40 hover:!text-foreground"
                          onClick={() => {
                            setEditingActivityId(activity.id);
                            setEditActivityName(activity.name);
                          }}
                        >
                          <Pencil className="size-3" />
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-muted-foreground/0 transition-colors group-hover/item:text-muted-foreground/40 hover:!text-red-400"
                        onClick={() =>
                          setDeleteActivityDialog({
                            id: activity.id,
                            name: activity.name,
                          })
                        }
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
              {!activitiesQuery.data?.length && (
                <p className="py-3 text-center text-xs text-muted-foreground/50">
                  No activity types yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Default Rate */}
        <Card className="border-sidebar-border bg-sidebar">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="size-4 text-muted-foreground" />
              Default Hourly Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  className="pl-7"
                  value={rateDollars}
                  onChange={(e) => setRateDollars(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const cents = Math.round(
                        Number(rateDollars || "0") * 100,
                      );
                      updateRate.mutate({
                        hourlyRateCents: Math.max(0, cents),
                      });
                    }
                  }}
                />
              </div>
              <Button
                size="sm"
                className="shrink-0 bg-teal-600 hover:bg-teal-500"
                onClick={() => {
                  const cents = Math.round(Number(rateDollars || "0") * 100);
                  updateRate.mutate({
                    hourlyRateCents: Math.max(0, cents),
                  });
                }}
                disabled={updateRate.isPending}
              >
                Save Rate
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Current rate:{" "}
              <span className="font-medium text-foreground">
                {defaultRateQuery.data
                  ? toCurrency(defaultRateQuery.data.hourlyRateCents)
                  : "Not set"}
              </span>{" "}
              / hour. Used for all projects without a specific override.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client Members Dialog */}
      {managingClient && (
        <ClientMembersDialog
          clientId={managingClient.id}
          clientName={managingClient.name}
          open={!!managingClientId}
          onOpenChange={(open) => !open && setManagingClientId(null)}
        />
      )}

      {/* Delete Client Dialog */}
      <AlertDialog
        open={!!deleteClientDialog}
        onOpenChange={(open) => !open && setDeleteClientDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">
                {deleteClientDialog?.name}
              </span>{" "}
              and all associated data: {deleteClientDialog?.projectCount}{" "}
              {deleteClientDialog?.projectCount === 1 ? "project" : "projects"},
              all time entries, members, rate overrides, and reports. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteClient.isPending}
              onClick={() => {
                if (deleteClientDialog) {
                  deleteClient.mutate({ clientId: deleteClientDialog.id });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Project Dialog */}
      <AlertDialog
        open={!!deleteProjectDialog}
        onOpenChange={(open) => !open && setDeleteProjectDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">
                {deleteProjectDialog?.name}
              </span>{" "}
              from {deleteProjectDialog?.clientName} and all associated time
              entries and rate overrides. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProject.isPending}
              onClick={() => {
                if (deleteProjectDialog) {
                  deleteProject.mutate({ projectId: deleteProjectDialog.id });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Activity Type Dialog */}
      <AlertDialog
        open={!!deleteActivityDialog}
        onOpenChange={(open) => !open && setDeleteActivityDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity Type?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">
                {deleteActivityDialog?.name}
              </span>
              . Activity types that are in use by time entries cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteActivityType.isPending}
              onClick={() => {
                if (deleteActivityDialog) {
                  deleteActivityType.mutate({
                    activityTypeId: deleteActivityDialog.id,
                  });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
