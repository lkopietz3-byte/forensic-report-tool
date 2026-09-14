import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuditLog } from "@/lib/domain/audit";

const routeMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@/lib/auth/user", () => ({
  getCurrentUser: routeMocks.getCurrentUser,
}));
vi.mock("@/lib/supabase/serverClient", () => ({
  createSupabaseServerClient: routeMocks.createSupabaseServerClient,
}));
vi.mock("@/lib/log/logger", () => ({
  logError: routeMocks.logError,
}));

import { GET } from "@/app/api/report/[id]/route";

const REPORT_ID = "10000000-0000-4000-8000-000000000001";
const CASE_ID = "20000000-0000-4000-8000-000000000002";
const USER_ID = "30000000-0000-4000-8000-000000000003";

type DbResult = { data: unknown; error: unknown };

class FakeQuery implements PromiseLike<DbResult> {
  constructor(private readonly result: DbResult) {}
  select() { return this; }
  eq() { return this; }
  in() { return this; }
  order(column: string, options?: { ascending?: boolean }) {
    if (column !== "seq" || !Array.isArray(this.result.data)) return this;
    const direction = options?.ascending === false ? -1 : 1;
    const data = [...this.result.data].sort((left, right) =>
      direction * (Number((left as { seq?: unknown }).seq) - Number((right as { seq?: unknown }).seq)),
    );
    return new FakeQuery({ ...this.result, data });
  }
  maybeSingle() { return Promise.resolve(this.result); }
  then<TResult1 = DbResult, TResult2 = never>(
    onfulfilled?: ((value: DbResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

class RejectedQuery implements PromiseLike<DbResult> {
  constructor(private readonly error: Error) {}
  select() { return this; }
  eq() { return this; }
  in() { return this; }
  order() { return this; }
  maybeSingle() { return Promise.reject(this.error); }
  then<TResult1 = DbResult, TResult2 = never>(
    onfulfilled?: ((value: DbResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.reject(this.error).then(onfulfilled, onrejected);
  }
}

function auditRow(event: ReturnType<AuditLog["append"]>, seq: number) {
  return {
    seq,
    event_id: event.id,
    chain_report_id: event.reportId,
    section_key: event.sectionKey,
    prompt: event.prompt,
    model: event.model,
    model_version: event.modelVersion,
    input_ids: event.inputIds,
    output: event.output,
    created_at_iso: event.createdAt,
    prev_hash: event.prevHash,
    entry_hash: event.entryHash,
  };
}

function validAuditRows() {
  const log = new AuditLog();
  const first = log.append({
    reportId: REPORT_ID,
    sectionKey: "opinions",
    prompt: "Use only the supplied synthetic evidence.",
    model: "deterministic-structurer",
    modelVersion: "no-ai-v1",
    inputIds: ["E1"],
    output: "Synthetic finding [[E:E1]].",
  });
  const second = log.append({
    reportId: REPORT_ID,
    sectionKey: "basis_and_reasons",
    prompt: "Use only the same synthetic evidence.",
    model: "deterministic-structurer",
    modelVersion: "no-ai-v1",
    inputIds: ["E1"],
    output: "Synthetic basis [[E:E1]].",
  });
  return [auditRow(first, 0), auditRow(second, 1)];
}

function baseResults(): Record<string, DbResult> {
  return {
    reports: {
      data: {
        id: REPORT_ID,
        case_id: CASE_ID,
        deliverable_style: null,
        cases: {
          owner_id: USER_ID,
          matter: "Synthetic v. Example",
          retaining_counsel: "Example Counsel",
          expert_role: "Vocational expert",
        },
      },
      error: null,
    },
    inputs: { data: [{ id: "input-1" }], error: null },
    evidence_units: {
      data: [{ ref_id: "E1", content: "Synthetic finding.", location: "Synthetic source p. 1", section_key: "opinions" }],
      error: null,
    },
    report_sections: {
      data: [{ section_key: "opinions", draft_text: "Synthetic finding [[E:E1]].", final_text: null, cited_evidence_ids: ["E1"], ungrounded_flags: [] }],
      error: null,
    },
    profiles: { data: null, error: null },
    audit_events: { data: [validAuditRows()[0]], error: null },
  };
}

function fakeClient(results: Record<string, DbResult>) {
  const from = vi.fn((table: string) => new FakeQuery(results[table] ?? { data: null, error: null }));
  return { from };
}

function request(id = REPORT_ID) {
  return GET(new Request(`https://disclosed.example/api/report/${id}`), {
    params: Promise.resolve({ id }),
  });
}

beforeEach(() => {
  routeMocks.getCurrentUser.mockReset().mockResolvedValue({ id: USER_ID, email: "expert@example.test" });
  routeMocks.createSupabaseServerClient.mockReset();
  routeMocks.logError.mockReset();
});

describe("GET /api/report/[id] — fail-closed persistence load", () => {
  it("returns the complete saved report only after every required read succeeds", async () => {
    routeMocks.createSupabaseServerClient.mockResolvedValue(fakeClient(baseResults()));
    const response = await request();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.input.meta.matter).toBe("Synthetic v. Example");
    expect(body.input.evidence).toEqual([
      { id: "E1", content: "Synthetic finding.", location: "Synthetic source p. 1" },
    ]);
    expect(body.input.sections[0].evidenceIds).toContain("E1");
    expect(body.integrity).toMatchObject({ verified: true, events: 1 });
  });

  it("orders a multi-event audit chain by sequence before verifying it", async () => {
    const results = baseResults();
    results.audit_events = { data: validAuditRows().reverse(), error: null };
    routeMocks.createSupabaseServerClient.mockResolvedValue(fakeClient(results));

    const response = await request();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.integrity).toMatchObject({ verified: true, events: 2 });
  });

  it.each(["reports", "inputs", "evidence_units", "report_sections", "profiles", "audit_events"])(
    "returns retryable 503 and no report content when the %s read fails",
    async (failedTable) => {
      const results = baseResults();
      results[failedTable] = { data: null, error: { code: "TEST_DB_FAILURE", message: `${failedTable} unavailable` } };
      routeMocks.createSupabaseServerClient.mockResolvedValue(fakeClient(results));

      const response = await request();
      const body = await response.json();

      expect(response.status).toBe(503);
      expect(response.headers.get("retry-after")).toBe("2");
      expect(body).toEqual({
        error: "Could not open that report. Please try again.",
        code: "REPORT_LOAD_UNAVAILABLE",
        retryable: true,
      });
      expect(body.input).toBeUndefined();
      expect(body.integrity).toBeUndefined();
      expect(routeMocks.logError).toHaveBeenCalledWith(
        "report.load_failed",
        expect.objectContaining({ code: "TEST_DB_FAILURE" }),
        expect.objectContaining({ reportId: REPORT_ID, userId: USER_ID }),
      );
    },
  );

  it("keeps a genuinely absent report distinct from a database failure", async () => {
    const results = baseResults();
    results.reports = { data: null, error: null };
    routeMocks.createSupabaseServerClient.mockResolvedValue(fakeClient(results));
    const response = await request();
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found." });
    expect(routeMocks.logError).not.toHaveBeenCalled();
  });

  it("returns the same non-disclosing 404 for a report outside the current owner", async () => {
    const results = baseResults();
    (results.reports.data as { cases: { owner_id: string } }).cases.owner_id = "40000000-0000-4000-8000-000000000004";
    routeMocks.createSupabaseServerClient.mockResolvedValue(fakeClient(results));
    const response = await request();
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found." });
  });

  it("rejects a malformed report id before querying the database", async () => {
    const client = fakeClient(baseResults());
    routeMocks.createSupabaseServerClient.mockResolvedValue(client);
    const response = await request("not-a-report-id");
    expect(response.status).toBe(404);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("allows legitimate empty child sets but marks an empty audit chain unverified", async () => {
    const results = baseResults();
    results.inputs = { data: [], error: null };
    results.evidence_units = { data: [], error: null };
    results.report_sections = { data: [], error: null };
    results.profiles = { data: null, error: null };
    results.audit_events = { data: [], error: null };
    const client = fakeClient(results);
    routeMocks.createSupabaseServerClient.mockResolvedValue(client);

    const response = await request();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.input.evidence).toEqual([]);
    expect(body.input.sections).toEqual([]);
    expect(body.input.profile).toMatchObject({ fullName: "", credentials: "" });
    expect(body.integrity).toMatchObject({ verified: false, events: 0 });
    expect(client.from).not.toHaveBeenCalledWith("evidence_units");
  });

  it("returns 401 without querying storage when there is no verified user", async () => {
    routeMocks.getCurrentUser.mockResolvedValue(null);
    const response = await request();
    expect(response.status).toBe(401);
    expect(routeMocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("returns retryable 503 when the configured database client is unavailable", async () => {
    routeMocks.createSupabaseServerClient.mockResolvedValue(null);
    const response = await request();
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("2");
    expect(await response.json()).toMatchObject({ retryable: true, code: "REPORT_LOAD_UNAVAILABLE" });
  });

  it("returns retryable 503 when creating the database client rejects", async () => {
    routeMocks.createSupabaseServerClient.mockRejectedValue(new Error("synthetic client failure"));
    const response = await request();

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ retryable: true, code: "REPORT_LOAD_UNAVAILABLE" });
    expect(routeMocks.logError).toHaveBeenCalledWith(
      "report.load_failed",
      expect.any(Error),
      expect.objectContaining({ dependency: "client" }),
    );
  });

  it("returns retryable 503 when a child query promise rejects", async () => {
    const results = baseResults();
    const from = vi.fn((table: string) =>
      table === "audit_events"
        ? new RejectedQuery(new Error("synthetic rejected audit request"))
        : new FakeQuery(results[table] ?? { data: null, error: null }),
    );
    routeMocks.createSupabaseServerClient.mockResolvedValue({ from });
    const response = await request();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.input).toBeUndefined();
    expect(body.integrity).toBeUndefined();
    expect(routeMocks.logError).toHaveBeenCalledWith(
      "report.load_failed",
      expect.any(Error),
      expect.objectContaining({ dependency: "query_exception" }),
    );
  });

  it("can be retried after a transient dependency failure without returning partial data", async () => {
    const failedResults = baseResults();
    failedResults.audit_events = {
      data: null,
      error: { code: "TEST_TRANSIENT_FAILURE", message: "audit read timed out" },
    };
    routeMocks.createSupabaseServerClient
      .mockResolvedValueOnce(fakeClient(failedResults))
      .mockResolvedValueOnce(fakeClient(baseResults()));

    const first = await request();
    const firstBody = await first.json();
    expect(first.status).toBe(503);
    expect(firstBody.input).toBeUndefined();
    expect(firstBody.integrity).toBeUndefined();

    const retry = await request();
    const retryBody = await retry.json();
    expect(retry.status).toBe(200);
    expect(retryBody.input.meta.matter).toBe("Synthetic v. Example");
    expect(retryBody.integrity).toMatchObject({ verified: true, events: 1 });
  });
});

const snapshotProfile = {full_name:"Historical A",credentials:"CRC A",publications_last_10yr:[],prior_testimony_last_4yr:["Synthetic A"],compensation_statement:"Original compensation"};
it("uses the report-owned profile without reading current account defaults",async()=>{
 const results=baseResults();Object.assign(results.reports.data as object,{profile_snapshot:snapshotProfile});results.profiles={data:null,error:{message:"current profile unavailable"}};
 const client=fakeClient(results);routeMocks.createSupabaseServerClient.mockResolvedValue(client);
 const r=await request();expect(r.status).toBe(200);const b=await r.json();expect(b.input.profile.fullName).toBe('Historical A');expect(b.profileSource).toBe('saved_snapshot');expect(client.from).not.toHaveBeenCalledWith('profiles');
});
it("labels legacy profile provenance rather than inventing a historical snapshot",async()=>{
 routeMocks.createSupabaseServerClient.mockResolvedValue(fakeClient(baseResults()));const b=await(await request()).json();expect(b.profileSource).toBe('legacy_current_profile');
});
it("does not fall back to current defaults when a saved profile is malformed",async()=>{
 const results=baseResults();Object.assign(results.reports.data as object,{profile_snapshot:{full_name:'Incomplete'}});routeMocks.createSupabaseServerClient.mockResolvedValue(fakeClient(results));expect((await request()).status).toBe(503);
});
it("refuses a report deleted between parent and child reads",async()=>{
 const results=baseResults();let reads=0;const from=vi.fn((table:string)=>new FakeQuery(table==='reports'&&++reads>1?{data:null,error:null}:results[table]!));
 routeMocks.createSupabaseServerClient.mockResolvedValue({from});const r=await request();expect(r.status).toBe(404);expect((await r.json()).input).toBeUndefined();
});
it("keeps internal hash verification separate from report binding for legacy data",async()=>{
 const results=baseResults();const events=new AuditLog();results.audit_events={data:[auditRow(events.append({reportId:'user-report',sectionKey:'opinions',prompt:'synthetic',model:'no-ai',modelVersion:'test',inputIds:[],output:'synthetic'}),0)],error:null};routeMocks.createSupabaseServerClient.mockResolvedValue(fakeClient(results));
 const b=await(await request()).json();expect(b.integrity).toMatchObject({verified:true,reportBound:false});
});
