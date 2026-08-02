// A one-click worked example for the builder's empty state. Plain data (no
// imports) so it's trivially client-safe. It reuses the canonical sample
// narrative (Alvarez v. Brightline / Dana Whitfield) but is shaped to the
// builder's model — each evidence unit tagged to exactly ONE section — so a
// first-time visitor can load it, Build & preview, and download a full grounded
// report + disclosure record without typing anything. Every line is the
// "expert's" own supplied content; the tool still originates nothing.

export interface ExampleUnit {
  id: string;
  content: string;
  location: string;
  sectionKey: string;
}

export const WORKED_EXAMPLE = {
  matter: "Alvarez v. Brightline Mechanical Servs., No. 2025-CV-04417",
  retainingCounsel: "Hahn & Castro LLP (Plaintiff)",
  expertRole: "Vocational rehabilitation & earning-capacity expert",
  fullName: "Dana M. Whitfield, M.S., CRC, ABVE/D",
  credentials:
    "Certified Rehabilitation Counselor (CRC); Diplomate, American Board of Vocational Experts (ABVE/D); M.S. Rehabilitation Counseling",
  compensationStatement:
    "$295/hour for file review and report preparation; $450/hour for deposition and trial testimony. Compensation is not contingent on the opinions expressed or the outcome of the matter.",
  priorTestimony:
    "Reyes v. Coastal Freight (2024) — deposition & trial\nIn re Okafor (2023) — deposition",
  units: [
    {
      id: "E1",
      content:
        "Plaintiff worked 14 years as a commercial HVAC installer earning a journeyman wage before the date of injury.",
      location: "Pl. deposition, p.18 ln.4–12",
      sectionKey: "background",
    },
    {
      id: "E2",
      content:
        "Treating physician assigned permanent restrictions limiting the plaintiff to light-duty work: no lifting over 20 pounds and no repetitive overhead reaching.",
      location: "Med. records, Dr. Okonkwo, 03/14/2025",
      sectionKey: "functional_capacity",
    },
    {
      id: "E3",
      content:
        "Transferable-skills analysis identifies blueprint reading, HVAC system diagnostics, and customer service as skills transferable to sedentary and light technical roles.",
      location: "TSA worksheet, p.3",
      sectionKey: "transferable_skills",
    },
    {
      id: "E4",
      content:
        "A labor-market survey of the regional metropolitan area identified seven employers with suitable light-duty openings paying $19–$24 per hour.",
      location: "Labor-market-survey log, employers 1–7",
      sectionKey: "labor_market_survey",
    },
    {
      id: "E5",
      content:
        "Plaintiff's pre-injury earnings averaged $72,400 per year across 2021–2024 per W-2 records.",
      location: "W-2 summary, Ex. 11",
      sectionKey: "earning_capacity",
    },
    {
      id: "E6",
      content:
        "Post-injury earning capacity is estimated at $41,000 per year based on the suitable occupations identified in the labor-market survey.",
      location: "Earning-capacity analysis, ¶5",
      sectionKey: "loss_of_earning_capacity",
    },
    {
      id: "E7",
      content:
        "Within a reasonable degree of vocational-rehabilitation certainty, the plaintiff has sustained a permanent loss of earning capacity of approximately $31,400 per year.",
      location: "Expert's summary of opinions, ¶2",
      sectionKey: "opinions",
    },
    {
      id: "E8",
      content:
        "The loss figure is the difference between pre-injury average earnings of $72,400 and a post-injury capacity of $41,000, per the earning-capacity analysis.",
      location: "Earning-capacity analysis, ¶6",
      sectionKey: "basis_and_reasons",
    },
    {
      id: "E9",
      content:
        "Records reviewed include the deposition of J. Alvarez, the medical records of Dr. Okonkwo, the transferable-skills worksheet, the labor-market-survey log, and the W-2 summary (Ex. 11).",
      location: "Records-reviewed index, p.1",
      sectionKey: "facts_or_data_considered",
    },
    {
      id: "E10",
      content:
        "Exhibit A is the labor-market survey summary table and Exhibit B is the pre- versus post-injury earnings comparison.",
      location: "Exhibit list, p.1",
      sectionKey: "exhibits",
    },
  ] as ExampleUnit[],
};
