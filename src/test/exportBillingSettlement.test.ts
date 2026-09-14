import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  parseReportInput: vi.fn(),
  assembleUserReport: vi.fn(),
  exportDocx: vi.fn(),
  exportPdf: vi.fn(),
  getCurrentUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  getSubscriptionFor: vi.fn(),
  getCreditBalance: vi.fn(),
  spendCredit: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@/lib/report/schema", () => ({ parseReportInput: mocks.parseReportInput }));
vi.mock("@/lib/report/assemble", () => ({ assembleUserReport: mocks.assembleUserReport }));
vi.mock("@/lib/export/docx", () => ({ exportReportDocx: mocks.exportDocx }));
vi.mock("@/lib/export/pdf", () => ({
  exportReportPdf: mocks.exportPdf,
  UnsupportedGlyphError: class UnsupportedGlyphError extends Error {
    characters: string[] = [];
  },
}));
vi.mock("@/lib/flags/featureFlags", () => ({ isLiveDraftingEnabled: () => false }));
vi.mock("@/lib/draft/liveClient", () => ({ getLiveClientOrNull: vi.fn() }));
vi.mock("@/lib/billing/stripe", () => ({ isBillingLive: () => true }));
vi.mock("@/lib/auth/user", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/supabase/serverClient", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));
vi.mock("@/lib/billing/subscription", () => ({
  getSubscriptionFor: mocks.getSubscriptionFor,
}));
vi.mock("@/lib/billing/featureGates", () => ({ deriveTier: () => "free" }));
vi.mock("@/lib/billing/credits", () => ({
  getCreditBalance: mocks.getCreditBalance,
  spendCredit: mocks.spendCredit,
}));
vi.mock("@/lib/http/rateLimit", () => ({ createRateLimiter: () => () => false }));
vi.mock("@/lib/http/request", () => ({
  clientIp: () => "synthetic-test",
  readBoundedJson: vi.fn(async () => ({ ok: true, value: {} })),
}));
vi.mock("@/lib/log/logger", () => ({ logError: mocks.logError }));

import { POST } from "@/app/api/report/export/route";

const parsedData = {
  meta: {
    matter: "Synthetic v. Example",
    retainingCounsel: "Example Counsel",
    expertRole: "Vocational expert",
  },
  profile: {
    fullName: "Alex Example",
    credentials: "CRC",
    publicationsLast10yr: [],
    priorTestimonyLast4yr: [],
    compensationStatement: "$300/hr",
  },
  evidence: [
    { id: "E1", content: "Synthetic finding.", location: "Synthetic source p. 1" },
  ],
  sections: [{ key: "opinions", evidenceIds: ["E1"] }],
  noAi: true,
};

function request() {
  return new Request("https://disclosed.example/api/report/export?format=docx", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.parseReportInput.mockReturnValue({ success: true, data: parsedData });
  mocks.getCurrentUser.mockResolvedValue({ id: "30000000-0000-4000-8000-000000000003" });
  mocks.createSupabaseServerClient.mockResolvedValue({ synthetic: true });
  mocks.getSubscriptionFor.mockResolvedValue(null);
  mocks.assembleUserReport.mockResolvedValue({
    meta: parsedData.meta,
    profile: parsedData.profile,
    sections: [
      {
        title: "Opinions",
        isProfile: false,
        grounding: {
          isClean: true,
          ungroundedSentences: [],
          invalidCitationSentences: [],
        },
      },
    ],
    exportSections: [],
    appendix: {},
    reconstructions: [],
    readiness: {},
  });
  mocks.getCreditBalance.mockResolvedValue(0);
  mocks.spendCredit.mockResolvedValue("debited");
  mocks.exportPdf.mockResolvedValue(Buffer.from("synthetic-pdf"));
});

describe("paid export settlement order", () => {
  it("renders successfully before spending a credit", async () => {
    const order: string[] = [];
    mocks.exportDocx.mockImplementation(async () => {
      order.push("render");
      return Buffer.from("synthetic-docx");
    });
    mocks.spendCredit.mockImplementation(async () => {
      order.push("spend");
      return "debited";
    });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(order).toEqual(["render", "spend"]);
    expect(mocks.spendCredit).toHaveBeenCalledTimes(1);
  });

  it("never spends when rendering fails", async () => {
    mocks.exportDocx.mockRejectedValue(new Error("synthetic renderer failure"));

    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(mocks.spendCredit).not.toHaveBeenCalled();
    expect(mocks.getCreditBalance).not.toHaveBeenCalled();
  });

  it("still returns the paid file if the post-spend balance refresh fails", async () => {
    mocks.exportDocx.mockResolvedValue(Buffer.from("synthetic-docx"));
    mocks.getCreditBalance
      .mockResolvedValueOnce(1)
      .mockRejectedValueOnce(new Error("synthetic balance refresh failure"));

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(mocks.spendCredit).toHaveBeenCalledTimes(1);
    expect(response.headers.get("x-report-credits-remaining")).toBeNull();
    expect(mocks.logError).toHaveBeenCalledWith(
      "credits.balance_refresh_failed",
      expect.any(Error),
      expect.objectContaining({ userId: "30000000-0000-4000-8000-000000000003" }),
    );
  });

  it("charges the successful peer when a concurrent same-report render fails", async () => {
    let rejectFirst!: (reason?: unknown) => void;
    let markFirstStarted!: () => void;
    const firstStarted = new Promise<void>((resolve) => { markFirstStarted = resolve; });
    const firstRender = new Promise<Buffer>((_resolve, reject) => { rejectFirst = reject; });
    let renderCall = 0;
    mocks.exportDocx.mockImplementation(async () => {
      renderCall += 1;
      if (renderCall === 1) {
        markFirstStarted();
        return firstRender;
      }
      return Buffer.from("successful-concurrent-render");
    });

    const failingRequest = POST(request());
    await firstStarted;
    const successfulResponse = await POST(request());
    expect(successfulResponse.status).toBe(200);
    expect(mocks.spendCredit).toHaveBeenCalledTimes(1);
    expect(mocks.spendCredit).toHaveBeenLastCalledWith(
      "30000000-0000-4000-8000-000000000003",
      expect.stringMatching(/^[0-9a-f]{64}$/),
    );

    rejectFirst(new Error("synthetic concurrent renderer failure"));
    const failedResponse = await failingRequest;
    expect(failedResponse.status).toBe(500);
    expect(mocks.spendCredit).toHaveBeenCalledTimes(1);
  });
});
