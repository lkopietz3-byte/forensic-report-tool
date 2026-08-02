// Pure merge rules for repeat waitlist submissions. A prospect often joins the
// lightweight list first and submits a richer design-partner application later.
// The second submission must upgrade the first instead of being silently
// discarded, while a later one-field signup must never erase an application.

export type WaitlistRecord = {
  email: string;
  discipline: string | null;
  source: string | null;
  role: string | null;
  reports_per_year: string | null;
  pain_point: string | null;
  ai_experience: string | null;
  must_have: string | null;
  notes: string | null;
};

export type IncomingWaitlistRecord = {
  email: string;
  discipline?: string;
  source?: string;
  role?: string;
  reportsPerYear?: string;
  painPoint?: string;
  aiExperience?: string;
  mustHave?: string;
  notes?: string;
};

function present(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function preferNew(
  incoming: string | null | undefined,
  existing: string | null | undefined,
): string | null {
  return present(incoming) ?? present(existing);
}

export function isDesignPartnerSource(
  source: string | null | undefined,
): boolean {
  return source === "for-experts" || Boolean(source?.startsWith("for-experts-"));
}

function preferredSource(
  incoming: string | null | undefined,
  existing: string | null | undefined,
): string | null {
  const next = present(incoming);
  const current = present(existing);
  if (isDesignPartnerSource(next)) return next;
  if (isDesignPartnerSource(current)) return current;
  return next ?? current;
}

export function mergeWaitlistRecord(
  existing: Partial<WaitlistRecord> | null | undefined,
  incoming: IncomingWaitlistRecord,
): WaitlistRecord {
  return {
    email: incoming.email,
    discipline: preferNew(incoming.discipline, existing?.discipline),
    source: preferredSource(incoming.source, existing?.source),
    role: preferNew(incoming.role, existing?.role),
    reports_per_year: preferNew(
      incoming.reportsPerYear,
      existing?.reports_per_year,
    ),
    pain_point: preferNew(incoming.painPoint, existing?.pain_point),
    ai_experience: preferNew(incoming.aiExperience, existing?.ai_experience),
    must_have: preferNew(incoming.mustHave, existing?.must_have),
    notes: preferNew(incoming.notes, existing?.notes),
  };
}
