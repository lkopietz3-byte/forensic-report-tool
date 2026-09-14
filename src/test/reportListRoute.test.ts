import { AuthApiError, AuthSessionMissingError } from "@supabase/supabase-js";
import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ client: vi.fn(), auth: vi.fn(), query: vi.fn(), from: vi.fn(), eq: vi.fn() }));
vi.mock("@/lib/supabase/serverClient", () => ({ createSupabaseServerClient: m.client }));
vi.mock("@/lib/auth/user", () => ({ getCurrentUser: vi.fn().mockResolvedValue(null) }));
import { GET } from "@/app/api/report/list/route";
beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({ data: { user: { id: "owner" } }, error: null });
  const query = { select: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: m.query, eq: m.eq.mockReturnThis() };
  m.from.mockReturnValue(query);
  m.client.mockResolvedValue({ auth: { getUser: m.auth }, from: m.from });
  m.query.mockResolvedValue({ data: [], error: null });
});
it("returns verified empty only after the authenticated query succeeds", async () => {
  const r = await GET(); expect(r.status).toBe(200); expect(await r.json()).toEqual({ reports: [] });
  expect(m.query).toHaveBeenCalledWith(50); expect(r.headers.get("cache-control")).toBe("no-store");
});
it.each(["client", "auth", "query", "null-data", "throw"])("keeps %s failure distinct from empty", async failure => {
  if (failure === "client") m.client.mockResolvedValue(null);
  if (failure === "auth") m.auth.mockResolvedValue({ data: { user: null }, error: new AuthApiError("private detail",503,"unexpected_failure") });
  if (failure === "query") m.query.mockResolvedValue({ data: null, error: new Error("private detail") });
  if (failure === "null-data") m.query.mockResolvedValue({ data: null, error: null });
  if (failure === "throw") m.client.mockRejectedValue(new Error("private detail"));
  const r = await GET(); expect(r.status).toBe(503); expect(r.headers.get("cache-control")).toBe("no-store");
  expect(await r.text()).not.toContain("private detail");
});
it.each([null, new AuthSessionMissingError(), new AuthApiError("invalid",401,"bad_jwt")])("returns401 for an absent session", async error => {
  m.auth.mockResolvedValue({ data: { user: null }, error });
  expect((await GET()).status).toBe(401); expect(m.from).not.toHaveBeenCalled();
});
it("maps the real saved rows", async () => {
  m.query.mockResolvedValue({ data: [{ id: "id", created_at: "date", status: "draft", cases: { owner_id: "owner", matter: "Synthetic" } }], error: null });
  expect(await (await GET()).json()).toEqual({ reports: [{ id: "id", createdAt: "date", status: "draft", matter: "Synthetic" }] });
});

it.each([null, {}, { owner_id: "other", matter: "Private foreign matter" }])("rejects a missing or foreign owner relation before exposing summaries", async relation => {
  m.query.mockResolvedValue({ data: [{ id: "id", created_at: "date", status: "draft", cases: relation }], error: null });
  const r = await GET(); expect(r.status).toBe(503); expect(await r.text()).not.toContain("Private foreign matter");
  expect(m.eq).toHaveBeenCalledWith("cases.owner_id", "owner");
});
