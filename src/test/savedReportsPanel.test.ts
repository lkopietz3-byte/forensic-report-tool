import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SavedReportsPanel, type SavedReportSummary } from "@/app/workspace/SavedReportsPanel";

const reports: SavedReportSummary[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    matter: "Synthetic v. Example",
    createdAt: "2026-01-02T15:04:05.000Z",
    status: "draft",
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    matter: "Example v. Fictional",
    createdAt: "2026-01-03T15:04:05.000Z",
    status: "draft",
  },
];

function render(overrides: Partial<Parameters<typeof SavedReportsPanel>[0]> = {}) {
  return renderToStaticMarkup(createElement(SavedReportsPanel, {
    reports,
    listStatus: "ready",
    onRefresh: vi.fn(),
    busy: null,
    loadingReportId: null,
    failedLoadId: null,
    onOpen: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  }));
}

describe("saved-report recovery UI", () => {
  it("renders an explicit retry without implying that the current workspace changed", () => {
    const html = render({ failedLoadId: reports[0]!.id });

    expect(html).toContain("Try again");
    expect(html).toContain("Couldn&#x27;t open it. Your current workspace was not changed.");
    expect(html).toContain("aria-label=\"Try again saved report Synthetic v. Example\"");
  });

  it("marks only the selected report as opening", () => {
    const html = render({ busy: "load", loadingReportId: reports[1]!.id });

    expect(html).toContain("aria-label=\"Opening… saved report Example v. Fictional\"");
    expect(html).toContain("aria-label=\"Open saved report Synthetic v. Example\"");
  });
});

it("exposes refresh and distinguishes unavailable from verified empty", () => {
  expect(render({ reports: [], listStatus: "ready" })).toContain("No saved reports found.");
  const unavailable = render({ reports: [], listStatus: "unavailable" });
  expect(unavailable).toContain("Could not refresh saved reports");
  expect(unavailable).not.toContain("No saved reports found.");
  expect(unavailable).toContain("Refresh saved reports");
});
it("retains earlier rows while unavailable and disables row actions during refresh", () => {
  expect(render({ listStatus: "unavailable" })).toContain("Synthetic v. Example");
  const loading = render({ listStatus: "loading" });
  expect(loading).toContain("Refreshing…");
  expect((loading.match(/disabled=""/g) ?? []).length).toBe(5);
});
