import { activityTypeRouter } from "~/server/api/routers/activity-type";
import { clientRouter } from "~/server/api/routers/client";
import { projectRouter } from "~/server/api/routers/project";
import { rateRouter } from "~/server/api/routers/rate";
import { reportRouter } from "~/server/api/routers/report";
import { timeEntryRouter } from "~/server/api/routers/time-entry";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  activityType: activityTypeRouter,
  clients: clientRouter,
  project: projectRouter,
  rate: rateRouter,
  report: reportRouter,
  timeEntry: timeEntryRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.clients.list();
 *       ^? Client[]
 */
export const createCaller = createCallerFactory(appRouter);
