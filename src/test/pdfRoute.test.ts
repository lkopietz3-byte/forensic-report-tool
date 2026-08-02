import { describe, expect, it } from "vitest";
import { GET } from "../app/api/export/sample/pdf/route.js";

describe("GET /api/export/sample/pdf", () => {
  it("returns a downloadable PDF with the %PDF magic header and attachment headers", async () => {
    const res = await GET(new Request("http://localhost/api/export/sample/pdf"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toContain("attachment");
    expect(res.headers.get("content-disposition")).toContain(".pdf");

    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.length).toBeGreaterThan(0);
    expect(buf.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });
});
