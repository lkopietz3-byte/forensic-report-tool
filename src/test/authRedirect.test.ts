import { beforeEach, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({ exchangeCodeForSession: vi.fn(), signOut: vi.fn(), client: vi.fn() }));
vi.mock("@/lib/supabase/serverClient", () => ({ createSupabaseServerClient: auth.client }));
import { GET } from "@/app/auth/callback/route";
import { POST } from "@/app/auth/signout/route";
beforeEach(() => {
  vi.resetAllMocks();
  auth.client.mockResolvedValue({ auth });
  auth.exchangeCodeForSession.mockResolvedValue({ error: null });
  auth.signOut.mockResolvedValue({ error: null });
});
it("keeps a successful callback on the browser origin even if Next uses an internal origin", async () => {
  const response = await GET(new Request("http://localhost:3337/auth/callback?code=synthetic&next=%2Fworkspace%3Fview%3Dsaved"));
  expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("synthetic");
  expect(auth.client).toHaveBeenCalledWith({ requireCookieWrites: true });
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("/workspace?view=saved");
  expect(new URL(response.headers.get("location")!, "http://127.0.0.1:3337").origin).toBe("http://127.0.0.1:3337");
});
it.each(["https://evil.example", "//evil.example", "/\\evil.example", "/\n/evil.example"])("rejects unsafe callback destination %j", async next => {
  const response = await GET(new Request(`http://localhost:3337/auth/callback?code=synthetic&next=${encodeURIComponent(next)}`));
  expect(response.headers.get("location")).toBe("/workspace");
});
it.each(["missing-code", "missing-client", "exchange-error"])("keeps failed callback %s on the browser origin", async failure => {
  if (failure === "missing-client") auth.client.mockResolvedValue(null);
  if (failure === "exchange-error") auth.exchangeCodeForSession.mockResolvedValue({ error: new Error("invalid code") });
  const response = await GET(new Request(`http://localhost:3337/auth/callback${failure === "missing-code" ? "" : "?code=synthetic"}`));
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("/signin?error=link");
});
it("signs out and returns to the browser origin with GET semantics", async () => {
  const response = await POST(new Request("http://localhost:3337/auth/signout", {method:"POST"}));
  expect(auth.signOut).toHaveBeenCalledOnce();
  expect(auth.client).toHaveBeenCalledWith({ requireCookieWrites: true });
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe("/workspace");
});

it.each(["returned-error", "thrown-error", "missing-client", "client-throws"])("does not claim sign-out success for %s", async failure => {
  if (failure === "returned-error") auth.signOut.mockResolvedValue({ error: new Error("private provider detail") });
  if (failure === "thrown-error") auth.signOut.mockRejectedValue(new Error("private provider detail"));
  if (failure === "missing-client") auth.client.mockResolvedValue(null);
  if (failure === "client-throws") auth.client.mockRejectedValue(new Error("private provider detail"));
  const response = await POST(new Request("http://localhost:3337/auth/signout", { method: "POST", headers: { accept: "application/json" } }));
  expect(response.status).toBe(503);
  expect(response.headers.get("location")).toBeNull();
  expect(response.headers.get("cache-control")).toBe("no-store");
  const body = await response.text();
  expect(body).toContain("SIGN_OUT_UNAVAILABLE");
  expect(body).not.toContain("private provider detail");
  expect(body).not.toContain('"signedOut":true');
});
it("acknowledges confirmed sign-out to the enhanced form without redirecting fetch", async () => {
  const response = await POST(new Request("http://localhost:3337/auth/signout", { method: "POST", headers: { accept: "application/json", origin: "http://localhost:3337" } }));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ signedOut: true });
  expect(response.headers.get("cache-control")).toBe("no-store");
});
it.each([new Headers({ origin: "https://evil.example" }), new Headers({ "sec-fetch-site": "cross-site" })])("refuses cross-origin sign-out before touching the session", async headers => {
  const response = await POST(new Request("http://localhost:3337/auth/signout", { method:"POST", headers }));
  expect(response.status).toBe(403);
  expect(auth.client).not.toHaveBeenCalled();
});

it("does not redirect or expose provider details when callback persistence throws", async () => {
  auth.exchangeCodeForSession.mockRejectedValue(new Error("private cookie failure"));
  const response = await GET(new Request("http://localhost:3337/auth/callback?code=synthetic"));
  expect(response.status).toBe(503);
  expect(response.headers.get("location")).toBeNull();
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.text()).not.toContain("private cookie failure");
});
