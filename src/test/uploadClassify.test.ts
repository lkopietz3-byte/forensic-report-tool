import { describe, expect, it } from "vitest";
import { classifyUpload } from "@/app/intake/readDocumentFile";

// The upload router decides how each file is read. A wrong route is a UX and
// integrity bug: an HTML file read as raw text leaks tags into the evidence; a
// spreadsheet read as text is garbage; a .doc must decline, not silently mangle.
// These pin the routing so a future format addition can't break the boundary.

const f = (name: string, type = "") => ({ name, type });

describe("classifyUpload", () => {
  it("routes PDFs by extension and by MIME", () => {
    expect(classifyUpload(f("depo.pdf"))).toBe("pdf");
    expect(classifyUpload(f("noext", "application/pdf"))).toBe("pdf");
  });

  it("routes OOXML spreadsheets (.xlsx/.xlsm) before docx (both are OOXML)", () => {
    expect(classifyUpload(f("wages.xlsx"))).toBe("xlsx");
    expect(classifyUpload(f("macro.xlsm"))).toBe("xlsx");
    expect(
      classifyUpload(f("wages", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")),
    ).toBe("xlsx");
  });

  it("routes Word .docx", () => {
    expect(classifyUpload(f("report.docx"))).toBe("docx");
    expect(
      classifyUpload(f("report", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")),
    ).toBe("docx");
  });

  it("routes HTML before the generic text path (so tags never leak)", () => {
    // text/html starts with "text/" — must be caught as html, not text.
    expect(classifyUpload(f("page.html", "text/html"))).toBe("html");
    expect(classifyUpload(f("page.htm"))).toBe("html");
    expect(classifyUpload(f("doc", "text/html"))).toBe("html");
  });

  it("routes images (for OCR) by extension and MIME", () => {
    for (const ext of [".png", ".jpg", ".jpeg", ".webp", ".tiff", ".bmp", ".gif"]) {
      expect(classifyUpload(f(`scan${ext}`))).toBe("image");
    }
    expect(classifyUpload(f("photo", "image/png"))).toBe("image");
  });

  it("declines legacy formats (.doc/.rtf and binary .xls/.xlsb) rather than mis-reading them", () => {
    expect(classifyUpload(f("old.doc"))).toBe("legacy");
    expect(classifyUpload(f("notes.rtf"))).toBe("legacy");
    // Legacy binary Excel is no longer parsed (only OOXML .xlsx/.xlsm) — decline
    // it cleanly instead of mis-reading, even when it carries the .xls MIME.
    expect(classifyUpload(f("wages.xls"))).toBe("legacy");
    expect(classifyUpload(f("wages.xls", "application/vnd.ms-excel"))).toBe("legacy");
    expect(classifyUpload(f("data.xlsb"))).toBe("legacy");
  });

  it("routes the plain-text family", () => {
    for (const ext of [".txt", ".md", ".csv", ".tsv", ".json", ".xml", ".yaml", ".log"]) {
      expect(classifyUpload(f(`data${ext}`))).toBe("text");
    }
    expect(classifyUpload(f("notes", "text/plain"))).toBe("text");
    expect(classifyUpload(f("config", "application/json"))).toBe("text");
  });

  it("marks genuinely unknown binaries unsupported", () => {
    expect(classifyUpload(f("mystery.bin", "application/octet-stream"))).toBe("unsupported");
    expect(classifyUpload(f("archive.zip", "application/zip"))).toBe("unsupported");
  });

  it("is case-insensitive on the extension", () => {
    expect(classifyUpload(f("DEPO.PDF"))).toBe("pdf");
    expect(classifyUpload(f("Scan.JPG"))).toBe("image");
  });
});
