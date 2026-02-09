import { describe, expect, it } from "bun:test";

import { buildReportSummary } from "../reporting";

describe("reporting service", () => {
  it("builds deterministic totals by project/member/activity", () => {
    const summary = buildReportSummary({
      entries: [
        {
          id: "e-1",
          projectId: "p-1",
          projectName: "Website Redesign",
          userId: "u-1",
          userName: "Alex",
          activityTypeId: "a-1",
          activityTypeName: "Development",
          durationMinutes: 120,
          isBillable: true,
          hourlyRateCents: 10_000,
        },
        {
          id: "e-2",
          projectId: "p-1",
          projectName: "Website Redesign",
          userId: "u-1",
          userName: "Alex",
          activityTypeId: "a-2",
          activityTypeName: "Meetings",
          durationMinutes: 60,
          isBillable: true,
          hourlyRateCents: 10_000,
        },
        {
          id: "e-3",
          projectId: "p-2",
          projectName: "Mobile App",
          userId: "u-2",
          userName: "Sam",
          activityTypeId: "a-1",
          activityTypeName: "Development",
          durationMinutes: 30,
          isBillable: false,
          hourlyRateCents: 9_000,
        },
      ],
    });

    expect(summary.totalMinutes).toBe(210);
    expect(summary.totalBillableAmountCents).toBe(30_000);

    expect(summary.byProject).toEqual([
      {
        projectId: "p-1",
        projectName: "Website Redesign",
        totalMinutes: 180,
        billableAmountCents: 30_000,
      },
      {
        projectId: "p-2",
        projectName: "Mobile App",
        totalMinutes: 30,
        billableAmountCents: 0,
      },
    ]);

    expect(summary.byMember).toEqual([
      {
        userId: "u-1",
        userName: "Alex",
        totalMinutes: 180,
        billableAmountCents: 30_000,
      },
      {
        userId: "u-2",
        userName: "Sam",
        totalMinutes: 30,
        billableAmountCents: 0,
      },
    ]);

    expect(summary.byActivity).toEqual([
      {
        activityTypeId: "a-1",
        activityTypeName: "Development",
        totalMinutes: 150,
        billableAmountCents: 20_000,
      },
      {
        activityTypeId: "a-2",
        activityTypeName: "Meetings",
        totalMinutes: 60,
        billableAmountCents: 10_000,
      },
    ]);
  });
});
