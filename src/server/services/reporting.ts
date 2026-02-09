import { calculateEntryAmountCents } from "~/server/services/rates";

export type ReportableEntry = {
  id: string;
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  activityTypeId: string;
  activityTypeName: string;
  durationMinutes: number;
  isBillable: boolean;
  hourlyRateCents: number | null;
};

type BuildSummaryInput = {
  entries: ReportableEntry[];
};

type TotalsItem = {
  key: string;
  label: string;
  totalMinutes: number;
  billableAmountCents: number;
};

type GroupedTotal = {
  totalMinutes: number;
  billableAmountCents: number;
};

const toSortedArray = <T extends { totalMinutes: number; [key: string]: unknown }>(
  entries: T[],
  tieBreakerKey: keyof T,
): T[] =>
  [...entries].sort((a, b) => {
    if (b.totalMinutes !== a.totalMinutes) {
      return b.totalMinutes - a.totalMinutes;
    }

    return String(a[tieBreakerKey]).localeCompare(String(b[tieBreakerKey]));
  });

const addToBucket = (
  bucket: Map<string, GroupedTotal>,
  key: string,
  minutes: number,
  billableAmountCents: number,
) => {
  const current = bucket.get(key) ?? { totalMinutes: 0, billableAmountCents: 0 };
  current.totalMinutes += minutes;
  current.billableAmountCents += billableAmountCents;
  bucket.set(key, current);
};

export const buildReportSummary = ({ entries }: BuildSummaryInput) => {
  const byProjectBucket = new Map<string, GroupedTotal>();
  const byMemberBucket = new Map<string, GroupedTotal>();
  const byActivityBucket = new Map<string, GroupedTotal>();
  const projectLabels = new Map<string, string>();
  const userLabels = new Map<string, string>();
  const activityLabels = new Map<string, string>();

  let totalMinutes = 0;
  let totalBillableAmountCents = 0;

  for (const entry of entries) {
    const entryAmount = calculateEntryAmountCents({
      durationMinutes: entry.durationMinutes,
      hourlyRateCents: entry.hourlyRateCents ?? 0,
      isBillable: entry.isBillable && entry.hourlyRateCents !== null,
    });

    totalMinutes += entry.durationMinutes;
    totalBillableAmountCents += entryAmount;

    projectLabels.set(entry.projectId, entry.projectName);
    userLabels.set(entry.userId, entry.userName);
    activityLabels.set(entry.activityTypeId, entry.activityTypeName);

    addToBucket(
      byProjectBucket,
      entry.projectId,
      entry.durationMinutes,
      entryAmount,
    );
    addToBucket(byMemberBucket, entry.userId, entry.durationMinutes, entryAmount);
    addToBucket(
      byActivityBucket,
      entry.activityTypeId,
      entry.durationMinutes,
      entryAmount,
    );
  }

  const byProject = toSortedArray(
    Array.from(byProjectBucket.entries()).map(([projectId, totals]) => ({
      projectId,
      projectName: projectLabels.get(projectId) ?? "Unknown",
      totalMinutes: totals.totalMinutes,
      billableAmountCents: totals.billableAmountCents,
    })),
    "projectName",
  );

  const byMember = toSortedArray(
    Array.from(byMemberBucket.entries()).map(([userId, totals]) => ({
      userId,
      userName: userLabels.get(userId) ?? "Unknown",
      totalMinutes: totals.totalMinutes,
      billableAmountCents: totals.billableAmountCents,
    })),
    "userName",
  );

  const byActivity = toSortedArray(
    Array.from(byActivityBucket.entries()).map(([activityTypeId, totals]) => ({
      activityTypeId,
      activityTypeName: activityLabels.get(activityTypeId) ?? "Unknown",
      totalMinutes: totals.totalMinutes,
      billableAmountCents: totals.billableAmountCents,
    })),
    "activityTypeName",
  );

  return {
    totalMinutes,
    totalBillableAmountCents,
    byProject,
    byMember,
    byActivity,
  };
};

export type ReportSummary = ReturnType<typeof buildReportSummary>;

export const summarySectionToRows = (
  items: TotalsItem[],
): Array<{ label: string; totalMinutes: number; billableAmountCents: number }> =>
  items.map((item) => ({
    label: item.label,
    totalMinutes: item.totalMinutes,
    billableAmountCents: item.billableAmountCents,
  }));
