import { describe, expect, it } from "vitest";
import { materializeSavedReport } from "@/app/workspace/savedReportLoad";

const REPORT_ID = "10000000-0000-4000-8000-000000000001";
const validResponse = {
  reportId:REPORT_ID,
  profileSource:"saved_snapshot",
  input: {
    meta: {
      matter: "Synthetic v. Example",
      retainingCounsel: "Example Counsel",
      expertRole: "Vocational expert",
    },
    profile: {
      fullName: "Alex Example",
      credentials: "CRC",
      compensationStatement: "$300/hr",
      priorTestimonyLast4yr: ["Synthetic matter (2025)"],
    },
    evidence: [
      { id: "E1", content: "Synthetic finding.", location: "Synthetic source p. 1" },
    ],
    sections: [
      {
        key: "opinions",
        evidenceIds: ["E1"],
        finalText: "Synthetic finding [[E:E1]].",
      },
    ],
    style: null,
  },
  integrity: { verified: true, reportBound:true },
};

describe("saved-report response materialization", () => {
  it("validates and derives the entire next workspace before returning", () => {
    const result = materializeSavedReport(validResponse, "fallback", REPORT_ID);

    expect(result.matter).toBe("Synthetic v. Example");
    expect(result.priorTestimony).toBe("Synthetic matter (2025)");
    expect(result.units).toEqual([
      {
        id: "E1",
        content: "Synthetic finding.",
        location: "Synthetic source p. 1",
        sectionKey: "opinions",
      },
    ]);
    expect(result.edits).toEqual({ opinions: "Synthetic finding [[E:E1]]." });
    expect(result.integrityVerified).toBe(true);
  });

  it("rejects a malformed 200 before a caller can replace its current workspace", () => {
    const currentWorkspace = {
      matter: "Current unsaved work",
      units: [{ id: "E-current", content: "Keep me" }],
    };
    const malformed = {
      ...validResponse,
      input: {
        ...validResponse.input,
        profile: { fullName: "Partial response" },
      },
    };

    expect(() => materializeSavedReport(malformed, "fallback", REPORT_ID)).toThrow(
      "Your current workspace was not changed",
    );
    expect(currentWorkspace).toEqual({
      matter: "Current unsaved work",
      units: [{ id: "E-current", content: "Keep me" }],
    });
  });

  it("can materialize a complete retry after a malformed response", () => {
    expect(() => materializeSavedReport({ input: null }, "fallback", REPORT_ID)).toThrow();
    expect(materializeSavedReport(validResponse, "fallback", REPORT_ID).matter).toBe("Synthetic v. Example");
  });
});

it("refuses missing provenance/binding rather than silently omitting warnings",()=>{
 for(const field of ['profileSource','reportBound']){
  const response=structuredClone(validResponse) as Record<string,unknown>;
  if(field==='profileSource')delete response.profileSource;else delete (response.integrity as Record<string,unknown>).reportBound;
  expect(()=>materializeSavedReport(response,'fallback', REPORT_ID)).toThrow();
 }
});

it("refuses a response for a different requested report",()=>{expect(()=>materializeSavedReport(validResponse,'fallback','20000000-0000-4000-8000-000000000002')).toThrow();});
