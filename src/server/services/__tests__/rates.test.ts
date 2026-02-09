import { describe, expect, it } from "bun:test";

import { calculateEntryAmountCents, resolveHourlyRateCents } from "../rates";

describe("rates service", () => {
  it("prefers project override to default rate", () => {
    const rate = resolveHourlyRateCents({
      defaultRateCents: 10_000,
      projectOverrideRateCents: 12_500,
    });

    expect(rate).toBe(12_500);
  });

  it("falls back to default rate when no project override is set", () => {
    const rate = resolveHourlyRateCents({
      defaultRateCents: 8_000,
      projectOverrideRateCents: null,
    });

    expect(rate).toBe(8_000);
  });

  it("returns null when no rate exists", () => {
    const rate = resolveHourlyRateCents({
      defaultRateCents: null,
      projectOverrideRateCents: null,
    });

    expect(rate).toBeNull();
  });

  it("computes billable amount in cents from minutes and hourly rate", () => {
    const amount = calculateEntryAmountCents({
      durationMinutes: 90,
      hourlyRateCents: 12_000,
      isBillable: true,
    });

    expect(amount).toBe(18_000);
  });

  it("returns zero for non-billable entries", () => {
    const amount = calculateEntryAmountCents({
      durationMinutes: 90,
      hourlyRateCents: 12_000,
      isBillable: false,
    });

    expect(amount).toBe(0);
  });
});
