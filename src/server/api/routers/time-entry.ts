import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  type createTRPCContext,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { getProjectMembershipOrThrow } from "~/server/api/utils/project-access";
import { canEditEntry } from "~/server/services/permissions";
import {
  ensureNoOverlaps,
  validateTimeEntryInput,
} from "~/server/services/time-entry-validation";

const listFiltersSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  projectId: z.string().min(1).optional(),
  memberId: z.string().min(1).optional(),
  activityTypeId: z.string().min(1).optional(),
  clientId: z.string().min(1).optional(),
});

const manualEntrySchema = z.object({
  projectId: z.string().min(1),
  activityTypeId: z.string().min(1),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  description: z.string().min(1).max(2_000),
  isBillable: z.boolean().optional(),
});

const stopwatchEntrySchema = z.object({
  projectId: z.string().min(1),
  activityTypeId: z.string().min(1),
  startedAt: z.coerce.date(),
  stoppedAt: z.coerce.date(),
  description: z.string().min(1).max(2_000),
  isBillable: z.boolean().optional(),
});

const updateEntrySchema = z
  .object({
    entryId: z.string().min(1),
    startAt: z.coerce.date().optional(),
    endAt: z.coerce.date().optional(),
    activityTypeId: z.string().min(1).optional(),
    description: z.string().min(1).max(2_000).optional(),
    isBillable: z.boolean().optional(),
  })
  .refine(
    (input) =>
      input.startAt !== undefined ||
      input.endAt !== undefined ||
      input.activityTypeId !== undefined ||
      input.description !== undefined ||
      input.isBillable !== undefined,
    { message: "At least one field must be updated" },
  );

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const loadUserAccessibleProjectIds = async (params: {
  ctx: Context;
  userId: string;
}) => {
  const memberships = await params.ctx.db.projectMember.findMany({
    where: { userId: params.userId },
    select: { projectId: true },
  });

  return memberships.map((membership) => membership.projectId);
};

const assertCanCreateEntry = (role: string) => {
  if (role === "viewer") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Viewers cannot create time entries",
    });
  }
};

const checkOverlapForUser = async (params: {
  ctx: Context;
  userId: string;
  startAt: Date;
  endAt: Date;
  excludeEntryId?: string;
}) => {
  const existingRanges = await params.ctx.db.timeEntry.findMany({
    where: {
      userId: params.userId,
      ...(params.excludeEntryId ? { id: { not: params.excludeEntryId } } : {}),
      startAt: { lt: params.endAt },
      endAt: { gt: params.startAt },
    },
    select: {
      startAt: true,
      endAt: true,
    },
  });

  ensureNoOverlaps({
    candidate: {
      startAt: params.startAt,
      endAt: params.endAt,
    },
    existingRanges,
  });
};

const serializeAuditValue = (value: Date | string | number | boolean | null) => {
  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
};

const buildAuditRecords = (params: {
  before: {
    startAt: Date;
    endAt: Date;
    durationMinutes: number;
    activityTypeId: string;
    description: string;
    isBillable: boolean;
  };
  after: {
    startAt: Date;
    endAt: Date;
    durationMinutes: number;
    activityTypeId: string;
    description: string;
    isBillable: boolean;
  };
  timeEntryId: string;
  changedById: string;
}) => {
  const fields: Array<keyof typeof params.before> = [
    "startAt",
    "endAt",
    "durationMinutes",
    "activityTypeId",
    "description",
    "isBillable",
  ];

  return fields
    .filter(
      (field) =>
        serializeAuditValue(params.before[field]) !==
        serializeAuditValue(params.after[field]),
    )
    .map((field) => ({
      timeEntryId: params.timeEntryId,
      changedById: params.changedById,
      field,
      previousValue: serializeAuditValue(params.before[field]),
      newValue: serializeAuditValue(params.after[field]),
    }));
};

export const timeEntryRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listFiltersSchema.optional())
    .query(async ({ ctx, input }) => {
      const projectIds = await loadUserAccessibleProjectIds({
        ctx,
        userId: ctx.session.user.id,
      });

      if (projectIds.length === 0) {
        return [];
      }

      const projectFilterIds = input?.projectId ? [input.projectId] : projectIds;

      return ctx.db.timeEntry.findMany({
        where: {
          projectId: {
            in: projectFilterIds.filter((projectId) => projectIds.includes(projectId)),
          },
          startAt: input?.startDate ? { gte: input.startDate } : undefined,
          endAt: input?.endDate ? { lte: input.endDate } : undefined,
          userId: input?.memberId,
          activityTypeId: input?.activityTypeId,
          clientId: input?.clientId,
        },
        include: {
          project: {
            select: { id: true, name: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
          activityType: {
            select: { id: true, name: true },
          },
        },
        orderBy: [{ startAt: "desc" }, { createdAt: "desc" }],
        take: 300,
      });
    }),

  createManual: protectedProcedure
    .input(manualEntrySchema)
    .mutation(async ({ ctx, input }) => {
      const membership = await getProjectMembershipOrThrow(ctx, input.projectId);
      assertCanCreateEntry(membership.role);

      const { durationMinutes } = validateTimeEntryInput({
        startAt: input.startAt,
        endAt: input.endAt,
      });
      await checkOverlapForUser({
        ctx,
        userId: ctx.session.user.id,
        startAt: input.startAt,
        endAt: input.endAt,
      });

      const activityType = await ctx.db.activityType.findUnique({
        where: { id: input.activityTypeId },
        select: { id: true, isBillableDefault: true },
      });

      if (!activityType) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity type not found",
        });
      }

      return ctx.db.timeEntry.create({
        data: {
          userId: ctx.session.user.id,
          clientId: membership.project.clientId,
          projectId: input.projectId,
          activityTypeId: input.activityTypeId,
          source: "manual",
          startAt: input.startAt,
          endAt: input.endAt,
          durationMinutes,
          description: input.description.trim(),
          isBillable: input.isBillable ?? activityType.isBillableDefault,
        },
      });
    }),

  createFromStopwatch: protectedProcedure
    .input(stopwatchEntrySchema)
    .mutation(async ({ ctx, input }) => {
      const membership = await getProjectMembershipOrThrow(ctx, input.projectId);
      assertCanCreateEntry(membership.role);

      const { durationMinutes } = validateTimeEntryInput({
        startAt: input.startedAt,
        endAt: input.stoppedAt,
      });
      await checkOverlapForUser({
        ctx,
        userId: ctx.session.user.id,
        startAt: input.startedAt,
        endAt: input.stoppedAt,
      });

      const activityType = await ctx.db.activityType.findUnique({
        where: { id: input.activityTypeId },
        select: { id: true, isBillableDefault: true },
      });

      if (!activityType) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity type not found",
        });
      }

      return ctx.db.timeEntry.create({
        data: {
          userId: ctx.session.user.id,
          clientId: membership.project.clientId,
          projectId: input.projectId,
          activityTypeId: input.activityTypeId,
          source: "stopwatch",
          startAt: input.startedAt,
          endAt: input.stoppedAt,
          durationMinutes,
          description: input.description.trim(),
          isBillable: input.isBillable ?? activityType.isBillableDefault,
        },
      });
    }),

  update: protectedProcedure
    .input(updateEntrySchema)
    .mutation(async ({ ctx, input }) => {
      const existingEntry = await ctx.db.timeEntry.findUnique({
        where: { id: input.entryId },
      });

      if (!existingEntry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" });
      }

      const membership = await getProjectMembershipOrThrow(ctx, existingEntry.projectId);
      const allowedToEdit = canEditEntry({
        role: membership.role,
        requesterId: ctx.session.user.id,
        entryUserId: existingEntry.userId,
      });

      if (!allowedToEdit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot edit this entry",
        });
      }

      const nextStartAt = input.startAt ?? existingEntry.startAt;
      const nextEndAt = input.endAt ?? existingEntry.endAt;
      const { durationMinutes } = validateTimeEntryInput({
        startAt: nextStartAt,
        endAt: nextEndAt,
      });

      if (input.activityTypeId) {
        const activityType = await ctx.db.activityType.findUnique({
          where: { id: input.activityTypeId },
          select: { id: true },
        });

        if (!activityType) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Activity type not found",
          });
        }
      }

      await checkOverlapForUser({
        ctx,
        userId: existingEntry.userId,
        startAt: nextStartAt,
        endAt: nextEndAt,
        excludeEntryId: existingEntry.id,
      });

      const updatedValues = {
        startAt: nextStartAt,
        endAt: nextEndAt,
        durationMinutes,
        activityTypeId: input.activityTypeId ?? existingEntry.activityTypeId,
        description: input.description?.trim() ?? existingEntry.description,
        isBillable: input.isBillable ?? existingEntry.isBillable,
      };

      const audits = buildAuditRecords({
        before: {
          startAt: existingEntry.startAt,
          endAt: existingEntry.endAt,
          durationMinutes: existingEntry.durationMinutes,
          activityTypeId: existingEntry.activityTypeId,
          description: existingEntry.description,
          isBillable: existingEntry.isBillable,
        },
        after: updatedValues,
        timeEntryId: existingEntry.id,
        changedById: ctx.session.user.id,
      });

      return ctx.db.$transaction(async (tx) => {
        const entry = await tx.timeEntry.update({
          where: { id: existingEntry.id },
          data: updatedValues,
        });

        if (audits.length > 0) {
          await tx.timeEntryAudit.createMany({
            data: audits,
          });
        }

        return entry;
      });
    }),

  delete: protectedProcedure
    .input(z.object({ entryId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existingEntry = await ctx.db.timeEntry.findUnique({
        where: { id: input.entryId },
      });

      if (!existingEntry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" });
      }

      const membership = await getProjectMembershipOrThrow(ctx, existingEntry.projectId);
      const allowedToEdit = canEditEntry({
        role: membership.role,
        requesterId: ctx.session.user.id,
        entryUserId: existingEntry.userId,
      });

      if (!allowedToEdit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot delete this entry",
        });
      }

      await ctx.db.timeEntry.delete({
        where: { id: existingEntry.id },
      });

      return { success: true };
    }),

  listAudits: protectedProcedure
    .input(z.object({ entryId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const entry = await ctx.db.timeEntry.findUnique({
        where: { id: input.entryId },
        select: {
          id: true,
          projectId: true,
        },
      });

      if (!entry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" });
      }

      await getProjectMembershipOrThrow(ctx, entry.projectId);

      return ctx.db.timeEntryAudit.findMany({
        where: { timeEntryId: input.entryId },
        include: {
          changedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { changedAt: "desc" },
      });
    }),

  totalsByProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await getProjectMembershipOrThrow(ctx, input.projectId);

      const entries = await ctx.db.timeEntry.findMany({
        where: {
          projectId: input.projectId,
          startAt: { gte: input.startDate },
          endAt: { lte: input.endDate },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      const totals = new Map<
        string,
        { userId: string; userName: string; totalMinutes: number }
      >();

      for (const entry of entries) {
        const current = totals.get(entry.userId) ?? {
          userId: entry.userId,
          userName: entry.user.name,
          totalMinutes: 0,
        };
        current.totalMinutes += entry.durationMinutes;
        totals.set(entry.userId, current);
      }

      return Array.from(totals.values()).sort(
        (a, b) => b.totalMinutes - a.totalMinutes,
      );
    }),
});
