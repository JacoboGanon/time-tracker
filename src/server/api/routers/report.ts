import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  type createTRPCContext,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { buildReportPdf } from "~/server/services/report-pdf";
import { buildReportSummary } from "~/server/services/reporting";
import { resolveHourlyRateCents } from "~/server/services/rates";

const reportFiltersSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  clientId: z.string().min(1).optional(),
  projectId: z.string().min(1).optional(),
  memberId: z.string().min(1).optional(),
  activityTypeId: z.string().min(1).optional(),
});

const exportReportSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  filters: reportFiltersSchema,
});

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const getAccessibleProjectIds = async (ctx: Context, userId: string) => {
  const memberships = await ctx.db.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });

  return memberships.map((membership) => membership.projectId);
};

const buildSummaryFromFilters = async (params: {
  ctx: Context;
  userId: string;
  filters: z.infer<typeof reportFiltersSchema>;
}) => {
  const projectIds = await getAccessibleProjectIds(params.ctx, params.userId);
  if (projectIds.length === 0) {
    return {
      summary: buildReportSummary({ entries: [] }),
      entryCount: 0,
    };
  }

  if (params.filters.projectId && !projectIds.includes(params.filters.projectId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this project",
    });
  }

  const allowedProjectIds = params.filters.projectId
    ? [params.filters.projectId]
    : projectIds;

  const entries = await params.ctx.db.timeEntry.findMany({
    where: {
      projectId: { in: allowedProjectIds },
      startAt: { gte: params.filters.startDate },
      endAt: { lte: params.filters.endDate },
      clientId: params.filters.clientId,
      userId: params.filters.memberId,
      activityTypeId: params.filters.activityTypeId,
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
      user: {
        select: { id: true, name: true },
      },
      activityType: {
        select: { id: true, name: true },
      },
    },
  });

  if (entries.length === 0) {
    return {
      summary: buildReportSummary({ entries: [] }),
      entryCount: 0,
    };
  }

  const userIds = Array.from(new Set(entries.map((entry) => entry.userId)));
  const usedProjectIds = Array.from(new Set(entries.map((entry) => entry.projectId)));

  const [rateCards, overrides] = await Promise.all([
    params.ctx.db.rateCard.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, hourlyRateCents: true },
    }),
    params.ctx.db.projectRateOverride.findMany({
      where: {
        userId: { in: userIds },
        projectId: { in: usedProjectIds },
      },
      select: {
        userId: true,
        projectId: true,
        hourlyRateCents: true,
      },
    }),
  ]);

  const defaultRateByUserId = new Map(
    rateCards.map((rateCard) => [rateCard.userId, rateCard.hourlyRateCents]),
  );
  const overrideRateByProjectUser = new Map(
    overrides.map((override) => [
      `${override.projectId}:${override.userId}`,
      override.hourlyRateCents,
    ]),
  );

  const summary = buildReportSummary({
    entries: entries.map((entry) => ({
      id: entry.id,
      projectId: entry.projectId,
      projectName: entry.project.name,
      userId: entry.userId,
      userName: entry.user.name,
      activityTypeId: entry.activityTypeId,
      activityTypeName: entry.activityType.name,
      durationMinutes: entry.durationMinutes,
      isBillable: entry.isBillable,
      hourlyRateCents: resolveHourlyRateCents({
        defaultRateCents: defaultRateByUserId.get(entry.userId) ?? null,
        projectOverrideRateCents:
          overrideRateByProjectUser.get(`${entry.projectId}:${entry.userId}`) ??
          null,
      }),
    })),
  });

  return {
    summary,
    entryCount: entries.length,
  };
};

const toPeriodLabel = (filters: z.infer<typeof reportFiltersSchema>) =>
  `${filters.startDate.toISOString().slice(0, 10)} to ${filters.endDate.toISOString().slice(0, 10)}`;

const money = (amountCents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amountCents / 100,
  );

export const reportRouter = createTRPCRouter({
  summary: protectedProcedure
    .input(reportFiltersSchema)
    .query(async ({ ctx, input }) => {
      return buildSummaryFromFilters({
        ctx,
        userId: ctx.session.user.id,
        filters: input,
      });
    }),

  generate: protectedProcedure
    .input(reportFiltersSchema)
    .mutation(async ({ ctx, input }) => {
      const { summary, entryCount } = await buildSummaryFromFilters({
        ctx,
        userId: ctx.session.user.id,
        filters: input,
      });

      const report = await ctx.db.report.create({
        data: {
          clientId: input.clientId ?? null,
          projectId: input.projectId ?? null,
          generatedById: ctx.session.user.id,
          startDate: input.startDate,
          endDate: input.endDate,
          filters: {
            ...input,
            startDate: input.startDate.toISOString(),
            endDate: input.endDate.toISOString(),
          },
          snapshots: {
            create: {
              summary,
            },
          },
        },
      });

      return {
        reportId: report.id,
        entryCount,
        summary,
      };
    }),

  exportPdf: protectedProcedure
    .input(exportReportSchema)
    .query(async ({ ctx, input }) => {
      const { summary } = await buildSummaryFromFilters({
        ctx,
        userId: ctx.session.user.id,
        filters: input.filters,
      });

      const title = input.title ?? "Time Tracker Report";
      const bytes = await buildReportPdf({
        title,
        periodLabel: toPeriodLabel(input.filters),
        generatedByName: ctx.session.user.name,
        totalMinutes: summary.totalMinutes,
        totalBillableAmountCents: summary.totalBillableAmountCents,
        byProject: summary.byProject.map((item) => ({
          label: item.projectName,
          totalMinutes: item.totalMinutes,
          billableAmountCents: item.billableAmountCents,
        })),
        byMember: summary.byMember.map((item) => ({
          label: item.userName,
          totalMinutes: item.totalMinutes,
          billableAmountCents: item.billableAmountCents,
        })),
        byActivity: summary.byActivity.map((item) => ({
          label: item.activityTypeName,
          totalMinutes: item.totalMinutes,
          billableAmountCents: item.billableAmountCents,
        })),
      });

      const reportDate = new Date().toISOString().slice(0, 10);
      return {
        fileName: `time-report-${reportDate}.pdf`,
        base64: Buffer.from(bytes).toString("base64"),
        meta: {
          total: money(summary.totalBillableAmountCents),
          totalMinutes: summary.totalMinutes,
        },
      };
    }),

  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db.report.findMany({
      where: {
        generatedById: ctx.session.user.id,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
        project: {
          select: { id: true, name: true },
        },
        snapshots: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),
});
