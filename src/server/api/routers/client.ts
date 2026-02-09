import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const clientRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db.client.findMany({
      orderBy: { name: "asc" },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(120),
        description: z.string().max(500).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const description = input.description?.trim();

      return ctx.db.client.create({
        data: {
          name: input.name.trim(),
          description: description && description.length > 0 ? description : null,
          isActive: input.isActive ?? true,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        clientId: z.string().min(1),
        name: z.string().min(1).max(120).optional(),
        description: z.string().max(500).optional().nullable(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.client.update({
        where: { id: input.clientId },
        data: {
          name: input.name?.trim(),
          description:
            input.description === undefined
              ? undefined
              : (input.description?.trim() ?? null),
          isActive: input.isActive,
        },
      });
    }),
});
