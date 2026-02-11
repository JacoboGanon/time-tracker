import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { assertClientOwner } from "~/server/api/utils/client-access";

export const clientRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db.client.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { members: true, projects: true } },
      },
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

      return ctx.db.$transaction(async (tx) => {
        const client = await tx.client.create({
          data: {
            name: input.name.trim(),
            description:
              description && description.length > 0 ? description : null,
            isActive: input.isActive ?? true,
            createdById: ctx.session.user.id,
          },
        });

        await tx.clientMember.create({
          data: {
            clientId: client.id,
            userId: ctx.session.user.id,
          },
        });

        return client;
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
    .mutation(async ({ ctx, input }) => {
      await assertClientOwner(ctx, input.clientId);

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

  listMembers: protectedProcedure
    .input(z.object({ clientId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      await assertClientOwner(ctx, input.clientId);

      return ctx.db.clientMember.findMany({
        where: { clientId: input.clientId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  addMember: protectedProcedure
    .input(
      z.object({
        clientId: z.string().min(1),
        userId: z.string().min(1),
        hourlyRateCents: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertClientOwner(ctx, input.clientId);

      return ctx.db.$transaction(async (tx) => {
        const member = await tx.clientMember.upsert({
          where: {
            clientId_userId: {
              clientId: input.clientId,
              userId: input.userId,
            },
          },
          update: {},
          create: {
            clientId: input.clientId,
            userId: input.userId,
            hourlyRateCents: input.hourlyRateCents ?? null,
          },
        });

        // Auto-add to all projects under this client
        const projects = await tx.project.findMany({
          where: { clientId: input.clientId },
          select: { id: true },
        });

        if (projects.length > 0) {
          await tx.projectMember.createMany({
            data: projects.map((project) => ({
              projectId: project.id,
              userId: input.userId,
              role: "member" as const,
            })),
            skipDuplicates: true,
          });
        }

        return member;
      });
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        clientId: z.string().min(1),
        userId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertClientOwner(ctx, input.clientId);

      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot remove yourself from your own client",
        });
      }

      return ctx.db.clientMember.delete({
        where: {
          clientId_userId: {
            clientId: input.clientId,
            userId: input.userId,
          },
        },
      });
    }),

  setMemberRate: protectedProcedure
    .input(
      z.object({
        clientId: z.string().min(1),
        userId: z.string().min(1),
        hourlyRateCents: z.number().int().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertClientOwner(ctx, input.clientId);

      return ctx.db.clientMember.update({
        where: {
          clientId_userId: {
            clientId: input.clientId,
            userId: input.userId,
          },
        },
        data: { hourlyRateCents: input.hourlyRateCents },
      });
    }),

  listAllUsers: protectedProcedure.query(async ({ ctx }) => {
    // Only client owners need this (for adding members) — restrict access
    const ownedClient = await ctx.db.client.findFirst({
      where: { createdById: ctx.session.user.id },
      select: { id: true },
    });

    if (!ownedClient) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only client owners can list all users",
      });
    }

    return ctx.db.user.findMany({
      where: { emailVerified: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
  }),
});
