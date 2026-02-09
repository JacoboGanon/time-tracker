import { describe, expect, it } from "bun:test";

import {
  canEditEntry,
  canManageMembership,
  canManageProject,
  canViewProject,
} from "../permissions";

describe("permissions service", () => {
  it("allows all project roles to view", () => {
    expect(canViewProject("owner")).toBe(true);
    expect(canViewProject("manager")).toBe(true);
    expect(canViewProject("member")).toBe(true);
    expect(canViewProject("viewer")).toBe(true);
  });

  it("allows only owner and manager to manage project settings", () => {
    expect(canManageProject("owner")).toBe(true);
    expect(canManageProject("manager")).toBe(true);
    expect(canManageProject("member")).toBe(false);
    expect(canManageProject("viewer")).toBe(false);
  });

  it("allows only owner to manage project membership", () => {
    expect(canManageMembership("owner")).toBe(true);
    expect(canManageMembership("manager")).toBe(false);
    expect(canManageMembership("member")).toBe(false);
    expect(canManageMembership("viewer")).toBe(false);
  });

  it("allows managers/owners to edit any entry but members only their own", () => {
    expect(
      canEditEntry({
        role: "owner",
        requesterId: "u-1",
        entryUserId: "u-2",
      }),
    ).toBe(true);

    expect(
      canEditEntry({
        role: "manager",
        requesterId: "u-1",
        entryUserId: "u-2",
      }),
    ).toBe(true);

    expect(
      canEditEntry({
        role: "member",
        requesterId: "u-1",
        entryUserId: "u-1",
      }),
    ).toBe(true);

    expect(
      canEditEntry({
        role: "member",
        requesterId: "u-1",
        entryUserId: "u-2",
      }),
    ).toBe(false);

    expect(
      canEditEntry({
        role: "viewer",
        requesterId: "u-1",
        entryUserId: "u-1",
      }),
    ).toBe(false);
  });
});
