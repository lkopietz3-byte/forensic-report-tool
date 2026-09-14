import { afterEach, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({ set: vi.fn(), getAll: vi.fn(), create: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => fixture }));
vi.mock("@supabase/ssr", () => ({ createServerClient: fixture.create }));
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
afterEach(() => { vi.resetAllMocks(); vi.unstubAllEnvs(); });
it.each([true, false])("cookie-write requirement %s is enforced at the actual adapter", async required => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:55321");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "synthetic");
  fixture.set.mockImplementation(() => { throw new Error("cookie write failed"); });
  await createSupabaseServerClient({ requireCookieWrites: required });
  const adapter = fixture.create.mock.calls[0]![2].cookies;
  const write = () => adapter.setAll([{ name: "synthetic-session", value: "", options: {} }]);
  if (required) expect(write).toThrow("cookie write failed");
  else expect(write).not.toThrow();
});
