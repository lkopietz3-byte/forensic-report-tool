import { describe, expect, it } from "vitest";
import { GET } from "../app/api/export/sample/route.js";

describe("GET /api/export/sample", () => {
  it("returns a downloadable DOCX with the PK zip signature and attachment headers", async () => {
    const res = await GET(new Request("http://localhost/api/export/sample"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(res.headers.get("content-disposition")).toContain("attachment");
    expect(res.headers.get("content-disposition")).toContain(".docx");

    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.length).toBeGreaterThan(0);
    // DOCX is a zip; first two bytes are "PK".
    expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
  });
});
