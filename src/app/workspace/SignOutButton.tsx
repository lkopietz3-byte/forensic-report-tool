"use client";

import { useId, useRef, useState } from "react";

export function SignOutButton({
  onSignedOut = () => window.location.assign("/workspace"),
}: { onSignedOut?: () => void }) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);
  const errorId = useId();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setFailed(false);
    try {
      const response = await fetch("/auth/signout", {
        method: "POST",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok || (await response.json()).signedOut !== true) {
        throw new Error("Sign-out unconfirmed");
      }
      onSignedOut();
    } catch {
      // Leave the report and unsaved inputs mounted. A timeout can mean the
      // server completed sign-out, so describe uncertainty rather than state.
      setFailed(true);
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <form action="/auth/signout" method="post" onSubmit={submit} className="relative shrink-0">
      <button
        type="submit"
        disabled={pending}
        aria-describedby={failed ? errorId : undefined}
        className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
      >
        {pending ? "Signing out…" : failed ? "Try sign out again" : "Sign out"}
      </button>
      {failed && (
        <p id={errorId} role="alert" className="absolute right-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-3rem)] rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 shadow-sm">
          Sign-out could not be confirmed. Your session may still be active. Your workspace is still open. Try again.
        </p>
      )}
    </form>
  );
}
