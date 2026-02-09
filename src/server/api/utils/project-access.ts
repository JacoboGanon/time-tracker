import { TRPCError } from "@trpc/server";

import { type createTRPCContext } from "~/server/api/trpc";
import { canManageMembership, canManageProject } from "~/server/services/permissions";

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

export const getProjectMembershipOrThrow = async (
  ctx: Context,
  projectId: string,
) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const membership = await ctx.db.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: ctx.session.user.id,
      },
    },
    include: {
      project: {
        select: {
          id: true,
          clientId: true,
          name: true,
        },
      },
    },
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this project",
    });
  }

  return membership;
};

export const assertCanManageProject = (role: string) => {
  if (!canManageProject(role as Parameters<typeof canManageProject>[0])) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only owners and managers can manage this project",
    });
  }
};

export const assertCanManageMembership = (role: string) => {
  if (!canManageMembership(role as Parameters<typeof canManageMembership>[0])) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only owners can manage project members",
    });
  }
};
