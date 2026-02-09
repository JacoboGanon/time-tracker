import { redirect } from "next/navigation";

import { TimeTrackerDashboard } from "~/app/_components/dashboard";
import { getSession } from "~/server/better-auth/server";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/sign-in");
  }

  return (
    <HydrateClient>
      <TimeTrackerDashboard userName={session.user?.name ?? "User"} />
    </HydrateClient>
  );
}
