import { AuthApiError, AuthSessionMissingError } from "@supabase/supabase-js";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: vi.fn(), authUser: vi.fn(), client: vi.fn(), rpc: vi.fn(), from: vi.fn(), logError: vi.fn() }));
vi.mock("@/lib/auth/user", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/lib/supabase/serverClient", () => ({ createSupabaseServerClient: mocks.client }));
vi.mock("@/lib/log/logger", () => ({ logError: mocks.logError }));
import { DELETE } from "@/app/api/report/[id]/route";
const id = "10000000-0000-4000-8000-000000000001";
const run = (reportId = id, headers: HeadersInit = {}) => DELETE(new Request(`http://localhost/api/report/${reportId}`, { method: "DELETE", headers }), { params: Promise.resolve({ id: reportId }) });
beforeEach(() => {
  vi.resetAllMocks(); mocks.user.mockResolvedValue({ id: "owner" });
  mocks.client.mockResolvedValue({ rpc: mocks.rpc, from: mocks.from, auth: {getUser: mocks.authUser} });
  mocks.authUser.mockResolvedValue({data:{user:{id:"owner"}},error:null});
  mocks.rpc.mockResolvedValue({ data: "deleted", error: null });
});
it("returns204 only for the atomic RPC's explicit deleted result", async () => {
  const response = await run(); expect(response.status).toBe(204);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(mocks.rpc).toHaveBeenCalledWith("delete_saved_report", { p_report_id: id });
  expect(mocks.from).not.toHaveBeenCalled();
});
it.each([null, undefined, "unexpected", [], { deleted: true }])("does not convert invalid/zero-result %j into success", async data => {
  mocks.rpc.mockResolvedValue({ data, error: null });
  const response = await run(); expect(response.status).toBe(503);
  expect((await response.json()).code).toBe("REPORT_DELETE_UNAVAILABLE");
});
it.each(["provider", "throw", "client", "user", "missing-client"])("reports dependency %s failure without leaking details", async failure => {
  const error = new Error("private provider detail");
  if (failure === "provider") mocks.rpc.mockResolvedValue({ data: null, error });
  if (failure === "throw") mocks.rpc.mockRejectedValue(error);
  if (failure === "client") mocks.client.mockRejectedValue(error);
  if (failure === "user") mocks.authUser.mockRejectedValue(error);
  if (failure === "missing-client") mocks.client.mockResolvedValue(null);
  const response = await run(); expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.text()).not.toContain("private provider detail");
});
it("keeps missing and non-owned reports indistinguishable", async () => {
  mocks.rpc.mockResolvedValue({ data: "not_found", error: null });
  expect((await run()).status).toBe(404);
});
it("refuses a shared case rather than deleting other reports", async () => {
  mocks.rpc.mockResolvedValue({ data: "shared_case", error: null });
  const response = await run(); expect(response.status).toBe(409);
  expect((await response.json()).code).toBe("REPORT_DELETE_SHARED_CASE");
});
it("rejects invalid IDs and cross-origin requests before auth", async () => {
  expect((await run("invalid")).status).toBe(404);
  expect((await run(id, { origin: "https://evil.example" })).status).toBe(403);
  expect(mocks.client).not.toHaveBeenCalled();
});
it("requires authentication", async () => {
  mocks.authUser.mockResolvedValue({data:{user:null},error:null}); expect((await run()).status).toBe(401);
  expect(mocks.rpc).not.toHaveBeenCalled();
});

it.each([new AuthSessionMissingError(), new AuthApiError("invalid token",401,"bad_jwt"), new AuthApiError("invalid token",403,"bad_jwt")])("recognizes a genuine absent/rejected session", async error => {
  mocks.authUser.mockResolvedValue({data:{user:null},error}); expect((await run()).status).toBe(401); expect(mocks.rpc).not.toHaveBeenCalled();
});
it("keeps an Auth service outage distinct from no session", async () => {
  mocks.authUser.mockResolvedValue({data:{user:null},error:new AuthApiError("service unavailable",503,"unexpected_failure")}); expect((await run()).status).toBe(503); expect(mocks.rpc).not.toHaveBeenCalled();
});
