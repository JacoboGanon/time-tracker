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
});
