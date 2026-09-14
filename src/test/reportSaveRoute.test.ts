import { AuthApiError } from "@supabase/supabase-js";
import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ client: vi.fn(), user: vi.fn(), auth: vi.fn(), rpc: vi.fn(), from: vi.fn(), assemble: vi.fn(), parse: vi.fn() }));
vi.mock("@/lib/supabase/serverClient", () => ({ createSupabaseServerClient: m.client }));
vi.mock("@/lib/auth/user", () => ({ getCurrentUser: m.user }));
vi.mock("@/lib/report/assemble", () => ({ assembleUserReport: m.assemble }));
vi.mock("@/lib/report/schema", () => ({ parseReportInput: m.parse }));
vi.mock("@/lib/draft/liveClient", () => ({ getLiveClientOrNull: vi.fn() }));
vi.mock("@/lib/http/rateLimit", () => ({ createRateLimiter: () => () => false }));
vi.mock("@/lib/log/logger", () => ({ logError: vi.fn(), log: { error: vi.fn() } }));
vi.mock("node:crypto",()=>({randomUUID:()=>"10000000-0000-4000-8000-000000000001"}));
import { POST } from "@/app/api/report/save/route";
const ids = { reportId: "10000000-0000-4000-8000-000000000001", caseId: "20000000-0000-4000-8000-000000000002" };
const input = { meta: {matter:"Synthetic",retainingCounsel:"Example",expertRole:"Expert"}, profile:{fullName:"Synthetic expert",credentials:"test",compensationStatement:"test",priorTestimonyLast4yr:[]}, evidence:[], sections:[], noAi:true };
const request = (origin?: string) => new Request("http://localhost/api/report/save", {method:"POST",headers:{"content-type":"application/json",...(origin?{origin}:{})},body:"{}"});
beforeEach(() => {
 vi.resetAllMocks(); m.user.mockResolvedValue({id:"owner"}); m.auth.mockResolvedValue({data:{user:{id:"owner"}},error:null});
 m.client.mockResolvedValue({auth:{getUser:m.auth},rpc:m.rpc,from:m.from}); m.rpc.mockResolvedValue({data:ids,error:null});
 m.parse.mockReturnValue({success:true,data:input}); m.assemble.mockResolvedValue({meta:input.meta,exportSections:[],appendix:{rawEvents:[]}});
});
it("saves through one owner-bound RPC and acknowledges both committed IDs", async () => {
 const r=await POST(request()); expect(r.status).toBe(200); expect(await r.json()).toEqual(ids); expect(m.from).not.toHaveBeenCalled();
 expect(m.rpc).toHaveBeenCalledWith("save_report_snapshot",expect.objectContaining({p_meta:input.meta,p_evidence:[],p_sections:[],p_audit:[]}));
 expect(r.headers.get("cache-control")).toBe("no-store");
});
it.each([null,{}, {reportId:ids.reportId}, {reportId:"invalid",caseId:ids.caseId}])("rejects unconfirmed RPC result %j", async data => {
 m.rpc.mockResolvedValue({data,error:null}); const r=await POST(request()); expect(r.status).toBe(503); expect((await r.json()).code).toBe("REPORT_SAVE_UNAVAILABLE");
});
it.each(["rpc-error","rpc-throw","client","auth","assembly"])("keeps %s failure explicit without destructive cleanup", async failure => {
 if(failure==='rpc-error')m.rpc.mockResolvedValue({data:null,error:new Error('private detail')});
 if(failure==='rpc-throw')m.rpc.mockRejectedValue(new Error('private detail'));
 if(failure==='client')m.client.mockRejectedValue(new Error('private detail'));
 if(failure==='auth')m.auth.mockResolvedValue({data:{user:null},error:new AuthApiError('private detail',503,'unexpected_failure')});
 if(failure==='assembly')m.assemble.mockRejectedValue(new Error('private detail'));
 const r=await POST(request()); expect(r.status).toBe(503);expect(await r.text()).not.toContain('private detail');expect(m.from).not.toHaveBeenCalled();
});
it("rejects an absent session and cross-site request before writing",async()=>{
 m.auth.mockResolvedValue({data:{user:null},error:null});m.user.mockResolvedValue(null);expect((await POST(request())).status).toBe(401);expect(m.rpc).not.toHaveBeenCalled();
 m.client.mockClear();expect((await POST(request('https://evil.example'))).status).toBe(403);expect(m.client).not.toHaveBeenCalled();
});
