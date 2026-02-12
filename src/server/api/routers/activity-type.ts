import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const activityTypeRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db.activityType.findMany({
      orderBy: { name: "asc" },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(80),
        isBillableDefault: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.activityType.create({
        data: {
          name: input.name.trim(),
          isBillableDefault: input.isBillableDefault ?? true,
          createdById: ctx.session.user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        activityTypeId: z.string().min(1),
        name: z.string().min(1).max(80).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const activityType = await ctx.db.activityType.findUnique({
        where: { id: input.activityTypeId },
      });

      if (!activityType) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity type not found",
        });
      }

      return ctx.db.activityType.update({
        where: { id: input.activityTypeId },
        data: {
          ...(input.name ? { name: input.name.trim() } : {}),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ activityTypeId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const activityType = await ctx.db.activityType.findUnique({
        where: { id: input.activityTypeId },
        include: { _count: { select: { timeEntries: true } } },
      });

      if (!activityType) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity type not found",
        });
      }

      if (activityType._count.timeEntries > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete: ${activityType._count.timeEntries} time ${activityType._count.timeEntries === 1 ? "entry uses" : "entries use"} this activity type`,
        });
      }

      await ctx.db.activityType.delete({
        where: { id: input.activityTypeId },
      });

      return { success: true };
    }),
});
