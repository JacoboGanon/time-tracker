import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { render } from "@react-email/components";

import { env } from "~/env";
import { db } from "~/server/db";
import { sendEmail } from "~/server/email";
import VerifyEmail from "~/server/emails/verify-email";
import ResetPassword from "~/server/emails/reset-password";

const normalizeBaseUrl = (value: string): string =>
  /^https?:\/\//.test(value) ? value : `http://${value}`;

export const auth = betterAuth({
  baseURL: normalizeBaseUrl(env.BETTER_AUTH_URL),
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const html = await render(ResetPassword({ url }));
      void sendEmail({
        to: user.email,
        subject: "Reset your password",
        html,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const html = await render(VerifyEmail({ url }));
      void sendEmail({
        to: user.email,
        subject: "Verify your email address",
        html,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: env.BETTER_AUTH_GOOGLE_CLIENT_ID,
      clientSecret: env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
