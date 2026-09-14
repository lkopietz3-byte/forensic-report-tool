import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import type { SavedReportSummary } from "./SavedReportsPanel";

const responseSchema = z.object({ reports: z.array(z.object({
  id: z.string().uuid(), matter: z.string(), status: z.string(),
  createdAt: z.string().refine(value => Number.isFinite(Date.parse(value))),
})).max(50).refine(rows => new Set(rows.map(row => row.id)).size === rows.length) });
type FetchList = (url: string, init: RequestInit, timeout: number) => Promise<Response>;

export function useSavedReports(enabled: boolean, fetchList: FetchList) {
  const [reports, setReports] = useState<SavedReportSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    if (!enabled) return;
    const request = ++generation.current;
    setStatus("loading");
    try {
      const response = await fetchList("/api/report/list", {}, 30_000);
      if (response.status !== 200) throw new Error("Saved list unavailable");
      const next = responseSchema.parse(await response.json());
      if (request !== generation.current) return;
      setReports(next.reports);
      setStatus("ready");
    } catch {
      if (request === generation.current) setStatus("unavailable");
    }
  }, [enabled, fetchList]);
  const invalidate = useCallback(() => { generation.current++; }, []);
  useEffect(() => {
    void refresh();
    return invalidate;
  }, [refresh, invalidate]);
  return { reports, setReports, status, refresh };
}
