"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { FIELD } from "../workspace/ui";

// Passwordless sign-in: Supabase emails a one-time magic link back to
// /auth/callback. No passwords stored. We never reveal whether an email exists.
export function SignInForm({ linkError }: { linkError: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(
    linkError ? "That sign-in link expired or was already used. Enter your email for a fresh one." : null,
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setStatus("error");
      setMessage("Sign-in isn't configured in this environment.");
      return;
    }
    setStatus("sending");
    setMessage(null);
    const redirectTo = `${window.location.origin}/auth/callback?next=/workspace`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus("error");
      setMessage("Couldn't send the link. Check the address and try again.");
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-base font-semibold text-emerald-900">Check your email</p>
        <p className="mt-2 text-sm text-emerald-800">
          We sent a one-time sign-in link to <strong>{email.trim()}</strong>. It
          opens your workspace. No password to remember.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label htmlFor="signin-email" className="block text-sm font-medium text-slate-700">
        Work email
      </label>
      <input
        id="signin-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@yourpractice.com"
        className={FIELD}
      />
      {message && (
        <p className={`text-sm ${status === "error" ? "text-red-700" : "text-slate-600"}`}>
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "sending" || !email.trim()}
        className="w-full rounded-xl bg-blue-900 px-5 py-3 text-base font-semibold text-white transition hover:bg-blue-950 disabled:opacity-50"
      >
        {status === "sending" ? "Sending link…" : "Email me a sign-in link"}
      </button>
      <p className="text-xs text-slate-500">
        We&apos;ll email a secure link, no passwords needed. Saved demo reports
        are isolated to your account. Use only fictional or de-identified
        material during early access.
      </p>
    </form>
  );
}
