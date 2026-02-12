import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  assertClientOwner,
  getClientMembershipForProject,
} from "~/server/api/utils/client-access";

export const projectRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const clientIds = (
      await ctx.db.clientMember.findMany({
        where: { userId: ctx.session.user.id },
        select: { clientId: true, role: true },
      })
    ).map((m) => m.clientId);

    if (clientIds.length === 0) {
      return [];
    }

    return ctx.db.project.findMany({
      where: {
        clientId: { in: clientIds },
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.string().min(1),
        name: z.string().min(1).max(120),
        code: z.string().max(40).optional(),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertClientOwner(ctx, input.clientId);

      const code = input.code?.trim();
      const description = input.description?.trim();

      return ctx.db.project.create({
        data: {
          clientId: input.clientId,
          name: input.name.trim(),
          code: code && code.length > 0 ? code : null,
          description:
            description && description.length > 0 ? description : null,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        name: z.string().min(1).max(120).optional(),
        code: z.string().max(40).optional().nullable(),
        description: z.string().max(500).optional().nullable(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await getClientMembershipForProject(ctx, input.projectId);

      if (membership.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only client owners can manage projects",
        });
      }

      return ctx.db.project.update({
        where: { id: input.projectId },
        data: {
          name: input.name?.trim(),
          code: input.code === undefined ? undefined : (input.code?.trim() ?? null),
          description:
            input.description === undefined
              ? undefined
              : (input.description?.trim() ?? null),
          isActive: input.isActive,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ projectId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const membership = await getClientMembershipForProject(
        ctx,
        input.projectId,
      );

      if (membership.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only client owners can delete projects",
        });
      }

      await ctx.db.project.delete({
        where: { id: input.projectId },
      });

      return { success: true };
    }),
});
