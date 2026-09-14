// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ReportBuilder } from "@/app/workspace/ReportBuilder";
let root: Root;
let container: HTMLDivElement;
const row = { id: "10000000-0000-4000-8000-000000000001", matter: "Synthetic saved report", createdAt: "2026-09-14T00:00:00Z", status: "draft" };
const fetcher = vi.fn();
function button(label: string) { return Array.from(container.querySelectorAll("button")).find(b => b.textContent === label)!; }
function fields() { return Array.from(container.querySelectorAll<HTMLInputElement>("input,textarea,select")).map(e => ({ value: e.value, checked: e.checked })); }
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  fetcher.mockReset().mockResolvedValueOnce(Response.json({ reports: [row] })); vi.stubGlobal("fetch", fetcher);
  vi.spyOn(window, "confirm").mockReturnValue(true);
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root.render(createElement(ReportBuilder, { evidenceSections: [], sectionGuide: [], canSave: true, authConfigured: true, billingConfigured: false, isPro: false, credits: null, canBuyCredits: false, justUpgraded: false, justPurchased: 0, autoBuy: null })));
  await act(async () => button("Load a worked example").click());
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it.each([200, 202, 404, 503])("does not remove a row or change the workspace on unconfirmed HTTP%i", async status => {
  const before = fields(); fetcher.mockResolvedValueOnce(Response.json({ error: "Deletion unavailable" }, { status }));
  await act(async () => button("Delete").click());
  expect(button("Delete")).toBeDefined(); expect(fields()).toEqual(before);
  expect(container.textContent).toContain("Use Refresh saved reports");
  expect(container.textContent).not.toContain("Saved report deleted.");
});
it("removes the saved row only on204 and leaves the current workspace intact", async () => {
  const before = fields(); fetcher.mockResolvedValueOnce(new Response(null, { status: 204 }));
  await act(async () => button("Delete").click());
  expect(button("Delete")).toBeUndefined(); expect(fields()).toEqual(before); expect(container.textContent).toContain("Saved report deleted.");
});
it("cancel sends no deletion request", async () => {
  vi.mocked(window.confirm).mockReturnValue(false); await act(async () => button("Delete").click());
  expect(fetcher).toHaveBeenCalledTimes(1); expect(button("Delete")).toBeDefined();
});

it("explains a shared-case conflict without prescribing an ineffective refresh", async () => {
  const before = fields(); fetcher.mockResolvedValueOnce(Response.json({ code: "REPORT_DELETE_SHARED_CASE" }, { status: 409 }));
  await act(async () => button("Delete").click());
  expect(button("Delete")).toBeDefined(); expect(fields()).toEqual(before);
  expect(container.textContent).toContain("Open Help");
  expect(container.textContent).not.toContain("Use Refresh saved reports to check");
});
