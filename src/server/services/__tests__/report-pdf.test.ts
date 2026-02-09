import { describe, expect, it } from "bun:test";

import { buildReportPdf } from "../report-pdf";

describe("report pdf service", () => {
  it("returns PDF bytes with expected header", async () => {
    const bytes = await buildReportPdf({
      title: "Client Report",
      periodLabel: "2026-02-01 to 2026-02-07",
      generatedByName: "Alex",
      totalMinutes: 240,
      totalBillableAmountCents: 40_000,
      byProject: [
        {
          label: "Website Redesign",
          totalMinutes: 180,
          billableAmountCents: 30_000,
        },
      ],
      byMember: [
        {
          label: "Alex",
          totalMinutes: 180,
          billableAmountCents: 30_000,
        },
      ],
      byActivity: [
        {
          label: "Development",
          totalMinutes: 180,
          billableAmountCents: 30_000,
        },
      ],
    });

    expect(bytes.length).toBeGreaterThan(100);
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("%PDF");
  });
});
