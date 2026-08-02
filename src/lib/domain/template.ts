import type { DisciplineTemplate } from "./types.js";

// PLACEHOLDER template only. The real discipline template (ASTM E3176 for
// forensic engineering OR the IPTM topical / ACTAR format for accident
// reconstruction) must be co-designed with a discipline expert design partner
// before Phase 1 (plan Must-Have #2). This exists so Phase 0 plumbing — drafting,
// grounding, audit, disclosure, export — is exercisable end-to-end.

export const PLACEHOLDER_TEMPLATE: DisciplineTemplate = {
  discipline: "__placeholder__",
  version: "0.0.0-placeholder",
  sections: [
    {
      key: "scope_of_assignment",
      title: "Scope of Assignment",
      instructions:
        "State what the expert was retained to investigate and the questions addressed. Ground in the engagement letter.",
      rule26Required: false,
      requiresEvidence: true,
    },
    {
      key: "background",
      title: "Background",
      instructions:
        "Summarize the undisputed background facts of the matter, grounded strictly in supplied evidence.",
      rule26Required: false,
      requiresEvidence: true,
    },
    {
      key: "investigation",
      title: "Investigation",
      instructions:
        "Describe what the expert examined and observed. Every observation must cite a supplied evidence unit.",
      rule26Required: false,
      requiresEvidence: true,
    },
    {
      key: "facts_or_data_considered",
      title: "Facts or Data Considered",
      instructions:
        "Enumerate the facts and data the expert considered. One bullet per evidence unit, each cited.",
      rule26Required: true,
      requiresEvidence: true,
    },
    {
      key: "analysis",
      title: "Analysis",
      instructions:
        "Connect observations to the expert's stated reasoning. Do NOT introduce facts or opinions not provided by the expert.",
      rule26Required: false,
      requiresEvidence: true,
    },
    {
      key: "opinions",
      title: "Opinions",
      instructions:
        "Restate the expert's own opinions verbatim-in-substance. The tool must never originate an opinion; only format opinions the expert supplied.",
      rule26Required: true,
      requiresEvidence: true,
    },
    {
      key: "basis_and_reasons",
      title: "Basis and Reasons",
      instructions:
        "For each opinion, give the basis and reasons, each grounded in cited evidence.",
      rule26Required: true,
      requiresEvidence: true,
    },
    {
      key: "exhibits",
      title: "Exhibits",
      instructions:
        "List exhibits used to summarize or support the opinions, mapped to supplied inputs.",
      rule26Required: true,
      requiresEvidence: true,
    },
    {
      key: "qualifications",
      title: "Qualifications",
      instructions:
        "Expert profile boilerplate: credentials and publications (last 10 years). Sourced from the expert profile, not case evidence.",
      rule26Required: true,
      requiresEvidence: false,
    },
    {
      key: "prior_testimony",
      title: "Prior Testimony (Last 4 Years)",
      instructions:
        "List of cases in which the expert testified at trial or deposition during the previous 4 years.",
      rule26Required: true,
      requiresEvidence: false,
    },
    {
      key: "compensation",
      title: "Statement of Compensation",
      instructions: "Statement of the compensation to be paid for the study and testimony.",
      rule26Required: true,
      requiresEvidence: false,
    },
  ],
};

// PREVIEW-ONLY discipline outlines. These are deliberately not wired into the
// live report builder: they make the sample reports and design-partner review
// concrete without implying that an expert has validated the workflow. The
// vocational template remains the only live discipline until that gate is met.
export const FORENSIC_ENGINEERING_PREVIEW_TEMPLATE: DisciplineTemplate = {
  discipline: "Forensic Engineering",
  version: "0.1.0-preview-e3176",
  standardRef:
    "ASTM E3176-24 (informational guide); Fed. R. Civ. P. 26(a)(2)(B)",
  sections: [
    {
      key: "scope_of_assignment",
      title: "Scope of Assignment",
      instructions:
        "State the retaining party, the questions the expert was asked to address, and the limits of the assignment. Ground the scope in the engagement material; do not expand it.",
      rule26Required: false,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Are the questions presented and the limits of the assignment explicit?", mentions: ["limited", "scope"] },
      ],
    },
    {
      key: "background",
      title: "Background",
      instructions:
        "Give only the incident and property or product background documented in the supplied record. Attribute disputed accounts and do not decide facts.",
      rule26Required: false,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Are material dates, locations, and disputed accounts identified and attributed?" },
      ],
    },
    {
      key: "investigation",
      title: "Site Inspection and Examination",
      instructions:
        "Describe inspections, measurements, tests, instruments, photographs, and preserved evidence exactly as documented. State relevant dates and equipment or calibration information when supplied.",
      rule26Required: false,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Are inspection dates, participants, and site or item conditions documented?" },
        { q: "Are measurement tools, calibration information, and test conditions identified where material?", mentions: ["calibrat", "measurement"] },
        { q: "Are photographs, diagrams, samples, or other preserved evidence indexed?" },
      ],
    },
    {
      key: "facts_or_data_considered",
      title: "Facts and Data Considered",
      instructions:
        "Itemize the materials, measurements, codes, standards, drawings, calculations, and testimony the expert actually considered. Cite each supplied source.",
      rule26Required: true,
      requiresEvidence: true,
    },
    {
      key: "analysis",
      title: "Engineering Analysis",
      instructions:
        "Structure the expert's own comparison of observations and measurements to the cited engineering principles, codes, standards, or calculations. Make assumptions, limitations, uncertainty, and alternative explanations visible when the expert supplied them. Never select a method or originate analysis.",
      rule26Required: false,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Are the methods, governing codes or standards, and calculation inputs identified?", mentions: ["code", "method", "calculation"] },
        { q: "Are material assumptions and limitations stated?", mentions: ["assum", "limitation"] },
        { q: "Are plausible alternative explanations addressed or expressly left open?", mentions: ["alternative"] },
      ],
    },
    {
      key: "opinions",
      title: "Opinions",
      instructions:
        "Format only the engineering opinions the expert supplied. Do not turn a code comparison, observation, or incomplete causal question into an opinion on the expert's behalf.",
      rule26Required: true,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Is every opinion within the stated assignment and the expert's field?" },
        { q: "Does each opinion use the expert's chosen, jurisdiction-appropriate level-of-certainty wording?" },
      ],
    },
    {
      key: "basis_and_reasons",
      title: "Basis and Reasons",
      instructions:
        "For each opinion, trace the expert's stated reasoning back through the measurements, observations, methods, codes, calculations, assumptions, and cited record.",
      rule26Required: true,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Can a reviewer follow each opinion back to its data and method?", mentions: ["basis", "measurement", "code"] },
      ],
    },
    {
      key: "exhibits",
      title: "Exhibits",
      instructions:
        "List the photographs, measurement logs, drawings, calculation sheets, and other exhibits used to summarize or support the opinions, mapped to supplied inputs.",
      rule26Required: true,
      requiresEvidence: true,
    },
    {
      key: "qualifications",
      title: "Qualifications",
      instructions:
        "Use the expert profile for relevant licensure, education, experience, and publications from the preceding ten years. Do not infer qualifications.",
      rule26Required: true,
      requiresEvidence: false,
    },
    {
      key: "prior_testimony",
      title: "Prior Testimony (Last 4 Years)",
      instructions:
        "List cases in which the expert testified at trial or deposition during the previous four years.",
      rule26Required: true,
      requiresEvidence: false,
    },
    {
      key: "compensation",
      title: "Statement of Compensation",
      instructions:
        "State the compensation to be paid for the study and testimony.",
      rule26Required: true,
      requiresEvidence: false,
    },
  ],
};

export const ACCIDENT_RECONSTRUCTION_PREVIEW_TEMPLATE: DisciplineTemplate = {
  discipline: "Accident Reconstruction",
  version: "0.1.0-preview-j2969",
  standardRef:
    "SAE J2969 (2024; critical-speed method, where applicable); Fed. R. Civ. P. 26(a)(2)(B)",
  sections: [
    {
      key: "scope_of_assignment",
      title: "Scope of Assignment",
      instructions:
        "State the collision-reconstruction questions assigned and the limits of the engagement. Ground the scope in the engagement material and do not add medical, biomechanical, or legal conclusions.",
      rule26Required: false,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Are the vehicles, time period, reconstruction questions, and assignment limits clear?" },
      ],
    },
    {
      key: "background",
      title: "Collision Summary",
      instructions:
        "Summarize the documented collision sequence and setting without resolving disputed accounts or filling gaps in the record.",
      rule26Required: false,
      requiresEvidence: true,
    },
    {
      key: "investigation",
      title: "Scene and Vehicle Inspection",
      instructions:
        "Describe scene and vehicle examinations, measurement methods, surface and weather conditions, data downloads, photographs, and physical evidence exactly as supplied.",
      rule26Required: false,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Are scene, vehicle, roadway, weather, and surface conditions documented where relevant?" },
        { q: "Are measurement devices, data-download tools, calibration or validation information, and inspection dates identified?", mentions: ["calibrat", "total station", "CDR"] },
      ],
    },
    {
      key: "facts_or_data_considered",
      title: "Physical Evidence and Data Considered",
      instructions:
        "Itemize the scene measurements, marks, vehicle evidence, photographs, event data, witness material, test results, and references the expert actually considered.",
      rule26Required: true,
      requiresEvidence: true,
    },
    {
      key: "analysis",
      title: "Reconstruction Analysis",
      instructions:
        "Structure only the expert's supplied calculations and reconstruction methods. Show inputs, units, assumptions, applicability, uncertainty, and any comparison with an independent method. Never choose a formula, supply a coefficient, or generate a result.",
      rule26Required: false,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Are every calculation's measurements, units, coefficients, and source records identified?", mentions: ["measurement", "factor", "worksheet"] },
        { q: "Are method applicability, assumptions, and uncertainty addressed?", mentions: ["uncertainty", "assum", "applicab"] },
        { q: "Where a critical-speed calculation is used, is it compared with another available reconstruction method?", mentions: ["independent", "event data recorder", "EDR"] },
      ],
    },
    {
      key: "opinions",
      title: "Opinions",
      instructions:
        "Format only the reconstruction opinions the expert supplied. Keep speed, sequence, loss-of-control, causation, avoidance, biomechanical, and legal conclusions separate; never bridge from one to another without the expert's stated analysis.",
      rule26Required: true,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Is each opinion limited to the expert's assignment, methods, and field?" },
        { q: "Does each opinion use the expert's chosen, jurisdiction-appropriate level-of-certainty wording?" },
      ],
    },
    {
      key: "basis_and_reasons",
      title: "Basis and Reasons",
      instructions:
        "For each opinion, trace the stated reasoning to physical evidence, recorded data, measurements, tests, calculations, assumptions, uncertainty, and corroborating or conflicting methods.",
      rule26Required: true,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Can a reviewer reproduce the data-to-calculation-to-opinion path from the cited record?" },
      ],
    },
    {
      key: "exhibits",
      title: "Exhibits",
      instructions:
        "List scene diagrams, photo logs, vehicle diagrams, data downloads, test logs, calculation worksheets, and other exhibits used to summarize or support the opinions.",
      rule26Required: true,
      requiresEvidence: true,
    },
    {
      key: "qualifications",
      title: "Qualifications",
      instructions:
        "Use the expert profile for relevant training, accreditation, education, experience, and publications from the preceding ten years. Do not infer qualifications.",
      rule26Required: true,
      requiresEvidence: false,
    },
    {
      key: "prior_testimony",
      title: "Prior Testimony (Last 4 Years)",
      instructions:
        "List cases in which the expert testified at trial or deposition during the previous four years.",
      rule26Required: true,
      requiresEvidence: false,
    },
    {
      key: "compensation",
      title: "Statement of Compensation",
      instructions:
        "State the compensation to be paid for the study and testimony.",
      rule26Required: true,
      requiresEvidence: false,
    },
  ],
};

// DRAFT forensic vocational-rehabilitation template. Encodes the RAPEL framework
// (Weed) section structure and the Rule 26(a)(2)(B) backbone, derived from
// published methodology (RAPEL, TSA via DOT/O*NET, labor-market survey, Daubert
// readiness). NOT yet validated by an expert design partner — that validation is
// plan Must-Have #2 and gates Phase 1. Every section instruction enforces the
// non-negotiable rule: capture and structure the expert's OWN findings; never
// originate a fact, restriction, occupation, wage range, or opinion. RAPEL
// components map to sections as: R=rehabilitation_plan, A=transferable_skills,
// P=labor_market_survey, E=earning_capacity, L=labor_force_participation.
export const VOCREHAB_TEMPLATE: DisciplineTemplate = {
  discipline: "Forensic Vocational Rehabilitation",
  version: "0.1.0-draft-rapel",
  standardRef: "RAPEL (Weed); Fed. R. Civ. P. 26(a)(2)(B)",
  sections: [
    {
      key: "scope_of_assignment",
      title: "Referral and Assignment",
      instructions:
        "State the retaining party, date of evaluation, and the precise vocational/earning-capacity question the expert was retained to answer. A clearly scoped assignment supports a Daubert reliability inquiry; admissibility remains a judicial determination. Ground in the engagement letter.",
      rule26Required: false,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Is the retaining party and the precise referral question stated?", mentions: ["retained", "retaining"] },
        { q: "Is the date of the assignment or evaluation given?" },
      ],
    },
    {
      key: "summary_of_opinions",
      title: "Summary of Opinions",
      instructions:
        "Lead with the expert's bottom-line conclusions — the short statement an attorney scans first. This is a condensed restatement of the opinions developed in full below; it must never originate an opinion, range, or figure the expert has not stated, and the final loss-of-earning-capacity figure stays an explicit '[Expert input needed: ...]' until the expert (and economist) supply it. Every sentence cites the same evidence as the detailed sections it summarizes.",
      rule26Required: false,
      requiresEvidence: true,
    },
    {
      key: "background",
      title: "Identifying Data and Background",
      instructions:
        "Summarize demographics, education, training, medical/injury history, and vocational history — strictly as documented in supplied evidence. Do not infer facts the record does not state.",
      rule26Required: false,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Is the evaluee's age stated?", mentions: ["years old", "-year-old"] },
        { q: "Is the relevant labor market (commuting area) identified?", mentions: ["commuting", "labor market"] },
        { q: "Is the pre-injury occupation's exertional level stated?", mentions: ["exertional"] },
      ],
    },
    {
      key: "records_reviewed",
      title: "Records Reviewed",
      instructions:
        "Itemize every document the expert considered, one cited line per source. This is mechanical assembly from the supplied inputs.",
      rule26Required: false,
      requiresEvidence: true,
    },
    {
      key: "interview",
      title: "Interview and Vocational Evaluation",
      instructions:
        "Record the evaluee's own statements and self-reported limitations, attributed as self-report. Never elevate self-report into an adopted finding; that is the expert's judgment, captured separately.",
      rule26Required: false,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Is the date and method of the clinical interview stated?", mentions: ["interview on", "interviewed", "[date]"] },
        { q: "Are self-reported limitations attributed as self-report (not adopted findings)?", mentions: ["self-report", "self-reported"] },
      ],
    },
    {
      key: "vocational_testing",
      title: "Vocational Testing",
      instructions:
        "List instruments administered and the resulting scores exactly as provided. Interpretation of scores is expert judgment — format only what the expert states.",
      rule26Required: false,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Are the instruments named and scores reported with their metrics (standard score / percentile / grade equivalent)?", mentions: ["standard score", "grade equivalent", "percentile", "WRAT"] },
      ],
    },
    {
      key: "functional_capacity",
      title: "Functional and Residual Capacity",
      instructions:
        "State the physical/cognitive restrictions the expert ADOPTS and their source (treating physician, FCE, IME). Making these driving assumptions explicit supports a Daubert reliability inquiry. Never originate or modify a restriction; capture the expert's adopted assumption and its citation. A conclusion that the evaluee cannot work in the future must rest on a physician or FCE opinion, never the vocational expert's own medical judgment (see Korbe v. Manchester).",
      rule26Required: false,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Is the source of each adopted restriction identified (treating physician / FCE / IME)?", mentions: ["treating physician", "FCE", "IME"] },
        { q: "Are the restrictions translated into exertional terms?", mentions: ["exertional", "sedentary", "light"] },
        { q: "Are pre-existing or coexisting conditions addressed and, where relevant, the vocational loss apportioned from any prior condition?", mentions: ["pre-existing", "apportion", "coexisting", "prior"] },
        { q: "Is any conclusion that the evaluee cannot work in the future tied to a physician/FCE opinion rather than the vocational expert's own medical judgment?", mentions: ["physician", "FCE", "medical"] },
      ],
    },
    {
      key: "transferable_skills",
      title: "Transferable Skills Analysis",
      instructions:
        "Present the TSA occupation table (tiered by transferability) with wage data, sourced to the OASYS/SkillTRAN run and DOT/O*NET data. The expert selects which occupations are genuinely realistic; the tool formats the table and never adds or drops an occupation. RAPEL 'Access' component.",
      rule26Required: false,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Is the TSA method and data source disclosed (e.g., OASYS / DOT / O*NET)?", mentions: ["OASYS", "SkillTRAN", "DOT", "O*NET"] },
        { q: "Where DOT worker traits (SVP/GED) are relied on, is the DOT-to-O*NET-SOC cross-walk addressed (the DOT, not O*NET, is the source of SVP/GED)?", mentions: ["DOT", "cross-walk", "crosswalk", "O*NET-SOC"] },
      ],
    },
    {
      key: "labor_market_survey",
      title: "Labor Market Survey",
      instructions:
        "Document the survey methodology, employers sampled, and wage/availability findings as provided. Placeability is the expert's real-world hireability judgment — capture it, never generate it. RAPEL 'Placeability' component.",
      rule26Required: false,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Is the commuting-area radius defined?", mentions: ["radius", "commuting area"] },
        { q: "Are the survey's employer data points documented with their source and date?", mentions: ["Exhibit A", "documented", "source and date"] },
        { q: "Is the expert's real-world hireability (placeability) judgment stated, distinct from mere job availability?", mentions: ["placeab", "hire", "realistic"] },
      ],
    },
    {
      key: "rehabilitation_plan",
      title: "Rehabilitation Plan",
      instructions:
        "Lay out the interventions, retraining, costs, and timeline the expert recommends, each grounded in supplied evidence. RAPEL 'Rehabilitation plan' component.",
      rule26Required: false,
      requiresEvidence: true,
    },
    {
      key: "earning_capacity",
      title: "Pre-Injury vs. Post-Injury Earning Capacity",
      instructions:
        "Present the expert's pre- and post-injury earning-capacity ranges (not single points) with their sources. The ranges are expert judgment; the tool formats and cross-references them and never computes or suggests a figure. When wage data is cited, prefer the median over the mean and report Bureau of Labor Statistics percentiles as supplied; do not average percentiles across different occupations. RAPEL 'Earning capacity' component.",
      rule26Required: false,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Are pre- and post-injury earning capacities expressed as ranges with their sources?", mentions: ["range", "per year"] },
      ],
    },
    {
      key: "labor_force_participation",
      title: "Labor Force Participation and Work-Life",
      instructions:
        "State the expert's opinion on realistic work consistency (full/part-time/intermittent) and any work-life-expectancy reduction, grounded in cited evidence. RAPEL 'Labor force participation' component.",
      rule26Required: false,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Is work-life expectancy addressed, or expressly deferred to the economist?", mentions: ["work-life", "worklife", "economist"] },
      ],
    },
    {
      key: "loss_of_earning_capacity",
      title: "Loss of Earning Capacity",
      instructions:
        "State the differential between pre- and post-injury earning capacity as the expert frames it. Present-value/discounting is typically the economist's role — insert an explicit '[Expert input needed: ...]' rather than computing a discounted total.",
      rule26Required: false,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Is present-value/discounting expressly left to the forensic economist?", mentions: ["economist", "present value"] },
      ],
    },
    {
      key: "opinions",
      title: "Opinions",
      instructions:
        "Restate the expert's own opinions to a reasonable degree of vocational certainty. The tool must never originate an opinion, range, or restriction; only format opinions the expert supplied.",
      rule26Required: true,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Is each opinion stated to a reasonable degree of vocational-rehabilitation certainty?", mentions: ["reasonable degree", "certainty"] },
        { q: "Does each opinion reflect your own independent analysis, rather than a restatement of another's conclusion?" },
      ],
    },
    {
      key: "basis_and_reasons",
      title: "Basis and Reasons",
      instructions:
        "For each opinion, give the basis and reasons, threading back to the functional capacity, TSA, labor-market survey, and earning-capacity sections, each cited. Showing the data-to-opinion path supports a Daubert reliability inquiry; admissibility remains a judicial determination.",
      rule26Required: true,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Is each opinion tied to a recognized methodology and the underlying data (Daubert reliability)?", mentions: ["RAPEL", "methodology"] },
      ],
    },
    {
      key: "facts_or_data_considered",
      title: "Facts or Data Considered",
      instructions:
        "Enumerate the facts and data considered, including government data sources relied on (DOT/O*NET/BLS/Census). One cited bullet per source.",
      rule26Required: true,
      requiresEvidence: true,
    },
    {
      key: "exhibits",
      title: "Exhibits",
      instructions:
        "List the exhibits used to summarize or support the opinions — TSA tables, labor-market-survey logs, wage printouts — mapped to supplied inputs.",
      rule26Required: true,
      requiresEvidence: true,
    },
    {
      key: "qualifications",
      title: "Qualifications",
      instructions:
        "Expert profile boilerplate: CRC/ABVE credentials and publications (last 10 years), from the expert profile, not case evidence.",
      rule26Required: true,
      requiresEvidence: false,
    },
    {
      key: "prior_testimony",
      title: "Prior Testimony (Last 4 Years)",
      instructions:
        "List of cases in which the expert testified at trial or deposition during the previous 4 years.",
      rule26Required: true,
      requiresEvidence: false,
    },
    {
      key: "compensation",
      title: "Statement of Compensation",
      instructions:
        "Statement of the compensation to be paid for the study and testimony.",
      rule26Required: true,
      requiresEvidence: false,
    },
  ],
};
