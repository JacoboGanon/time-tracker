export type ClientRole = "owner" | "member";

type EditEntryInput = {
  role: ClientRole;
  requesterId: string;
  entryUserId: string;
};

export const canManageProject = (role: ClientRole): boolean =>
  role === "owner";

export const canViewAllEntries = (role: ClientRole): boolean =>
  role === "owner";

export const canManageMembership = (role: ClientRole): boolean =>
  role === "owner";

export const canEditEntry = ({
  role,
  requesterId,
  entryUserId,
}: EditEntryInput): boolean => {
  if (role === "owner") {
    return true;
  }

  if (role === "member") {
    return requesterId === entryUserId;
  }

  return false;
};
