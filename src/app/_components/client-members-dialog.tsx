"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search, Trash2, Users, X } from "lucide-react";

import { api } from "~/trpc/react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { ScrollArea } from "~/components/ui/scroll-area";

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2)
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-teal-600/15 text-teal-400",
  "bg-amber-600/15 text-amber-400",
  "bg-rose-600/15 text-rose-400",
  "bg-violet-600/15 text-violet-400",
  "bg-sky-600/15 text-sky-400",
  "bg-emerald-600/15 text-emerald-400",
  "bg-orange-600/15 text-orange-400",
  "bg-pink-600/15 text-pink-400",
] as const;

function avatarColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

function MemberRateInput({
  memberId,
  clientId,
  initialCents,
}: {
  memberId: string;
  clientId: string;
  initialCents: number | null;
}) {
  const utils = api.useUtils();
  const [editing, setEditing] = useState(false);
  const [dollars, setDollars] = useState(
    initialCents !== null ? (initialCents / 100).toString() : "",
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const setRate = api.clients.setMemberRate.useMutation({
    onSuccess: () => {
      void utils.clients.listMembers.invalidate({ clientId });
      setEditing(false);
    },
  });

  const save = () => {
    const cents = Math.round(Number(dollars || "0") * 100);
    setRate.mutate({
      clientId,
      userId: memberId,
      hourlyRateCents: Math.max(0, cents),
    });
  };

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="rounded-md px-2 py-1 text-right font-mono text-xs tabular-nums text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        {initialCents !== null ? (
          <span>
            <span className="text-foreground/80">
              ${(initialCents / 100).toFixed(0)}
            </span>
            <span className="text-muted-foreground/60">/hr</span>
          </span>
        ) : (
          <span className="italic text-muted-foreground/40">Set rate</span>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="relative w-[72px]">
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[11px] text-muted-foreground/60">
          $
        </span>
        <Input
          ref={inputRef}
          type="number"
          step="1"
          min="0"
          className="h-7 pl-5 pr-1 font-mono text-xs tabular-nums"
          placeholder="0"
          value={dollars}
          onChange={(e) => setDollars(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          onBlur={save}
        />
      </div>
    </div>
  );
}

export function ClientMembersDialog({
  clientId,
  clientName,
  open,
  onOpenChange,
}: {
  clientId: string;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const utils = api.useUtils();
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  const membersQuery = api.clients.listMembers.useQuery(
    { clientId },
    { enabled: open },
  );
  const allUsersQuery = api.clients.listAllUsers.useQuery(undefined, {
    enabled: open,
  });

  const addMember = api.clients.addMember.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.clients.listMembers.invalidate({ clientId }),
        utils.clients.list.invalidate(),
      ]);
      setSearch("");
    },
  });

  const removeMember = api.clients.removeMember.useMutation({
    onSuccess: () =>
      Promise.all([
        utils.clients.listMembers.invalidate({ clientId }),
        utils.clients.list.invalidate(),
      ]),
  });

  // Reset search state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch("");
      setSearchFocused(false);
    }
  }, [open]);

  // Click-outside to close search results
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const existingUserIds = new Set(
    membersQuery.data?.map((m) => m.user.id) ?? [],
  );
  const availableUsers = (allUsersQuery.data ?? []).filter(
    (u) => !existingUserIds.has(u.id),
  );
  const filteredUsers = search.trim()
    ? availableUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      )
    : availableUsers;

  const members = membersQuery.data ?? [];
  const showDropdown = searchFocused && availableUsers.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 border-sidebar-border bg-sidebar p-0 sm:max-w-lg">
        {/* Header */}
        <div className="space-y-1.5 px-6 pt-6 pb-4">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-base font-semibold tracking-tight">
              {clientName}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
              Manage who can track time for this client and set individual
              hourly rates. Added members are automatically assigned to all
              projects under this client.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Search-to-add section */}
        {availableUsers.length > 0 && (
          <div className="relative px-6 pb-4" ref={searchWrapperRef}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                placeholder="Search people to add..."
                className="h-9 pl-9 pr-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground/40 transition-colors hover:text-muted-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Search results dropdown */}
            {showDropdown && (
              <div className="absolute left-6 right-6 z-10 mt-1.5 overflow-hidden rounded-lg border border-border/80 bg-popover shadow-lg">
                {filteredUsers.length > 0 ? (
                  <ScrollArea className="max-h-48">
                    <div className="py-1">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent/60"
                          onClick={() =>
                            addMember.mutate({ clientId, userId: user.id })
                          }
                          disabled={addMember.isPending}
                        >
                          <Avatar size="sm">
                            <AvatarFallback
                              className={`text-[10px] font-semibold ${avatarColor(user.id)}`}
                            >
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">
                              {user.name}
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-600/10 text-teal-500 transition-colors group-hover:bg-teal-600/20">
                            <Plus className="size-3" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs text-muted-foreground/60">
                      No matching people found
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Members header */}
        <div className="flex items-center gap-2 px-6 pt-4 pb-2">
          <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
            {members.length} {members.length === 1 ? "member" : "members"}
          </span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        {/* Members list */}
        <ScrollArea className="max-h-72">
          <div className="space-y-1 px-6 pb-6">
            {members.map((member) => {
              const isOwner = member.role === "owner";
              return (
                <div
                  key={member.id}
                  className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border/40 hover:bg-background/40"
                >
                  <Avatar>
                    <AvatarFallback
                      className={`text-xs font-semibold ${
                        isOwner
                          ? "bg-teal-600/20 text-teal-400"
                          : avatarColor(member.user.id)
                      }`}
                    >
                      {getInitials(member.user.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {member.user.name}
                      </span>
                      {isOwner && (
                        <span className="shrink-0 rounded-full bg-teal-600/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-teal-500">
                          owner
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] leading-none text-muted-foreground/70">
                      {member.user.email}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <MemberRateInput
                      memberId={member.user.id}
                      clientId={clientId}
                      initialCents={member.hourlyRateCents}
                    />
                    {!isOwner && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 p-0 text-muted-foreground/30 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                        disabled={removeMember.isPending}
                        onClick={() =>
                          removeMember.mutate({
                            clientId,
                            userId: member.user.id,
                          })
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {members.length === 0 && (
              <div className="flex flex-col items-center gap-2.5 py-10 text-center">
                <div className="rounded-full bg-muted/30 p-3">
                  <Users className="size-5 text-muted-foreground/30" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground/50">
                    No members yet
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/30">
                    Search above to add people to this client.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
