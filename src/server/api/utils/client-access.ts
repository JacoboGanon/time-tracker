import { TRPCError } from "@trpc/server";

import { type createTRPCContext } from "~/server/api/trpc";

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

export const getClientMembershipOrThrow = async (
  ctx: Context,
  clientId: string,
) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const membership = await ctx.db.clientMember.findUnique({
    where: {
      clientId_userId: {
        clientId,
        userId: ctx.session.user.id,
      },
    },
    include: {
      client: {
        select: { id: true, name: true },
      },
    },
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this client",
    });
  }

  return membership;
};

export const getClientMembershipForProject = async (
  ctx: Context,
  projectId: string,
) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const project = await ctx.db.project.findUnique({
    where: { id: projectId },
    select: { id: true, clientId: true, name: true },
  });

  if (!project) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Project not found",
    });
  }

  const membership = await ctx.db.clientMember.findUnique({
    where: {
      clientId_userId: {
        clientId: project.clientId,
        userId: ctx.session.user.id,
      },
    },
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this project",
    });
  }

  return { ...membership, project };
};

export const assertClientOwner = async (ctx: Context, clientId: string) => {
  const membership = await getClientMembershipOrThrow(ctx, clientId);

  if (membership.role !== "owner") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only client owners can perform this action",
    });
  }

  return membership;
};
