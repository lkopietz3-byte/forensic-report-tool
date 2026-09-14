// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SignOutButton } from "@/app/workspace/SignOutButton";
let root: Root;
let container: HTMLDivElement;
const navigate = vi.fn();
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div"); document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(createElement("main", null,
    createElement("input", { defaultValue: "UNSAVED synthetic matter" }),
    createElement(SignOutButton, { onSignedOut: navigate }),
  )));
});
afterEach(async () => {
  await act(async () => root.unmount()); container.remove();
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); navigate.mockReset();
});
function button() { return container.querySelector("button")!; }
function assertFailure() {
  expect(container.querySelector("input")!.value).toBe("UNSAVED synthetic matter");
  expect(container.querySelector('[role="alert"]')?.textContent).toContain("could not be confirmed");
  expect(button().textContent).toBe("Try sign out again");
  expect(button().disabled).toBe(false);
  expect(navigate).not.toHaveBeenCalled();
}
it.each(["503", "network", "invalid-json", "unconfirmed-200"])("preserves the workspace on %s then navigates only after a successful retry", async failure => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  if (failure === "network") fetcher.mockRejectedValueOnce(new Error("network unavailable"));
  else fetcher.mockResolvedValueOnce(new Response(failure === "invalid-json" ? "not json" : JSON.stringify({ error: "unavailable" }), { status: failure === "503" ? 503 : 200 }));
  await act(async () => button().click()); assertFailure();
  fetcher.mockResolvedValueOnce(Response.json({ signedOut: true }));
  await act(async () => button().click());
  expect(navigate).toHaveBeenCalledOnce();
  expect(fetcher).toHaveBeenLastCalledWith("/auth/signout", expect.objectContaining({ method: "POST", headers: { Accept: "application/json" }, signal: expect.any(AbortSignal) }));
});
it("bounds a hung request, prevents duplicate submission, and leaves retry available", async () => {
  vi.useFakeTimers();
  vi.spyOn(AbortSignal, "timeout").mockImplementation(ms => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms); return controller.signal;
  });
  const fetcher = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init.signal!.addEventListener("abort", () => reject(new DOMException("Timeout", "AbortError")));
  }));
  vi.stubGlobal("fetch", fetcher);
  await act(async () => { button().click(); button().click(); });
  expect(button().disabled).toBe(true); expect(fetcher).toHaveBeenCalledOnce();
  expect(button().textContent).toBe("Signing out…");
  await act(async () => vi.advanceTimersByTimeAsync(15_000)); assertFailure();
});
