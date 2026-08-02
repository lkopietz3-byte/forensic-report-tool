import type { Metadata } from "next";
import { LegalPage, LegalH2 } from "../_components/LegalPage";

export const metadata: Metadata = {
  title: "AI-Use & Expert Authorship Disclaimer",
  description:
    "How Disclosed. is intended to be used: the expert prepares, reviews, adopts, and signs; the tool assists with structure, citations, and formatting.",
};

export default function DisclaimerPage() {
  return (
    <LegalPage title="AI-Use & Expert Authorship Disclaimer" updated="July 27, 2026">
      <p>
        This page explains, in plain terms, what Disclosed. does and does not do,
        so there is no ambiguity about who is responsible for an expert report
        prepared with it.
      </p>

      <LegalH2>The tool assists; the expert prepares and signs</LegalH2>
      <p>
        Disclosed. organizes and formats findings, data, and opinions the expert
        supplies. Its drafting prompt restricts the model to supplied material,
        its citation IDs can resolve only to sources in the report, and export
        is blocked when a factual sentence lacks a source marker. Those controls
        reduce risk; they do not prove that a cited source is accurate or
        semantically supports the sentence, and they do not make AI output
        error-free.
      </p>

      <LegalH2>The expert prepares, reviews, verifies, signs, and is responsible</LegalH2>
      <p>
        The expert reviews, verifies, edits, and adopts all content of the
        report. Federal Rule of Civil Procedure 26(a)(2)(B) requires a covered
        report to be prepared and signed by the witness. Disclosed. does not make
        a legal determination about authorship; the witness remains responsible
        for preparing, adopting, and signing the report, and for the accuracy,
        completeness, methodology, and opinions it contains.
      </p>

      <LegalH2>Admissibility is the court&apos;s decision</LegalH2>
      <p>
        References on this site to Rule 26, Daubert, or &ldquo;defensible
        methodology&rdquo; describe the structure and the disclosure record the
        tool helps produce. They are not a promise that any report, or any AI
        disclosure, will be admitted or accepted in any proceeding. Admissibility
        and the sufficiency of any disclosure are determined by the court.
      </p>

      <LegalH2>About the matters we cite</LegalH2>
      <p>
        We reference public developments such as the discovery order in{" "}
        <em>Conservation Law Foundation v. Shell</em> (D. Conn. 2026) and reports
        of expert testimony excluded over AI-hallucinated citations to explain why
        documenting AI use matters. These are illustrations of an emerging area of
        practice, not legal advice about your matter.
      </p>

      <LegalH2>Not legal advice</LegalH2>
      <p>
        Disclosed. is a software tool, not a law firm, and nothing here is legal
        advice. Confirm with supervising counsel that uploading any given
        material is consistent with your protective orders, privilege
        obligations, and professional rules.
      </p>
    </LegalPage>
  );
}
