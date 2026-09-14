export interface SavedReportSummary {
  id: string;
  matter: string;
  createdAt: string;
  status: string;
}

export function SavedReportsPanel({
  reports,
  listStatus,
  onRefresh,
  busy,
  loadingReportId,
  failedLoadId,
  onOpen,
  onDelete,
}: {
  reports: SavedReportSummary[];
  listStatus: "loading" | "ready" | "unavailable";
  onRefresh: () => void;
  busy: string | null;
  loadingReportId: string | null;
  failedLoadId: string | null;
  onOpen: (id: string) => void;
  onDelete: (report: SavedReportSummary) => void;
}) {
  return (
    <section className="lift rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-800">Your saved reports</h2>
        <button type="button" onClick={onRefresh} disabled={busy !== null || listStatus === "loading"}
          className="min-h-11 rounded-lg border border-slate-300 px-3 text-xs font-semibold disabled:opacity-50">
          {listStatus === "loading" ? "Refreshing…" : "Refresh saved reports"}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-600">Latest 50 saved reports. Refreshing leaves your current workspace unchanged.</p>
      {listStatus === "unavailable" && <p role="alert" className="mt-2 text-sm text-red-700">Could not refresh saved reports. Any rows shown are from the last successful check. Try refreshing again; if your session ended, sign in again.</p>}
      {listStatus === "loading" && <p role="status" className="mt-2 text-sm text-slate-600">Checking saved reports…</p>}
      {listStatus === "ready" && reports.length === 0 && <p role="status" className="mt-2 text-sm text-slate-600">No saved reports found.</p>}
      {listStatus === "ready" && reports.length > 0 && <p role="status" className="mt-2 text-xs text-slate-600">Saved list updated.</p>}
      <p className="mt-2 text-xs text-slate-600">Disclosure records are append-only while retained. Confirming permanent deletion also removes that report&apos;s saved disclosure record.</p>
      <ul className="mt-3 divide-y divide-slate-100">
        {reports.map((report) => {
          const isOpening = busy === "load" && loadingReportId === report.id;
          const didFail = failedLoadId === report.id;
          const action = isOpening ? "Opening…" : didFail ? "Try again" : "Open";

          return (
            <li key={report.id} className="flex items-start justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{report.matter}</p>
                <p className="text-xs text-slate-500">
                  {new Date(report.createdAt).toLocaleString()} · {report.status}
                </p>
                {didFail && (
                  <p className="mt-1 text-xs font-medium text-red-700" role="status">
                    Couldn&apos;t open it. Your current workspace was not changed.
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => onOpen(report.id)}
                  disabled={busy !== null || listStatus === "loading"}
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  aria-label={`${action} saved report ${report.matter}`}
                >
                  {action}
                </button>
                <button
                  onClick={() => onDelete(report)}
                  disabled={busy !== null || listStatus === "loading"}
                  className="min-h-11 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  aria-label={`Delete saved report ${report.matter}`}
                >
                  {busy === "delete" ? "Deleting…" : "Delete"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
