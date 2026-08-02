import type { Metadata } from "next";
import { LegalPage, LegalH2 } from "../_components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Early-access Terms of Service for Disclosed., a structuring and formatting tool for forensic expert-witness reports. Attorney review is still required before real-matter use.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="July 27, 2026">
      <p>
        These Terms govern your use of Disclosed. (the &ldquo;Service&rdquo;), a
        software tool that helps a qualified forensic expert organize and format
        their own source material and findings into an expert-witness report. By
        using the Service or submitting an early-access application, you agree to
        these Terms. If you do not agree, do not use the Service.
      </p>

      <LegalH2>1. The expert prepares, reviews, and signs</LegalH2>
      <p>
        Federal Rule of Civil Procedure 26(a)(2)(B) requires a covered expert
        report to be prepared and signed by the witness. Disclosed. assists with
        organization, citation linkage, formatting, and a record of tool use; it
        does not replace the witness&apos;s professional judgment. By using the
        Service, you represent and warrant that:
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>you are a qualified forensic expert within your stated discipline;</li>
        <li>
          you will review and independently verify every statement, source
          relationship, figure, citation, method, and conclusion before signing
          or disclosing a report;
        </li>
        <li>
          you remain the professional who prepares, adopts, and signs the
          finalized report and will make any disclosure required by the court,
          governing rules, retaining counsel, or your professional obligations;
          and
        </li>
        <li>
          you bear sole professional and legal responsibility for the accuracy,
          completeness, methodology, source support, and opinions in any report
          you produce using the Service.
        </li>
      </ul>
      <p>
        A citation link confirms only that a sentence names a source supplied to
        the Service. It does not establish that the source is true, complete,
        admissible, or actually supports the sentence. AI-assisted output can be
        wrong even when it contains a valid source marker.
      </p>
      <p>
        Disclosed. makes no representation that use of the Service will make any
        report admissible in any proceeding, or that any output will satisfy any
        court&apos;s requirements. Admissibility is determined exclusively by the
        court.
      </p>

      <LegalH2>2. Early-access data boundary</LegalH2>
      <p>
        During early access, you may use only fictional or properly de-identified
        material. You must not submit a real matter, protected health information,
        privileged material, personal identifiers, trade secrets, or material
        subject to a protective order. You are responsible for obtaining any
        authorization or informed consent required before using a third-party
        technology service. Disclosed. does not offer a Business Associate
        Agreement or zero-data-retention service at this stage.
      </p>

      <LegalH2>3. No warranty of admissibility, accuracy, or uninterrupted operation</LegalH2>
      <p>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as
        available.&rdquo; To the fullest extent permitted by law, Disclosed.
        disclaims all warranties, express or implied, including any warranty
        that the Service will produce reports that are admissible, legally
        sufficient, or procedurally compliant; that output will be free from
        errors, omissions, interruptions, loss, or security incidents; of
        merchantability, non-infringement, or fitness for a particular purpose,
        including use in litigation; or that the AI-Disclosure Appendix will
        satisfy any specific court&apos;s disclosure requirements. You remain
        responsible for keeping your own source files and final backups.
      </p>

      <LegalH2>4. Limitation of liability</LegalH2>
      <p>
        To the fullest extent permitted by law, in no event will Disclosed. be
        liable for any indirect, incidental, special, consequential, or punitive
        damages, including lost profits, loss of data, loss of a case, or damage
        to professional reputation. Disclosed.&apos;s total cumulative liability
        for any claim arising out of or related to these Terms or the Service
        will not exceed the greater of the total fees you paid in the twelve
        months preceding the claim or one hundred U.S. dollars ($100). Some
        jurisdictions do not allow certain exclusions or caps; there, liability
        is limited to the minimum extent permitted by law.
      </p>

      <LegalH2>5. Acceptable use</LegalH2>
      <p>You agree that you will not use the Service to:</p>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          fabricate or introduce into a report any fact, opinion, measurement,
          citation, or conclusion you have not independently verified;
        </li>
        <li>
          submit material you are prohibited from disclosing to a third-party
          service or that falls outside the early-access data boundary;
        </li>
        <li>
          use output in a matter where you are disqualified, barred, or subject
          to a prohibiting conflict of interest;
        </li>
        <li>
          reverse-engineer or attempt to extract underlying models, system
          prompts, credentials, or confidential logic; or
        </li>
        <li>
          allow another person to adopt a report as their professional opinion
          without that person&apos;s own qualified review and authorization.
        </li>
      </ul>

      <LegalH2>6. Your content and limited processing permission</LegalH2>
      <p>
        You retain all right, title, and interest in the source materials you
        provide and in the finalized report you prepare, review, and sign. You
        grant Disclosed. and its service providers a limited permission to host,
        transmit, reproduce, and process that content only as necessary to
        operate, secure, support, and provide the Service. Disclosed. does not use
        customer content to train or fine-tune a model. When AI assistance is
        enabled, confirmed text is sent through the Anthropic commercial API,
        whose standard retention is described in the Privacy Notice. The
        Service&apos;s software, prompts, interface, templates,
        disclosure-record format, and audit methodology remain proprietary to
        Disclosed.
      </p>

      <LegalH2>7. Accounts and security</LegalH2>
      <p>
        You are responsible for controlling access to your email account and
        one-time sign-in links, for promptly reporting suspected unauthorized
        access, and for not sharing an authenticated session. You must not probe,
        disrupt, overload, scrape, or attempt to bypass any access, rate, export,
        validation, or billing control.
      </p>

      <LegalH2>8. Fees and billing</LegalH2>
      <p>
        No charge is due unless a price and purchase terms are shown to you at
        checkout and you affirmatively complete payment through Stripe.
        Recurring services, if offered, renew at the period and price disclosed
        at checkout until canceled through the billing portal. One-time report
        credits are non-transferable and are consumed under the rules shown at
        purchase. Fees are non-refundable except as stated at checkout or
        required by law. You are responsible for applicable taxes.
      </p>

      <LegalH2>9. Suspension and termination</LegalH2>
      <p>
        You may ask us to close your account at any time. We may suspend or
        terminate access if we reasonably believe you have violated these Terms,
        created a security or legal risk, or used the Service in a way that may
        harm another person. Provisions that by their nature should survive —
        including content ownership, disclaimers, limitations of liability, and
        amounts owed — survive termination.
      </p>

      <LegalH2>10. Indemnity</LegalH2>
      <p>
        To the fullest extent permitted by law, you will defend and indemnify
        Disclosed. and its operators against third-party claims arising from
        content you submit, your signed report or professional opinions, your
        unlawful or unauthorized use, or your material breach of these Terms.
        This does not require indemnity for a claim to the extent caused by
        Disclosed.&apos;s own unlawful conduct.
      </p>

      <LegalH2>11. Changes and contact</LegalH2>
      <p>
        We may update these Terms prospectively by posting a revised date. If a
        material change affects saved content or paid service, we will provide
        notice before the change takes effect where required. Questions or
        account-closure requests may be sent to hello@disclosed.app.
      </p>

      <LegalH2>12. Not legal advice</LegalH2>
      <p>
        Disclosed. is a software company, not a law firm, and does not provide
        legal advice. Nothing in the Service or on this site is a substitute for
        advice from retaining counsel or the judgment of the qualified
        professional who prepares and signs the report.
      </p>
    </LegalPage>
  );
}
