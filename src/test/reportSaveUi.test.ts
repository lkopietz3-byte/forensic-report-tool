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
  await act(async () => container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it.each([400,401,403,413,429])("reports HTTP%i as a refused pre-write request without claiming possible success",async status=>{
 const before=fields();fetcher.mockResolvedValueOnce(Response.json({error:'Request refused'},{status}));
 await act(async()=>button('Save to my account').click());expect(fields()).toEqual(before);
 expect(container.textContent).toContain('Nothing was saved by this request');expect(container.textContent).not.toContain('may have succeeded');
});
it.each(['503','network','bad-200','array-id'])("preserves workspace and offers refresh for uncertain %s",async kind=>{
 const before=fields();if(kind==='network')fetcher.mockRejectedValueOnce(new Error('offline'));
 else fetcher.mockResolvedValueOnce(Response.json(kind==='array-id'?{reportId:[row.id],caseId:row.id}:{},{status:kind==='503'?503:200}));
 await act(async()=>button('Save to my account').click());expect(fields()).toEqual(before);
 expect(container.textContent).toContain('may have succeeded');expect(container.textContent).toContain('Another save creates a new snapshot');
 expect(container.textContent).not.toContain('Saved to your account.');
});
it("acknowledges valid IDs and refreshes without changing the workspace",async()=>{
 const before=fields();fetcher.mockResolvedValueOnce(Response.json({reportId:row.id,caseId:'20000000-0000-4000-8000-000000000002'})).mockResolvedValueOnce(Response.json({reports:[row]}));
 await act(async()=>button('Save to my account').click());expect(fields()).toEqual(before);expect(container.textContent).toContain('Saved to your account.');expect(fetcher).toHaveBeenCalledTimes(3);
});
