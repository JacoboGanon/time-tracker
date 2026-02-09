"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "~/server/better-auth/client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setLoading(true);

    await authClient.signIn.email(
      { email, password, callbackURL: "/" },
      {
        onSuccess: () => {
          router.push("/");
        },
        onError: (ctx) => {
          if (ctx.error.status === 403) {
            setNeedsVerification(true);
            setError("Please verify your email address before signing in.");
          } else {
            setError(ctx.error.message || "Invalid email or password.");
          }
          setLoading(false);
        },
      },
    );
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  };

  const handleResendVerification = async () => {
    setResendingVerification(true);
    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: "/",
      });
      setVerificationSent(true);
    } catch {
      setError("Failed to resend verification email.");
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-950 px-4">
      {/* Background grid pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div
        className="relative w-full max-w-[400px]"
        style={{ animation: "auth-fade-in 0.6s ease-out both" }}
      >
        {/* Logo / Brand */}
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2">
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 rounded-full border-2 border-stone-700" />
              <div
                className="absolute left-1/2 top-1/2 h-3 w-0.5 origin-bottom -translate-x-1/2 -translate-y-full bg-amber-500"
                style={{ animation: "auth-tick 8s linear infinite" }}
              />
              <div className="absolute left-1/2 top-1/2 h-1.5 w-0.5 origin-bottom -translate-x-1/2 -translate-y-full bg-stone-400" />
              <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500" />
            </div>
            <span className="text-lg font-semibold tracking-[0.2em] text-stone-200 uppercase">
              Time Tracker
            </span>
          </div>
          <div
            className="mx-auto h-px w-12 origin-left bg-amber-500/40"
            style={{ animation: "auth-line-draw 0.8s ease-out 0.3s both" }}
          />
        </div>

        {/* Card */}
        <div className="rounded-lg border border-stone-800 bg-stone-900/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <h1 className="mb-1 text-xl font-medium tracking-tight text-stone-100">
            Sign in
          </h1>
          <p className="mb-6 text-sm text-stone-500">
            Enter your credentials to continue
          </p>

          {/* Divider line */}
          <div
            className="mb-6 h-px w-full origin-left bg-stone-800"
            style={{ animation: "auth-line-draw 0.6s ease-out 0.4s both" }}
          />

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded border border-red-500/20 bg-red-900/20 px-4 py-3 text-sm text-red-400">
              {error}
              {needsVerification && !verificationSent && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  className="mt-2 block text-amber-400 underline underline-offset-2 transition-colors hover:text-amber-300 disabled:opacity-50"
                >
                  {resendingVerification
                    ? "Sending..."
                    : "Resend verification email"}
                </button>
              )}
              {verificationSent && (
                <p className="mt-2 text-green-400">
                  Verification email sent. Check your inbox.
                </p>
              )}
            </div>
          )}

          {/* Email/Password form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium tracking-wider text-stone-400 uppercase"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded border border-stone-700 bg-stone-800/50 px-3 py-2.5 text-sm text-stone-100 outline-none transition-colors placeholder:text-stone-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium tracking-wider text-stone-400 uppercase"
                >
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-stone-500 transition-colors hover:text-amber-400"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded border border-stone-700 bg-stone-800/50 px-3 py-2.5 text-sm text-stone-100 outline-none transition-colors placeholder:text-stone-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative flex w-full items-center justify-center rounded bg-amber-500 px-4 py-2.5 text-sm font-semibold text-stone-950 transition-all hover:bg-amber-400 disabled:opacity-60"
            >
              {loading ? (
                <div
                  className="h-4 w-4 rounded-full border-2 border-stone-950/30 border-t-stone-950"
                  style={{ animation: "auth-spinner 0.6s linear infinite" }}
                />
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-800" />
            <span className="text-xs tracking-wider text-stone-600 uppercase">
              or
            </span>
            <div className="h-px flex-1 bg-stone-800" />
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded border border-stone-700 bg-stone-800/30 px-4 py-2.5 text-sm font-medium text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/60 hover:text-stone-100 disabled:opacity-60"
          >
            {googleLoading ? (
              <div
                className="h-4 w-4 rounded-full border-2 border-stone-500/30 border-t-stone-300"
                style={{ animation: "auth-spinner 0.6s linear infinite" }}
              />
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        {/* Footer link */}
        <p
          className="mt-6 text-center text-sm text-stone-500"
          style={{ animation: "auth-fade-in 0.6s ease-out 0.5s both" }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/sign-up"
            className="text-amber-500 transition-colors hover:text-amber-400"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
