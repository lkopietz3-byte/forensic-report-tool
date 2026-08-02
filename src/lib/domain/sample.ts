import { AuditLog } from "./audit";
import { checkGrounding, type GroundingResult } from "./grounding";
import { generateDisclosureAppendix } from "./disclosure";
import {
  reconstructAllOpinions,
  type OpinionReconstruction,
} from "./reconstruction";
import { assessReadiness, type ReadinessVerdict } from "./readiness";
import { validateRule26, type Rule26Result } from "./rule26";
import {
  ACCIDENT_RECONSTRUCTION_PREVIEW_TEMPLATE,
  FORENSIC_ENGINEERING_PREVIEW_TEMPLATE,
  VOCREHAB_TEMPLATE,
} from "./template";
import type {
  DisciplineTemplate,
  EvidenceUnit,
  ExhibitTable,
  ExpertProfile,
  ReportSection,
  ReportSectionKey,
  ReportMeta,
} from "./types";

// A fully worked sample run through the real domain pipeline — grounding check,
// append-only audit log, and the generated AI-Disclosure Appendix. Themed as a
// forensic vocational-rehabilitation earning-capacity report (the leading
// beachhead discipline) and structured on the RAPEL framework via the draft
// VOCREHAB_TEMPLATE. Nothing here is invented at render time: the disclosure
// appendix and grounding status are computed from the data below, exactly as the
// product would compute them from a real case. Fictional matter for demonstration.

const REPORT_ID = "sample-report";
const MODEL = "claude-sonnet-4-5";
const MODEL_VERSION = "claude-sonnet-4-5-20250929";

export const SAMPLE_META: ReportMeta = {
  id: REPORT_ID,
  caseId: "sample-case",
  discipline: "Forensic Vocational Rehabilitation",
  templateVersion: VOCREHAB_TEMPLATE.version,
  matter: "Alvarez v. Brightline Mechanical Servs., No. 2025-CV-04417",
  retainingCounsel: "Hahn & Castro LLP (Plaintiff)",
  expertRole: "Vocational rehabilitation & earning-capacity expert",
};

export const SAMPLE_PROFILE: ExpertProfile = {
  fullName: "Dana M. Whitfield, M.S., CRC, ABVE/D",
  credentials:
    "Certified Rehabilitation Counselor (CRC); Diplomate, American Board of Vocational Experts (ABVE/D); M.S. Rehabilitation Counseling",
  publicationsLast10yr: [
    "Whitfield, D. (2021). Transferable Skills Analysis in Post-Injury Earning Capacity. J. Forensic Vocational Analysis, 21(2).",
  ],
  priorTestimonyLast4yr: [
    "Reyes v. Coastal Freight (2024) — deposition & trial",
    "In re Okafor (2023) — deposition",
  ],
  compensationStatement:
    "$295/hour for file review and report preparation; $450/hour for deposition and trial testimony. Compensation is not contingent on the opinions expressed or the outcome of the matter.",
};

export const SAMPLE_EVIDENCE: EvidenceUnit[] = [
  { id: "ev_engage", inputId: "in_1", content: "Engagement letter retaining the expert to evaluate post-injury employability and earning capacity", location: "Engagement letter ¶2" },
  { id: "ev_depo_job", inputId: "in_2", content: "Plaintiff deposition — 47 years old; 14 years as a commercial HVAC installer; rooftop unit installation and overhead ductwork", location: "Depo. p.18 ln.4–12" },
  { id: "ev_interview", inputId: "in_3", content: "Vocational interview — persistent low-back pain limiting standing, bending, and overhead reaching; no return to work since injury", location: "Voc. interview p.2" },
  { id: "ev_med", inputId: "in_4", content: "Treating physician permanent restrictions: no lifting over 25 lbs; no sustained overhead work", location: "Dr. Reyes, M.D. — Permanent Restrictions p.3" },
  { id: "ev_wage", inputId: "in_5", content: "Pre-injury W-2 earnings averaging approximately $72,400/yr, 2019–2022", location: "W-2 records 2019–2022" },
  { id: "ev_voctest", inputId: "in_6", content: "WRAT-5: Word Reading SS 98 (GE 10.1); Math Computation SS 95 (GE 9.2)", location: "Voc. eval. p.5" },
  { id: "ev_tsa", inputId: "in_7", content: "OASYS transferable-skills analysis: dispatch, parts/inventory, customer-service, estimating occupations", location: "OASYS TSA run, 2026-05-12" },
  { id: "ev_lms", inputId: "in_8", content: "Labor market survey of commuting area: dispatcher/CSR/planner openings $44,000–$52,000", location: "Labor market survey, Tbl. 2" },
  { id: "ev_onet", inputId: "in_9", content: "O*NET-SOC classifications and BLS OEWS (May 2024) occupational wage data for target occupations", location: "O*NET-SOC / BLS OEWS, May 2024" },
  { id: "ev_rehab", inputId: "in_10", content: "Mechanical-estimating certificate: ~4 months, ~$6,200 tuition and materials", location: "Rehab plan worksheet" },
];

// Section drafts use the real [[E:<id>]] citation contract. Each section is fed a
// closed-world subset of evidence ids (mirrored into the audit log below), so the
// grounding check runs against exactly what the model was allowed to see. The
// ordering follows VOCREHAB_TEMPLATE (RAPEL).
interface SampleSectionSpec {
  key: ReportSectionKey;
  title: string;
  fedEvidenceIds: string[];
  draftText: string;
}

const SECTION_SPECS: SampleSectionSpec[] = [
  {
    key: "scope_of_assignment",
    title: "Referral and Assignment",
    fedEvidenceIds: ["ev_engage"],
    draftText:
      "Hahn & Castro LLP retained the expert to evaluate Mr. Alvarez's post-injury employability, vocational options, and earning capacity following the work-related injury to his lumbar spine [[E:ev_engage]]. The assignment was limited to vocational and earning-capacity questions and did not extend to any opinion on medical causation, impairment rating, or the present value of any loss [[E:ev_engage]]. Each opinion in this report is offered to a reasonable degree of vocational-rehabilitation certainty and is subject to amendment should additional records become available [[E:ev_engage]].",
  },
  {
    key: "summary_of_opinions",
    title: "Summary of Opinions",
    fedEvidenceIds: ["ev_med", "ev_tsa", "ev_wage", "ev_lms"],
    draftText:
      "The permanent restriction against lifting over 25 pounds and sustained overhead work removes Mr. Alvarez's pre-injury occupation as a commercial HVAC installer from his reach [[E:ev_med]]. He retains the capacity for full-time work at the sedentary-to-light exertional level, with skills that transfer most readily to service-dispatch, parts-and-inventory, and customer-service occupations identified through a transferable-skills analysis [[E:ev_tsa]]. His documented pre-injury earning capacity averaged approximately $72,400 per year [[E:ev_wage]], while the directly accessible post-injury occupations surveyed in his labor market pay approximately $44,000 to $52,000 per year [[E:ev_lms]]. [Expert input needed: state the adopted post-injury earning capacity and the resulting annual loss of earning capacity; the present value of the lifetime loss is to be calculated by the retained economist.]",
  },
  {
    key: "background",
    title: "Identifying Data and Background",
    fedEvidenceIds: ["ev_depo_job", "ev_wage"],
    draftText:
      "Mr. Alvarez is 47 years old and testified that he worked as a commercial HVAC installer for approximately fourteen years before the incident, a skilled trade classified at the medium-to-heavy exertional level [[E:ev_depo_job]]. His reported duties included rooftop unit installation and overhead ductwork requiring sustained lifting and overhead reaching [[E:ev_depo_job]]. His pre-injury W-2 earnings averaged approximately $72,400 per year over the four years preceding the injury [[E:ev_wage]].",
  },
  {
    key: "records_reviewed",
    title: "Records Reviewed",
    fedEvidenceIds: ["ev_engage", "ev_depo_job", "ev_interview", "ev_med", "ev_wage", "ev_voctest", "ev_tsa", "ev_lms", "ev_onet", "ev_rehab"],
    draftText:
      "Engagement letter and scope of retention [[E:ev_engage]].\nPlaintiff deposition testimony [[E:ev_depo_job]].\nVocational interview notes [[E:ev_interview]].\nTreating physician's permanent work restrictions [[E:ev_med]].\nPre-injury wage and W-2 records [[E:ev_wage]].\nVocational testing results [[E:ev_voctest]].\nTransferable-skills analysis output [[E:ev_tsa]].\nLabor market survey of the commuting area [[E:ev_lms]].\nO*NET and BLS occupational wage data [[E:ev_onet]].\nRetraining program cost and duration estimate [[E:ev_rehab]].",
  },
  {
    key: "interview",
    title: "Interview and Vocational Evaluation",
    fedEvidenceIds: ["ev_interview", "ev_med"],
    draftText:
      "During the clinical vocational interview, Mr. Alvarez reported persistent low-back pain that limits prolonged standing, repetitive bending, and overhead reaching [[E:ev_interview]]. He stated that he has not returned to any paid work since the injury and completes household activities only with self-pacing and rest breaks [[E:ev_interview]]. These self-reported tolerances are recorded as self-report and are consistent with the permanent restrictions documented by the treating physician [[E:ev_med]].",
  },
  {
    key: "vocational_testing",
    title: "Vocational Testing",
    fedEvidenceIds: ["ev_voctest"],
    draftText:
      "The Wide Range Achievement Test, Fifth Edition (WRAT-5) was administered to assess functional academic skills relevant to retraining and reentry [[E:ev_voctest]]. Mr. Alvarez obtained a Word Reading standard score of 98, at approximately a 10.1 grade equivalent, and a Math Computation standard score of 95, at approximately a 9.2 grade equivalent [[E:ev_voctest]]. These results place his academic skills in the average range and indicate that short-term vocational retraining is feasible [[E:ev_voctest]].",
  },
  {
    key: "functional_capacity",
    title: "Functional and Residual Capacity",
    fedEvidenceIds: ["ev_med"],
    draftText:
      "For purposes of this evaluation the expert adopts the permanent work restrictions imposed by the treating physician: no lifting over 25 pounds and no sustained overhead work [[E:ev_med]]. As a vocational-rehabilitation counselor the expert does not render medical opinions, but accepts these restrictions as the functional baseline for the analysis that follows [[E:ev_med]]. Translated into vocational terms, these restrictions limit Mr. Alvarez to work at or below the light exertional level and preclude the sustained overhead reaching characteristic of HVAC installation [[E:ev_med]]. [Expert input needed: state whether any pre-existing or coexisting condition affects the pre-injury baseline and, if so, how the resulting vocational loss is apportioned between the work injury and any prior condition.]",
  },
  {
    key: "transferable_skills",
    title: "Transferable Skills Analysis",
    fedEvidenceIds: ["ev_tsa", "ev_onet"],
    draftText:
      "A transferable-skills analysis was conducted in the OASYS occupational access system, matching the Dictionary of Occupational Titles (DOT) worker-trait factors of Mr. Alvarez's past relevant work, namely its specific vocational preparation (SVP), general educational development (GED), aptitudes, and work fields, against the universe of occupations and filtering by his adopted restrictions [[E:ev_tsa]]. The analysis identified service-dispatch, parts-and-inventory, customer-service, and maintenance-scheduling occupations as closely transferable and within his residual capacity, with cost-estimating and technical-sales occupations transferable given brief additional training [[E:ev_tsa]]. Each identified occupation's DOT profile was cross-walked to its current O*NET-SOC classification, and the wage data verified against Bureau of Labor Statistics figures [[E:ev_onet]]. The transferable-skills detail, with SVP and exertional levels, is set out in Exhibit B [[E:ev_tsa]].",
  },
  {
    key: "labor_market_survey",
    title: "Labor Market Survey",
    fedEvidenceIds: ["ev_lms"],
    draftText:
      "To assess placeability, a labor market survey was conducted within Mr. Alvarez's commuting area, defined as an approximately 35-mile radius of his residence [[E:ev_lms]]. Current openings were researched through online job boards and employer websites, and selected employers were contacted directly to verify wages and physical requirements [[E:ev_lms]]. The survey returned dispatcher, parts-and-inventory, and customer-service openings paying approximately $44,000 to $52,000 per year, each documented with its source and date in Exhibit A [[E:ev_lms]]. [Expert input needed: state the expert's placeability judgment — whether this evaluee, given his age, permanent restrictions, and single-trade work history, would realistically be hired for these openings in the local market, as distinct from the openings merely existing.]",
  },
  {
    key: "rehabilitation_plan",
    title: "Rehabilitation Plan",
    fedEvidenceIds: ["ev_rehab"],
    draftText:
      "The recommended rehabilitation plan consists of vocational counseling, a short certificate program in mechanical estimating, job-seeking-skills training, and structured job-placement assistance [[E:ev_rehab]]. The estimating certificate is estimated at approximately four months and $6,200 in tuition and materials, and would support transition into higher-paying estimator roles over time [[E:ev_rehab]]. Even with these services, Mr. Alvarez's realistic near-term reemployment is into occupations paying materially less than his pre-injury skilled-trade wage [[E:ev_rehab]].",
  },
  {
    key: "earning_capacity",
    title: "Pre-Injury vs. Post-Injury Earning Capacity",
    fedEvidenceIds: ["ev_wage", "ev_lms", "ev_onet"],
    draftText:
      "Pre-injury, Mr. Alvarez possessed the capacity to earn approximately $72,400 per year as an experienced commercial HVAC installer, consistent with the upper range of prevailing wages for that trade [[E:ev_wage]]. Post-injury, within the occupations that remain directly accessible given his adopted restrictions and transferable skills, his earning capacity ranges from approximately $44,000 to $52,000 per year [[E:ev_lms]]. These ranges are corroborated by O*NET-SOC classifications and Bureau of Labor Statistics occupational wage data for the relevant occupations [[E:ev_onet]]. Earning capacity is expressed as a range because it reflects the band of occupations a worker can realistically access and perform, not a single guaranteed wage [[E:ev_lms]].",
  },
  {
    key: "labor_force_participation",
    title: "Labor Force Participation and Work-Life",
    fedEvidenceIds: ["ev_med", "ev_interview"],
    draftText:
      "The adopted restrictions do not preclude full-time work within Mr. Alvarez's residual capacity [[E:ev_med]]. He reported both the intention and the ability to work full time in a suitable, accommodated role [[E:ev_interview]]. [Expert input needed: state whether and how the evaluee's work-life participation or work-life expectancy is reduced, and identify the source relied on (for example, a work-life-expectancy table such as Skoog-Ciecka-Krueger or BLS increment-decrement data), or expressly defer the work-life reduction to the retained economist.]",
  },
  {
    key: "loss_of_earning_capacity",
    title: "Loss of Earning Capacity",
    fedEvidenceIds: ["ev_wage", "ev_lms"],
    draftText:
      "The documented pre-injury earning capacity averaged approximately $72,400 per year [[E:ev_wage]], while the directly accessible post-injury occupations pay approximately $44,000 to $52,000 per year [[E:ev_lms]]. [Expert input needed: state the post-injury earning-capacity figure or range the expert adopts and the resulting annual loss of earning capacity; the present value of the lifetime loss should be calculated by the retained economist using the appropriate work-life expectancy and discount rate.]",
  },
  {
    key: "opinions",
    title: "Opinions",
    fedEvidenceIds: ["ev_med", "ev_lms", "ev_wage", "ev_tsa"],
    draftText:
      "Based upon the expert's education, training, and experience, the interview and testing of Mr. Alvarez, the records identified in this report, and the methodology described above, the following opinions are held to a reasonable degree of vocational-rehabilitation certainty [[E:ev_med]]. First, the adopted permanent restrictions preclude Mr. Alvarez from returning to his past relevant work as a commercial HVAC installer [[E:ev_med]]. Second, he retains the capacity for full-time sedentary-to-light work in the service-dispatch, parts-and-inventory, and customer-service occupations identified by the transferable-skills analysis [[E:ev_tsa]]. Third, his post-injury earning capacity falls within the surveyed range of approximately $44,000 to $52,000 per year [[E:ev_lms]], reduced from a documented pre-injury average of approximately $72,400 per year [[E:ev_wage]]. [Expert input needed: state the adopted post-injury earning capacity and the resulting annual loss of earning capacity, and confirm the work-life expectancy and present-value multiplier with the retained economist before stating a total discounted loss figure.]",
  },
  {
    key: "basis_and_reasons",
    title: "Basis and Reasons",
    fedEvidenceIds: ["ev_med", "ev_tsa", "ev_lms", "ev_wage", "ev_onet"],
    draftText:
      "Each opinion rests on identified facts and data applied through the RAPEL methodology, a published and widely used framework in forensic vocational rehabilitation [[E:ev_med]]. The basis for the reduced capacity is the permanent physical restriction that removes the pre-injury occupation from reach [[E:ev_med]]. The redirection occupations and their wage range are grounded in the transferable-skills analysis and the local labor market survey [[E:ev_tsa]] [[E:ev_lms]], and corroborated against government occupational wage data [[E:ev_onet]]. The loss of earning capacity follows from the difference between the documented pre-injury earnings and the expert's adopted post-injury earning capacity within the surveyed wage range [[E:ev_wage]] [[E:ev_lms]].",
  },
  {
    key: "facts_or_data_considered",
    title: "Facts or Data Considered",
    fedEvidenceIds: ["ev_engage", "ev_depo_job", "ev_interview", "ev_med", "ev_wage", "ev_voctest", "ev_tsa", "ev_lms", "ev_onet", "ev_rehab"],
    draftText:
      "Engagement letter and scope of retention [[E:ev_engage]].\nPlaintiff's deposition testimony regarding work history [[E:ev_depo_job]].\nVocational interview and self-reported limitations [[E:ev_interview]].\nTreating physician's permanent work restrictions [[E:ev_med]].\nPre-injury wage and W-2 records [[E:ev_wage]].\nVocational testing results [[E:ev_voctest]].\nTransferable-skills analysis output [[E:ev_tsa]].\nLabor market survey of the local commuting area [[E:ev_lms]].\nO*NET and BLS occupational wage data [[E:ev_onet]].\nRetraining program cost and duration estimate [[E:ev_rehab]].",
  },
  {
    key: "exhibits",
    title: "Exhibits",
    fedEvidenceIds: ["ev_lms", "ev_tsa", "ev_wage", "ev_onet"],
    draftText:
      "Exhibit A: labor market survey of dispatcher, parts-and-inventory, and customer-service openings in the commuting area, with the source and date for each data point [[E:ev_lms]].\nExhibit B: transferable-skills analysis occupation list, with O*NET-SOC classifications, specific vocational preparation, and exertional levels [[E:ev_tsa]].\nExhibit C: pre-injury versus post-injury earning-capacity comparison, with Bureau of Labor Statistics occupational wage benchmarks [[E:ev_wage]] [[E:ev_onet]].\nThe full exhibit tables are attached following the certification [[E:ev_onet]].",
  },
  {
    key: "qualifications",
    title: "Qualifications",
    fedEvidenceIds: [],
    draftText:
      "Dana M. Whitfield, M.S., CRC, ABVE/D. Diplomate of the American Board of Vocational Experts and a Certified Rehabilitation Counselor with relevant publications within the last ten years, as listed in the attached curriculum vitae.",
  },
  {
    key: "prior_testimony",
    title: "Prior Testimony (Last 4 Years)",
    fedEvidenceIds: [],
    draftText:
      "Reyes v. Coastal Freight (2024) — deposition and trial testimony.\nIn re Okafor (2023) — deposition testimony.",
  },
  {
    key: "compensation",
    title: "Statement of Compensation",
    fedEvidenceIds: [],
    draftText:
      "$295 per hour for file review and report preparation; $450 per hour for deposition and trial testimony. Compensation is not contingent on the opinions expressed or the outcome of the matter.",
  },
];

// Tabular exhibits attached after the certification. Real published BLS OEWS
// (May 2024) wage figures and current O*NET-SOC codes anchor the data; the
// labor-market-survey rows are illustrative for this fictional matter, marked as
// such, and kept internally consistent with the BLS benchmarks. The tool renders
// these tables; it does not originate the figures (they are case inputs here).
export const SAMPLE_EXHIBITS: ExhibitTable[] = [
  {
    label: "Exhibit A",
    title: "Labor Market Survey — Commuting Area",
    caption:
      "Within an approximately 35-mile commuting radius. Illustrative survey for this sample matter; wages corroborated against BLS OEWS (May 2024).",
    columns: ["#", "Employer / source", "Position", "Reported annual wage", "Basis"],
    colFractions: [0.05, 0.3, 0.27, 0.2, 0.18],
    rows: [
      ["1", "Regional commercial HVAC contractor", "Service Dispatcher / Scheduler", "$46,000–$50,000", "Phone verification, 5/2026"],
      ["2", "HVAC/R wholesale distributor", "Inside Customer Service / Parts", "$44,500 + bonus", "Job posting, verified 5/2026"],
      ["3", "Mechanical contractor (commercial)", "Parts & Inventory Coordinator", "$48,000–$52,000", "Phone verification, 5/2026"],
      ["4", "Facilities-management firm", "Maintenance Planner / Scheduler", "$49,200", "Careers-page posting, 5/2026"],
      ["5", "Building-automation distributor", "Service Coordinator / Dispatcher", "$45,760", "Job posting, verified 5/2026"],
      ["6", "HVAC equipment supplier", "Customer Service / Order Desk", "$44,000–$47,500", "Phone verification, 5/2026"],
    ],
    footnote:
      "Each contact is documented with its date and source in the labor-market-contact log.",
  },
  {
    label: "Exhibit B",
    title: "Transferable Skills Analysis — Accessible Occupations",
    caption:
      "OASYS transferable-skills analysis, cross-referenced to the DOT and O*NET, with the adopted physical restrictions applied as filters.",
    columns: ["#", "Occupation", "O*NET-SOC", "SVP", "Strength", "Within restriction"],
    colFractions: [0.05, 0.34, 0.16, 0.08, 0.19, 0.18],
    rows: [
      ["1", "HVAC service dispatcher / scheduler", "43-5032", "4", "Sedentary", "Yes"],
      ["2", "Parts & inventory / planning clerk", "43-5071", "4", "Light", "Yes"],
      ["3", "Customer service rep (HVAC distributor)", "43-4051", "4", "Sedentary", "Yes"],
      ["4", "Maintenance planner / scheduler", "43-5061", "4", "Sedentary–Light", "Yes"],
      ["5", "Cost estimator (mechanical)", "13-1051", "7", "Sedentary", "With retraining"],
      ["6", "Technical sales rep (HVAC equipment)", "41-4011", "7", "Light", "With brief OJT"],
    ],
    footnote:
      "O*NET-SOC codes per the 2018 SOC / O*NET-SOC 2019 taxonomy. SVP = Specific Vocational Preparation.",
  },
  {
    label: "Exhibit C",
    title: "Pre-Injury vs. Post-Injury Earning Capacity",
    caption:
      "Earning capacity expressed as ranges. Pre-injury documented earnings fall in the upper percentiles for SOC 49-9021.",
    columns: ["Measure", "Pre-injury", "Post-injury (accessible cluster)"],
    colFractions: [0.34, 0.3, 0.36],
    rows: [
      ["Representative occupation", "Commercial HVAC installer", "Dispatcher · parts/inventory · service CSR"],
      ["O*NET-SOC", "49-9021", "43-5032 · 43-5071 · 43-4051"],
      ["BLS OEWS median (national, 5/2024)", "$59,810", "$42,830 – $57,770"],
      ["Earning capacity (this matter)", "≈ $72,400 / yr (documented)", "$44,000 – $52,000 / yr (surveyed)"],
    ],
    footnote:
      "BLS OEWS May 2024. Present value of any loss to be computed by the retained forensic economist.",
  },
];

export interface SampleSection {
  key: ReportSectionKey;
  title: string;
  draftText: string;
  fedEvidenceIds: string[];
  grounding: GroundingResult;
}

export interface SampleReport {
  meta: ReportMeta;
  profile: ExpertProfile;
  evidence: EvidenceUnit[];
  sections: SampleSection[];
  appendix: ReturnType<typeof generateDisclosureAppendix>;
  /** Per-opinion data→opinion mapping, keyed by section key. */
  reconstructions: OpinionReconstruction[];
  rule26: Rule26Result;
  /** Composed pre-export check: blockers vs. open expert items. */
  readiness: ReadinessVerdict;
  exhibitNumber: Map<string, number>;
  /** Tabular exhibits (labor-market survey, TSA, earning-capacity comparison). */
  exhibits: ExhibitTable[];
}

// ─── Discipline registry ────────────────────────────────────────────────────
// One worked sample per discipline. The vocational one is the live beachhead;
// the others are honest, structure-forward PREVIEWS of formats being finalized
// with design partners (their `preview` flag drives a "coming next" banner).
// Every sample runs through the exact same grounding/disclosure pipeline, so the
// citations and the AI-Use record are computed, not faked.
export type SampleKind = "vocational" | "engineering" | "reconstruction";

export interface SampleDefinition {
  kind: SampleKind;
  /** Short discipline label for the switcher. */
  label: string;
  /** true → an illustrative preview of a not-yet-finalized discipline template. */
  preview: boolean;
  id: string;
  model: string;
  modelVersion: string;
  template: DisciplineTemplate;
  meta: ReportMeta;
  profile: ExpertProfile;
  evidence: EvidenceUnit[];
  specs: SampleSectionSpec[];
  exhibits: ExhibitTable[];
}

export const VOCREHAB_SAMPLE: SampleDefinition = {
  kind: "vocational",
  label: "Vocational rehabilitation",
  preview: false,
  id: REPORT_ID,
  model: MODEL,
  modelVersion: MODEL_VERSION,
  template: VOCREHAB_TEMPLATE,
  meta: SAMPLE_META,
  profile: SAMPLE_PROFILE,
  evidence: SAMPLE_EVIDENCE,
  specs: SECTION_SPECS,
  exhibits: SAMPLE_EXHIBITS,
};

// ─── Forensic engineering (illustrative preview) ────────────────────────────
// Structure is informed by ASTM E3176-24 and the Rule 26 backbone. It remains a
// preview until a practicing design partner validates the workflow and wording.
const ENG_META: ReportMeta = {
  id: "sample-engineering",
  caseId: "sample-eng-case",
  discipline: "Forensic Engineering",
  templateVersion: FORENSIC_ENGINEERING_PREVIEW_TEMPLATE.version,
  matter: "Doe v. Riverside Property Mgmt., No. 2025-CV-08812",
  retainingCounsel: "Okafor & Lin LLP (Plaintiff)",
  expertRole: "Forensic civil & safety engineering expert",
};

const ENG_PROFILE: ExpertProfile = {
  fullName: "Marcus T. Bell, P.E.",
  credentials:
    "Licensed Professional Engineer (P.E.); M.S. Civil Engineering; member, National Academy of Forensic Engineers (NAFE)",
  publicationsLast10yr: [],
  priorTestimonyLast4yr: [
    "Vega v. Summit Builders (2024) — deposition",
    "In re Harborview Stair Collapse (2023) — deposition & trial",
  ],
  compensationStatement:
    "$325/hour for inspection, analysis, and report preparation; $475/hour for deposition and trial testimony. Not contingent on the outcome.",
};

const ENG_EVIDENCE: EvidenceUnit[] = [
  { id: "en_engage", inputId: "en_in1", content: "Engagement letter retaining the expert to evaluate the exterior stairway's condition and code conformance", location: "Engagement letter ¶1" },
  { id: "en_incident", inputId: "en_in2", content: "Incident report — plaintiff fell while descending the exterior stairway on March 14, 2025", location: "Incident report p.1" },
  { id: "en_site", inputId: "en_in3", content: "Site inspection notes — six-riser exterior concrete stairway at the north entrance", location: "Site inspection notes ¶3" },
  { id: "en_meas", inputId: "en_in4", content: "Field measurements (calibrated digital level and tape): riser heights 5.5 in to 8.25 in (2.75 in variation; tallest riser exceeds the 7 in maximum); tread depths 9.75 in to 11.25 in; no graspable handrail on either side", location: "Field measurement log" },
  { id: "en_code", inputId: "en_in5", content: "2021 International Building Code §1011.5.2 (max 7 in riser height), §1011.5.4 (max 0.375 in riser-height variation within a flight), and §1011.11 (graspable handrail required for stairways with four or more risers)", location: "IBC 2021 §1011.5.2, §1011.5.4, §1011.11" },
  { id: "en_photos", inputId: "en_in6", content: "Site photographs of the stairway, risers, and handrail locations", location: "Photo log, Img. 1–8" },
  { id: "en_maint", inputId: "en_in7", content: "Property maintenance records — no stairway inspection logged in the preceding 24 months", location: "Maintenance log 2023–2025" },
];

const ENG_SPECS: SampleSectionSpec[] = [
  { key: "scope_of_assignment", title: "Scope of Assignment", fedEvidenceIds: ["en_engage"], draftText: "Okafor & Lin LLP retained the expert to evaluate the condition of the exterior stairway at the subject property and its conformance with the building-code requirements in effect at the time of the incident [[E:en_engage]]. The assignment was limited to the engineering and code-conformance questions and did not extend to any medical or damages opinion [[E:en_engage]]." },
  { key: "background", title: "Background", fedEvidenceIds: ["en_incident"], draftText: "The plaintiff reported falling while descending the exterior concrete stairway at the north entrance of the property on March 14, 2025 [[E:en_incident]]." },
  { key: "investigation", title: "Site Inspection and Examination", fedEvidenceIds: ["en_site", "en_meas", "en_photos"], draftText: "A site inspection documented a six-riser exterior concrete stairway at the north entrance [[E:en_site]]. Using a calibrated digital level and tape, riser heights were measured from 5.5 to 8.25 inches (a 2.75-inch variation, with the tallest riser exceeding the 7-inch maximum), tread depths from 9.75 to 11.25 inches, and no graspable handrail on either side [[E:en_meas]]. The conditions were photographed and catalogued in the attached photo log [[E:en_photos]]." },
  { key: "facts_or_data_considered", title: "Facts and Data Considered", fedEvidenceIds: ["en_incident", "en_site", "en_meas", "en_code", "en_photos", "en_maint"], draftText: "The materials considered include the incident report [[E:en_incident]], the site inspection notes [[E:en_site]] and field measurements [[E:en_meas]], the governing building code [[E:en_code]], the site photographs [[E:en_photos]], and the property maintenance records [[E:en_maint]]." },
  { key: "analysis", title: "Engineering Analysis", fedEvidenceIds: ["en_code", "en_meas", "en_maint"], draftText: "The 2021 International Building Code limits risers to a maximum of 7 inches, limits riser-height variation within a single flight to 0.375 inch, and requires a graspable handrail on stairways of four or more risers [[E:en_code]]. The measured maximum riser of 8.25 inches and the 2.75-inch variation exceed those limits, and no handrail was present at the time of inspection [[E:en_meas]]. The maintenance records reflect no stairway inspection in the preceding 24 months [[E:en_maint]]." },
  { key: "opinions", title: "Opinions", fedEvidenceIds: ["en_code", "en_meas"], draftText: "Within a reasonable degree of engineering certainty, the stairway did not conform to the maximum-riser, riser-uniformity, and handrail provisions of the applicable building code at the time of the incident [[E:en_code]] [[E:en_meas]]. [Expert input needed: state the opinion on how the nonconforming conditions relate to the reported fall.]" },
  { key: "basis_and_reasons", title: "Basis and Reasons", fedEvidenceIds: ["en_meas", "en_code"], draftText: "The basis for the nonconformance findings is the direct comparison of the measured riser dimensions and the absent handrail [[E:en_meas]] against the maximum-riser, uniformity, and handrail requirements of the governing code [[E:en_code]]." },
  { key: "exhibits", title: "Exhibits", fedEvidenceIds: ["en_meas", "en_photos"], draftText: "Exhibit A: field measurement log of riser heights across the flight [[E:en_meas]].\nExhibit B: site photographs of the stairway and handrail locations [[E:en_photos]]." },
  { key: "qualifications", title: "Qualifications", fedEvidenceIds: [], draftText: "Marcus T. Bell, P.E. Licensed Professional Engineer with a Master of Science in Civil Engineering and membership in the National Academy of Forensic Engineers, as detailed in the attached curriculum vitae." },
  { key: "prior_testimony", title: "Prior Testimony (Last 4 Years)", fedEvidenceIds: [], draftText: "Vega v. Summit Builders (2024) — deposition testimony.\nIn re Harborview Stair Collapse (2023) — deposition and trial testimony." },
  { key: "compensation", title: "Statement of Compensation", fedEvidenceIds: [], draftText: "$325 per hour for inspection, analysis, and report preparation; $475 per hour for deposition and trial testimony. Compensation is not contingent on the opinions expressed or the outcome of the matter." },
];

export const ENGINEERING_SAMPLE: SampleDefinition = {
  kind: "engineering",
  label: "Forensic engineering",
  preview: true,
  id: "sample-engineering",
  model: MODEL,
  modelVersion: MODEL_VERSION,
  template: FORENSIC_ENGINEERING_PREVIEW_TEMPLATE,
  meta: ENG_META,
  profile: ENG_PROFILE,
  evidence: ENG_EVIDENCE,
  specs: ENG_SPECS,
  exhibits: [],
};

// ─── Accident reconstruction (illustrative preview) ─────────────────────────
// Structure is a design-partner preview. The fictional worked calculation uses
// a critical-speed method covered by SAE J2969 and cross-checks it against EDR
// data; the method, numbers, and wording still require practitioner validation.
const RC_META: ReportMeta = {
  id: "sample-reconstruction",
  caseId: "sample-recon-case",
  discipline: "Accident Reconstruction",
  templateVersion: ACCIDENT_RECONSTRUCTION_PREVIEW_TEMPLATE.version,
  matter: "Nguyen v. Castillo, No. 2025-CV-10934",
  retainingCounsel: "Park & Whitman LLP (Defendant)",
  expertRole: "Traffic accident reconstruction expert",
};

const RC_PROFILE: ExpertProfile = {
  fullName: "Daniel R. Cho",
  credentials:
    "Accredited Traffic Accident Reconstructionist (ACTAR); IPTM At-Scene Traffic Crash Investigation and Advanced Collision Reconstruction; B.S. Mechanical Engineering",
  publicationsLast10yr: [],
  priorTestimonyLast4yr: [
    "Maddox v. Reyes (2024) — deposition",
    "State v. Ferraro (2023) — trial",
  ],
  compensationStatement:
    "$350/hour for inspection, analysis, and report preparation; $500/hour for deposition and trial testimony. Not contingent on the outcome.",
};

const RC_EVIDENCE: EvidenceUnit[] = [
  { id: "rc_engage", inputId: "rc_in1", content: "Engagement letter retaining the expert to determine the vehicle's pre-crash speed and the cause of the loss of control", location: "Engagement letter ¶1" },
  { id: "rc_scene", inputId: "rc_in2", content: "Total-station scene survey: right-hand curve; measured superelevation 0.04; posted advisory speed 35 mph", location: "Scene survey, sheet 2" },
  { id: "rc_yaw", inputId: "rc_in3", content: "Critical-speed yaw mark from the right tires — measured chord 88 ft, middle ordinate 3.9 ft", location: "Field notes, yaw mark Y-1" },
  { id: "rc_drag", inputId: "rc_in4", content: "Drag factor 0.68 from an accelerometer test on the dry asphalt surface", location: "Drag-factor test log" },
  { id: "rc_calc", inputId: "rc_in8", content: "Critical-speed worksheet: curve radius R = C^2/(8M) + M/2 = 88^2/(8 x 3.9) + 3.9/2 = about 250 ft; critical speed V = sqrt(15 x R x (f + e)) = sqrt(15 x 250 x (0.68 + 0.04)) = about 52 mph", location: "Calculation worksheet, sheet 3" },
  { id: "rc_edr", inputId: "rc_in5", content: "Bosch CDR (event data recorder) download — recorded pre-crash speed 58 mph in the 5 s before impact", location: "CDR report p.6, pre-crash record" },
  { id: "rc_vehicle", inputId: "rc_in6", content: "Vehicle inspection: service brakes, steering, and tires functional; no pre-impact mechanical failure", location: "Vehicle inspection sheet" },
  { id: "rc_photos", inputId: "rc_in7", content: "Scene and vehicle photographs", location: "Photo log, Img. 1–14" },
];

const RC_SPECS: SampleSectionSpec[] = [
  { key: "scope_of_assignment", title: "Scope of Assignment", fedEvidenceIds: ["rc_engage"], draftText: "Park & Whitman LLP retained the expert to determine the subject vehicle's pre-crash speed and the cause of the loss of control on the curve where the collision occurred [[E:rc_engage]]. The assignment was limited to the reconstruction questions and did not extend to any medical or damages opinion [[E:rc_engage]]." },
  { key: "background", title: "Collision Summary", fedEvidenceIds: ["rc_scene"], draftText: "The subject vehicle departed the roadway on a right-hand curve posted with a 35 mph advisory speed [[E:rc_scene]]." },
  { key: "investigation", title: "Scene and Vehicle Inspection", fedEvidenceIds: ["rc_scene", "rc_yaw", "rc_vehicle"], draftText: "A scene survey performed with a total station documented the curve geometry and a measured superelevation of 0.04 [[E:rc_scene]]. A critical-speed yaw mark deposited by the right-side tires was measured with a chord of 88 feet and a middle ordinate of 3.9 feet [[E:rc_yaw]]. On inspection, the vehicle's service brakes, steering, and tires were functional, with no evidence of a pre-impact mechanical failure [[E:rc_vehicle]]." },
  { key: "facts_or_data_considered", title: "Physical Evidence and Data Considered", fedEvidenceIds: ["rc_scene", "rc_yaw", "rc_drag", "rc_edr", "rc_vehicle", "rc_photos"], draftText: "The materials considered include the total-station scene survey [[E:rc_scene]], the critical-speed yaw-mark measurements [[E:rc_yaw]], the roadway drag-factor test [[E:rc_drag]], the event data recorder download [[E:rc_edr]], the vehicle inspection findings [[E:rc_vehicle]], and the scene and vehicle photographs [[E:rc_photos]]." },
  { key: "analysis", title: "Speed Analysis", fedEvidenceIds: ["rc_yaw", "rc_drag", "rc_scene", "rc_edr", "rc_calc"], draftText: "Applying the chord and middle-ordinate method to the measured yaw mark yields a curve radius of approximately 250 feet [[E:rc_yaw]] [[E:rc_calc]]. With a drag factor of 0.68 and the measured 0.04 superelevation, the critical (yaw) speed for that radius is approximately 52 mph [[E:rc_drag]] [[E:rc_scene]] [[E:rc_calc]]. Independently, the event data recorder recorded a pre-crash speed of 58 mph in the seconds before impact [[E:rc_edr]]." },
  { key: "opinions", title: "Opinions", fedEvidenceIds: ["rc_edr", "rc_scene"], draftText: "Within a reasonable degree of accident-reconstruction certainty, the vehicle was traveling above the critical speed of the curve and above its 35 mph advisory speed when control was lost [[E:rc_edr]] [[E:rc_scene]]. [Expert input needed: state the opinion on causation and any contributing roadway or driver factors.]" },
  { key: "basis_and_reasons", title: "Basis and Reasons", fedEvidenceIds: ["rc_yaw", "rc_drag", "rc_edr", "rc_scene"], draftText: "The basis is the agreement of two independent methods: the critical-speed analysis of the measured yaw mark [[E:rc_yaw]] [[E:rc_drag]] and the recorded event-data-recorder speed [[E:rc_edr]], both above the 35 mph advisory speed for the curve [[E:rc_scene]]." },
  { key: "exhibits", title: "Exhibits", fedEvidenceIds: ["rc_scene", "rc_edr", "rc_photos"], draftText: "Exhibit A: scaled scene diagram from the total-station survey [[E:rc_scene]].\nExhibit B: event data recorder (CDR) report [[E:rc_edr]].\nExhibit C: scene and vehicle photographs [[E:rc_photos]]." },
  { key: "qualifications", title: "Qualifications", fedEvidenceIds: [], draftText: "Daniel R. Cho. Accredited Traffic Accident Reconstructionist (ACTAR) with IPTM collision-reconstruction training and a Bachelor of Science in Mechanical Engineering, as detailed in the attached curriculum vitae." },
  { key: "prior_testimony", title: "Prior Testimony (Last 4 Years)", fedEvidenceIds: [], draftText: "Maddox v. Reyes (2024) — deposition testimony.\nState v. Ferraro (2023) — trial testimony." },
  { key: "compensation", title: "Statement of Compensation", fedEvidenceIds: [], draftText: "$350 per hour for inspection, analysis, and report preparation; $500 per hour for deposition and trial testimony. Compensation is not contingent on the opinions expressed or the outcome of the matter." },
];

export const RECONSTRUCTION_SAMPLE: SampleDefinition = {
  kind: "reconstruction",
  label: "Accident reconstruction",
  preview: true,
  id: "sample-reconstruction",
  model: MODEL,
  modelVersion: MODEL_VERSION,
  template: ACCIDENT_RECONSTRUCTION_PREVIEW_TEMPLATE,
  meta: RC_META,
  profile: RC_PROFILE,
  evidence: RC_EVIDENCE,
  specs: RC_SPECS,
  exhibits: [],
};

export const SAMPLE_DEFINITIONS: SampleDefinition[] = [
  VOCREHAB_SAMPLE,
  ENGINEERING_SAMPLE,
  RECONSTRUCTION_SAMPLE,
];

/** Resolve a discipline kind (e.g. from a query param) to its sample; defaults to vocational. */
export function getSampleDefinition(kind: string | undefined): SampleDefinition {
  return SAMPLE_DEFINITIONS.find((d) => d.kind === kind) ?? VOCREHAB_SAMPLE;
}

export function buildSampleReport(def: SampleDefinition = VOCREHAB_SAMPLE): SampleReport {
  const audit = new AuditLog();
  const sections: SampleSection[] = [];
  const reportSections: ReportSection[] = [];

  for (const spec of def.specs) {
    const grounding = checkGrounding(spec.draftText, spec.fedEvidenceIds);

    // Record one audit event per AI-assisted section, capturing the closed-world
    // input set — exactly what the disclosure appendix is built from.
    if (spec.fedEvidenceIds.length > 0) {
      audit.append({
        reportId: def.id,
        sectionKey: spec.key,
        prompt: `Draft the "${spec.title}" section using only the supplied evidence.`,
        model: def.model,
        modelVersion: def.modelVersion,
        inputIds: spec.fedEvidenceIds,
        output: spec.draftText,
      });
    }

    sections.push({
      key: spec.key,
      title: spec.title,
      draftText: spec.draftText,
      fedEvidenceIds: spec.fedEvidenceIds,
      grounding,
    });

    reportSections.push({
      key: spec.key,
      title: spec.title,
      draftText: spec.draftText,
      citedEvidenceIds: grounding.citedEvidenceIds,
      ungroundedFlags: grounding.ungroundedSentences,
    });
  }

  const appendix = generateDisclosureAppendix(def.id, audit, def.evidence);
  const reconstructions = reconstructAllOpinions(
    def.id,
    reportSections,
    audit,
    def.evidence,
  );
  const rule26 = validateRule26(reportSections, def.template);
  const readiness = assessReadiness(rule26, reconstructions);

  const exhibitNumber = new Map(def.evidence.map((u, i) => [u.id, i + 1]));

  return {
    meta: def.meta,
    profile: def.profile,
    evidence: def.evidence,
    sections,
    appendix,
    reconstructions,
    rule26,
    readiness,
    exhibitNumber,
    exhibits: def.exhibits,
  };
}
