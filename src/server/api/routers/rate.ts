import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  assertCanManageProject,
  getProjectMembershipOrThrow,
} from "~/server/api/utils/project-access";

export const rateRouter = createTRPCRouter({
  getMyDefaultRate: protectedProcedure.query(({ ctx }) => {
    return ctx.db.rateCard.findUnique({
      where: { userId: ctx.session.user.id },
    });
  }),

  setMyDefaultRate: protectedProcedure
    .input(
      z.object({
        hourlyRateCents: z.number().int().min(0),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.rateCard.upsert({
        where: { userId: ctx.session.user.id },
        update: {
          hourlyRateCents: input.hourlyRateCents,
          currency: "USD",
        },
        create: {
          userId: ctx.session.user.id,
          hourlyRateCents: input.hourlyRateCents,
          currency: "USD",
        },
      });
    }),

  getProjectOverrides: protectedProcedure
    .input(z.object({ projectId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const membership = await getProjectMembershipOrThrow(ctx, input.projectId);
      assertCanManageProject(membership.role);

      return ctx.db.projectRateOverride.findMany({
        where: { projectId: input.projectId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  setProjectOverride: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        userId: z.string().min(1),
        hourlyRateCents: z.number().int().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await getProjectMembershipOrThrow(ctx, input.projectId);
      assertCanManageProject(membership.role);

      return ctx.db.projectRateOverride.upsert({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
        update: {
          hourlyRateCents: input.hourlyRateCents,
          currency: "USD",
        },
        create: {
          projectId: input.projectId,
          userId: input.userId,
          hourlyRateCents: input.hourlyRateCents,
          currency: "USD",
        },
      });
    }),

  removeProjectOverride: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        userId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await getProjectMembershipOrThrow(ctx, input.projectId);
      assertCanManageProject(membership.role);

      await ctx.db.projectRateOverride.delete({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
      });

      return { success: true };
    }),
});
