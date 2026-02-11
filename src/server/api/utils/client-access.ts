import { TRPCError } from "@trpc/server";

import { type createTRPCContext } from "~/server/api/trpc";

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

export const assertClientOwner = async (ctx: Context, clientId: string) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const client = await ctx.db.client.findUnique({
    where: { id: clientId },
    select: { id: true, createdById: true },
  });

  if (!client) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Client not found",
    });
  }

  if (client.createdById !== ctx.session.user.id) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only the client owner can perform this action",
    });
  }

  return client;
};
