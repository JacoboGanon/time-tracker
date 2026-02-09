"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "~/server/better-auth/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: "/auth/reset-password",
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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
          {submitted ? (
            <>
              {/* Success state */}
              <div className="mb-5 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-stone-700 bg-stone-800/50">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className="h-6 w-6 text-amber-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="mb-1 text-center text-xl font-medium tracking-tight text-stone-100">
                Check your email
              </h1>
              <p className="mb-6 text-center text-sm text-stone-500">
                If an account exists for{" "}
                <span className="text-stone-300">{email}</span>, we sent a
                password reset link.
              </p>
              <Link
                href="/auth/sign-in"
                className="flex w-full items-center justify-center rounded border border-stone-700 bg-stone-800/30 px-4 py-2.5 text-sm font-medium text-stone-300 transition-all hover:border-stone-600 hover:bg-stone-800/60 hover:text-stone-100"
              >
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h1 className="mb-1 text-xl font-medium tracking-tight text-stone-100">
                Reset password
              </h1>
              <p className="mb-6 text-sm text-stone-500">
                Enter your email and we&apos;ll send you a reset link
              </p>

              <div
                className="mb-6 h-px w-full origin-left bg-stone-800"
                style={{
                  animation: "auth-line-draw 0.6s ease-out 0.4s both",
                }}
              />

              {error && (
                <div className="mb-4 rounded border border-red-500/20 bg-red-900/20 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="relative flex w-full items-center justify-center rounded bg-amber-500 px-4 py-2.5 text-sm font-semibold text-stone-950 transition-all hover:bg-amber-400 disabled:opacity-60"
                >
                  {loading ? (
                    <div
                      className="h-4 w-4 rounded-full border-2 border-stone-950/30 border-t-stone-950"
                      style={{
                        animation: "auth-spinner 0.6s linear infinite",
                      }}
                    />
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {!submitted && (
          <p
            className="mt-6 text-center text-sm text-stone-500"
            style={{ animation: "auth-fade-in 0.6s ease-out 0.5s both" }}
          >
            Remember your password?{" "}
            <Link
              href="/auth/sign-in"
              className="text-amber-500 transition-colors hover:text-amber-400"
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
