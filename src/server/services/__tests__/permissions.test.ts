import { describe, expect, it } from "bun:test";

import {
  canEditEntry,
  canManageMembership,
  canManageProject,
  canViewAllEntries,
} from "../permissions";

describe("permissions service", () => {
  it("allows only owner to manage project settings", () => {
    expect(canManageProject("owner")).toBe(true);
    expect(canManageProject("member")).toBe(false);
  });

  it("allows only owner to view all entries", () => {
    expect(canViewAllEntries("owner")).toBe(true);
    expect(canViewAllEntries("member")).toBe(false);
  });

  it("allows only owner to manage membership", () => {
    expect(canManageMembership("owner")).toBe(true);
    expect(canManageMembership("member")).toBe(false);
  });

  it("allows owners to edit any entry but members only their own", () => {
    expect(
      canEditEntry({
        role: "owner",
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
  });
});
