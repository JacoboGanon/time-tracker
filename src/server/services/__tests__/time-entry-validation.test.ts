import { describe, expect, it } from "bun:test";

import {
  ensureNoOverlaps,
  validateTimeEntryInput,
  type TimeRange,
} from "../time-entry-validation";

describe("time entry validation", () => {
  it("computes duration in minutes from start/end", () => {
    const result = validateTimeEntryInput({
      startAt: new Date("2026-02-01T10:00:00.000Z"),
      endAt: new Date("2026-02-01T11:30:00.000Z"),
    });

    expect(result.durationMinutes).toBe(90);
  });

  it("rejects entries where end is before or equal to start", () => {
    expect(() =>
      validateTimeEntryInput({
        startAt: new Date("2026-02-01T10:00:00.000Z"),
        endAt: new Date("2026-02-01T10:00:00.000Z"),
      }),
    ).toThrow("endAt must be after startAt");

    expect(() =>
      validateTimeEntryInput({
        startAt: new Date("2026-02-01T10:00:00.000Z"),
        endAt: new Date("2026-02-01T09:59:00.000Z"),
      }),
    ).toThrow("endAt must be after startAt");
  });

  it("rejects overlapping entries for the same user", () => {
    const existingRanges: TimeRange[] = [
      {
        startAt: new Date("2026-02-01T10:00:00.000Z"),
        endAt: new Date("2026-02-01T11:00:00.000Z"),
      },
    ];

    expect(() =>
      ensureNoOverlaps({
        candidate: {
          startAt: new Date("2026-02-01T10:30:00.000Z"),
          endAt: new Date("2026-02-01T11:30:00.000Z"),
        },
        existingRanges,
      }),
    ).toThrow("Time entry overlaps");
  });

  it("allows adjacent ranges with no overlap", () => {
    const existingRanges: TimeRange[] = [
      {
        startAt: new Date("2026-02-01T10:00:00.000Z"),
        endAt: new Date("2026-02-01T11:00:00.000Z"),
      },
    ];

    expect(() =>
      ensureNoOverlaps({
        candidate: {
          startAt: new Date("2026-02-01T11:00:00.000Z"),
          endAt: new Date("2026-02-01T12:00:00.000Z"),
        },
        existingRanges,
      }),
    ).not.toThrow();
  });
});
