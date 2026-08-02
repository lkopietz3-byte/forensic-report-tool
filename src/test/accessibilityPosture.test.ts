import { describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";

const APP = path.join(process.cwd(), "src", "app");

async function read(...parts: string[]) {
  return fs.readFile(path.join(APP, ...parts), "utf8");
}

describe("accessibility posture", () => {
  it("declares the document language and a visible keyboard-focus treatment", async () => {
    const [layout, css] = await Promise.all([
      read("layout.tsx"),
      read("globals.css"),
    ]);
    expect(layout).toContain('<html lang="en">');
    for (const selector of [
      "a:focus-visible",
      "button:focus-visible",
      "input:focus-visible",
      "textarea:focus-visible",
      "select:focus-visible",
    ]) {
      expect(css).toContain(selector);
    }
  });

  it("keeps every design-partner field programmatically labeled", async () => {
    const form = await read("_components", "ExpertInterest.tsx");
    for (const id of [
      "emailId",
      "roleId",
      "disciplineId",
      "volumeId",
      "painId",
      "aiId",
      "trustId",
    ]) {
      expect(form).toContain(`htmlFor={${id}}`);
      expect(form).toContain(`id={${id}}`);
    }
    expect(form).toContain('autoComplete="email"');
    expect(form).toContain('autoComplete="name"');
    expect(form).toContain('role="alert"');
    expect(form).toContain('aria-live="assertive"');
  });

  it("gives intake errors, uploads, text, and the data boundary accessible names", async () => {
    const intake = await read("intake", "IntakeFlow.tsx");
    expect(intake).toMatch(/role="alert"[\s\S]{0,80}aria-live="assertive"/);
    expect(intake).toContain('aria-label="Upload a document"');
    expect(intake).toContain("htmlFor={sourceId}");
    expect(intake).toContain("htmlFor={textId}");
    expect(intake).toContain("htmlFor={boundaryId}");
    expect(intake).toContain("id={boundaryId}");
  });

  it("does not put the AI help button inside the checkbox label", async () => {
    const workspace = await read("workspace", "ReportBuilder.tsx");
    expect(workspace).toContain("id={aiAssistanceId}");
    expect(workspace).toContain("htmlFor={aiAssistanceId}");
    expect(workspace).toContain("aria-describedby={aiAssistanceDescriptionId}");
    expect(workspace).toMatch(
      /htmlFor=\{aiAssistanceId\}[\s\S]{0,180}<\/label>\{" "\}[\s\S]{0,80}<InfoTip text="On: a model arranges/,
    );
  });

  it("labels each deliverable control without nesting a button in its label", async () => {
    const options = await read("workspace", "DeliverableOptions.tsx");
    expect(options).toContain('aria-label="Deliverable formatting options"');
    expect(options).toContain('htmlFor="opt-line-numbers"');
    expect(options).toContain('id={`opt-${key}`}');
    expect(options).toContain('htmlFor={`opt-${key}`}');
    expect(options).toMatch(
      /htmlFor="opt-line-numbers">Line numbering<\/label>\{" "\}[\s\S]{0,80}<InfoTip/,
    );
  });
});
