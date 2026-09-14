// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { useSavedReports } from "@/app/workspace/useSavedReports";
let root: Root | undefined;
let container: HTMLDivElement;
let state: ReturnType<typeof useSavedReports>;
const row = { id: "10000000-0000-4000-8000-000000000001", matter: "Synthetic", createdAt: "2026-09-14T00:00:00Z", status: "draft" };
async function mount(fetcher: ReturnType<typeof vi.fn<(url: string, init: RequestInit, timeout: number) => Promise<Response>>>) {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  function Harness() {
    state = useSavedReports(true, fetcher);
    return createElement("input", { defaultValue: "UNSAVED work" });
  }
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(createElement(Harness)));
}
afterEach(async () => { if (root) await act(async () => root!.unmount()); container?.remove(); root = undefined; });
it.each(["503", "401", "network", "invalid-json", "invalid-row", "duplicate"])("preserves prior rows and inputs on %s, then recovers to verified empty", async failure => {
  const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ reports: [row] }));
  await mount(fetcher); expect(state.status).toBe("ready");
  if (failure === "network") fetcher.mockRejectedValueOnce(new Error("offline"));
  else if (failure === "invalid-json") fetcher.mockResolvedValueOnce(new Response("invalid"));
  else fetcher.mockResolvedValueOnce(Response.json({ reports: failure === "invalid-row" ? [{ ...row, id: null }] : failure === "duplicate" ? [row, row] : [] }, { status: Number(failure) || 200 }));
  await act(async () => state.refresh()); expect(state.status).toBe("unavailable"); expect(state.reports).toEqual([row]);
  expect(container.querySelector("input")!.value).toBe("UNSAVED work");
  fetcher.mockResolvedValueOnce(Response.json({ reports: [] }));
  await act(async () => state.refresh()); expect(state.status).toBe("ready"); expect(state.reports).toEqual([]);
});
it("ignores an older response that completes after a newer refresh", async () => {
  let resolveOld!: (r: Response) => void;
  const fetcher = vi.fn().mockReturnValueOnce(new Promise<Response>(resolve => { resolveOld = resolve; })).mockResolvedValueOnce(Response.json({ reports: [row] }));
  await mount(fetcher); expect(state.status).toBe("loading");
  await act(async () => state.refresh());
  await act(async () => resolveOld(Response.json({ reports: [] })));
  expect(state.reports).toEqual([row]); expect(state.status).toBe("ready");
});
