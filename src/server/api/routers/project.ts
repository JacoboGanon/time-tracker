import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  assertCanManageMembership,
  assertCanManageProject,
  getProjectMembershipOrThrow,
} from "~/server/api/utils/project-access";

const projectRoleSchema = z.enum(["owner", "manager", "member", "viewer"]);

export const projectRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db.project.findMany({
      where: {
        members: {
          some: { userId: ctx.session.user.id },
        },
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
        members: {
          where: { userId: ctx.session.user.id },
          select: { role: true },
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
      const client = await ctx.db.client.findUnique({
        where: { id: input.clientId },
        select: { id: true },
      });

      if (!client) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Client not found" });
      }

      return ctx.db.$transaction(async (tx) => {
        const code = input.code?.trim();
        const description = input.description?.trim();

        const project = await tx.project.create({
          data: {
            clientId: input.clientId,
            name: input.name.trim(),
            code: code && code.length > 0 ? code : null,
            description:
              description && description.length > 0 ? description : null,
          },
        });

        await tx.projectMember.create({
          data: {
            projectId: project.id,
            userId: ctx.session.user.id,
            role: "owner",
          },
        });

        // Auto-add all client members to the new project
        const clientMembers = await tx.clientMember.findMany({
          where: {
            clientId: input.clientId,
            userId: { not: ctx.session.user.id },
          },
          select: { userId: true },
        });

        if (clientMembers.length > 0) {
          await tx.projectMember.createMany({
            data: clientMembers.map((cm) => ({
              projectId: project.id,
              userId: cm.userId,
              role: "member" as const,
            })),
            skipDuplicates: true,
          });
        }

        return project;
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
      const membership = await getProjectMembershipOrThrow(ctx, input.projectId);
      assertCanManageProject(membership.role);

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

  listMembers: protectedProcedure
    .input(z.object({ projectId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      await getProjectMembershipOrThrow(ctx, input.projectId);

      return ctx.db.projectMember.findMany({
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
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      });
    }),

  addMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        userId: z.string().min(1),
        role: projectRoleSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await getProjectMembershipOrThrow(ctx, input.projectId);
      assertCanManageMembership(membership.role);

      return ctx.db.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
        update: {
          role: input.role,
        },
        create: {
          projectId: input.projectId,
          userId: input.userId,
          role: input.role,
        },
      });
    }),

  updateMemberRole: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        userId: z.string().min(1),
        role: projectRoleSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await getProjectMembershipOrThrow(ctx, input.projectId);
      assertCanManageMembership(membership.role);

      return ctx.db.projectMember.update({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
        data: {
          role: input.role,
        },
      });
    }),
});
