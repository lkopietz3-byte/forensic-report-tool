import { describe, expect, it } from "vitest";
import { supabaseTestGateFailures } from "./supabaseTestTarget";

describe("disposable Supabase integration target gate", () => {
  it("accepts a complete loopback target without a remote acknowledgement", () => {
    expect(supabaseTestGateFailures({
      TEST_SUPABASE_URL: "http://127.0.0.1:54321",
      TEST_SUPABASE_SERVICE_ROLE_KEY: "synthetic-local-service-key",
      TEST_SUPABASE_ANON_KEY: "synthetic-local-anon-key",
      TEST_SUPABASE_SCHEMA_VERSION: "0016",
    })).toEqual([]);
  });

  it("rejects missing credentials, disposable acknowledgement, and migration identity", () => {
    expect(supabaseTestGateFailures({})).toEqual([
      "set TEST_SUPABASE_URL, TEST_SUPABASE_SERVICE_ROLE_KEY, and TEST_SUPABASE_ANON_KEY",
      "use a loopback Supabase target; remote database integration is intentionally refused",
      "set TEST_SUPABASE_SCHEMA_VERSION=0016 after applying migrations through 0016",
    ]);
  });

  it("rejects every remote target even when it is labeled throwaway", () => {
    expect(supabaseTestGateFailures({
      TEST_SUPABASE_URL: "https://claimed-throwaway.supabase.example",
      TEST_SUPABASE_SERVICE_ROLE_KEY: "synthetic-test-service-key",
      TEST_SUPABASE_ANON_KEY: "synthetic-test-anon-key",
      TEST_SUPABASE_IS_THROWAWAY: "1",
      TEST_SUPABASE_SCHEMA_VERSION: "0016",
    })).toContain("use a loopback Supabase target; remote database integration is intentionally refused");
  });
});
