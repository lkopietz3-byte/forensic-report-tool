import { describe, expect, it } from "vitest";
import { POST } from "../app/api/report/export/route.js";

// Locks the existential invariant at the DELIVERABLE BOUNDARY: the export route
// itself must refuse to produce a file when a section isn't grounded in the
// supplied evidence. (Billing is off by default, so this exercises the grounding
// gate without touching auth/credits.)

function req(body: unknown) {
  return new Request("http://localhost/api/report/export?format=docx", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const BASE = {
  meta: { matter: "Doe v. Roe", retainingCounsel: "", expertRole: "Vocational expert" },
  profile: {
    fullName: "Pat Lee, CRC",
    credentials: "CRC",
    publicationsLast10yr: [],
    priorTestimonyLast4yr: [],
    compensationStatement: "$300/hr; not contingent.",
  },
  evidence: [{ id: "E1", content: "Permanent restriction: no lifting over 25 pounds.", location: "Dr. Reyes p.3" }],
};

describe("POST /api/report/export — grounding gate", () => {
  it("produces a real .docx for a clean, grounded report", async () => {
    const res = await POST(req({ ...BASE, sections: [{ key: "functional_capacity", evidenceIds: ["E1"] }] }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("wordprocessingml.document");
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.subarray(0, 2).toString("latin1")).toBe("PK"); // docx = zip
  });

  it("refuses (422 GROUNDING_BLOCKED) when an adopted edit cites an unfed id", async () => {
    const res = await POST(
      req({
        ...BASE,
        sections: [
          { key: "functional_capacity", evidenceIds: ["E1"], finalText: "The claimant can lift 500 pounds [[E:E9]]." },
        ],
      }),
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe("GROUNDING_BLOCKED");
    expect(body.sections[0].invalidCitations.length).toBeGreaterThan(0);
  });

  it("refuses (422) when an adopted edit asserts an ungrounded figure (no citation)", async () => {
    const res = await POST(
      req({
        ...BASE,
        sections: [
          { key: "earning_capacity", evidenceIds: ["E1"], finalText: "Lost earning capacity totals $2,000,000." },
        ],
      }),
    );
    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe("GROUNDING_BLOCKED");
  });
});
