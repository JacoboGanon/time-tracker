import { createAuthClient } from "better-auth/react";

const resolveBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const configured = process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000";
  return /^https?:\/\//.test(configured) ? configured : `http://${configured}`;
};

export const authClient = createAuthClient({
  baseURL: resolveBaseUrl(),
});

export type Session = typeof authClient.$Infer.Session;
