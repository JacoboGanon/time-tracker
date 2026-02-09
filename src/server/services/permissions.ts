export type ProjectRole = "owner" | "manager" | "member" | "viewer";

type EditEntryInput = {
  role: ProjectRole;
  requesterId: string;
  entryUserId: string;
};

export const canViewProject = (_role: ProjectRole): boolean => true;

export const canManageProject = (role: ProjectRole): boolean =>
  role === "owner" || role === "manager";

export const canManageMembership = (role: ProjectRole): boolean =>
  role === "owner";

export const canEditEntry = ({
  role,
  requesterId,
  entryUserId,
}: EditEntryInput): boolean => {
  if (role === "owner" || role === "manager") {
    return true;
  }

  if (role === "member") {
    return requesterId === entryUserId;
  }

  return false;
};
