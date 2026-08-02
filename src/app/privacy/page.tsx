import type { Metadata } from "next";
import { LegalPage, LegalH2 } from "../_components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description:
    "Early-access Privacy Notice for Disclosed.: what we collect, where confirmed text goes, provider retention, and the limits on real-matter use.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Notice" updated="July 27, 2026">
      <p>
        This notice explains what personal information Disclosed. collects and
        how we use it. The Service is in early access. It covers the website,
        waitlist and design-partner forms, help and feedback, account features,
        and the preview workspace.
      </p>

      <LegalH2>1. Who we are</LegalH2>
      <p>
        Disclosed. is operated by the Disclosed. team. The operator&apos;s full
        legal identity and address will be added before real-matter use or public
        billing. For a privacy question or rights request, email
        privacy@disclosed.app.
      </p>

      <LegalH2>2. What we collect</LegalH2>
      <ul className="list-disc space-y-2 pl-6">
        <li>your email address;</li>
        <li>
          your name, credentials, discipline, approximate report volume, and the
          written answers you choose to include in a design-partner application;
        </li>
        <li>
          help or feedback messages, an optional reply email, the page on which
          you sent the message, and basic browser/user-agent information;
        </li>
        <li>
          the page or referral source of a sign-up, used to understand which
          messaging reaches which experts;
        </li>
        <li>
          account and billing records, including an authentication identifier,
          subscription or credit status, and Stripe customer identifiers (we do
          not receive full payment-card details); and
        </li>
        <li>basic server and security logs, such as IP address and timestamp.</li>
      </ul>

      <LegalH2>3. How we use information</LegalH2>
      <ul className="list-disc space-y-2 pl-6">
        <li>to provide, secure, troubleshoot, and improve the Service;</li>
        <li>to contact you about early access and design-partner slots;</li>
        <li>to understand demand and product needs across disciplines;</li>
        <li>to respond to help and privacy requests; and</li>
        <li>to administer accounts, report credits, and paid service if enabled.</li>
      </ul>
      <p>
        We do not sell personal information and do not share it for
        cross-context behavioral advertising. Product emails include a way to
        opt out of marketing.
      </p>

      <LegalH2>4. Case materials — special handling and current limits</LegalH2>
      <p>
        Forensic case materials may be subject to attorney-client privilege, the
        work-product doctrine, protective orders, privacy laws, or professional
        confidentiality obligations. During early access, use only the fictional
        worked example or material that has been properly de-identified. Do not
        submit a real matter, personal identifiers, protected health information,
        privileged material, trade secrets, or anything covered by a protective
        order. Counsel-reviewed terms and a zero-data-retention commitment are
        not yet in place.
      </p>
      <p>
        Your original PDF, Word, spreadsheet, or image file is parsed in your
        browser, and the document reader does not upload those file bytes. After
        you review the extracted text and ask the Service to structure it, that
        confirmed text is sent to the Disclosed. server. If AI assistance is on,
        the confirmed text is also sent to Anthropic. If no-AI mode is on, the
        server applies fixed rules and does not send the text to a model
        provider. Disclosed. does not save work-session text to an account unless
        you sign in and choose to save a report. Routine infrastructure may still
        process request metadata, and Anthropic applies the retention described
        in Section 5.
      </p>
      <p>
        <strong>Medical records and protected health information.</strong>{" "}
        Disclosed. is not a healthcare provider, health plan, or clearinghouse,
        and does not offer or sign Business Associate Agreements at this stage.
        The early-access Service is not approved for medical records or protected
        health information. Do not submit them.
      </p>

      <LegalH2>5. AI training and model-provider retention</LegalH2>
      <p>
        Disclosed. does not use customer case materials, report content, or
        work-session content to train or fine-tune a model. Anthropic states that
        commercial API inputs and outputs are not used to train its models unless
        the customer opts in, which Disclosed. does not do. Under Anthropic&apos;s
        standard API policy, inputs and outputs are automatically deleted from
        its backend within 30 days, subject to stated exceptions for
        usage-policy enforcement or law. Disclosed. does not currently have an
        approved zero-data-retention arrangement or Business Associate Agreement
        with Anthropic.
      </p>
      <p>
        See Anthropic&apos;s{" "}
        <a
          href="https://privacy.anthropic.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data"
          className="underline"
          rel="noreferrer"
        >
          commercial data-retention explanation
        </a>
        . Provider policies can change; this notice will be updated before a
        material change is applied to previously collected data.
      </p>

      <LegalH2>6. Service providers</LegalH2>
      <p>
        We share information only with providers used to operate the Service and
        only for their functions:
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>Vercel</strong> — website and application hosting;
        </li>
        <li>
          <strong>Supabase</strong> — database and authentication;
        </li>
        <li>
          <strong>Stripe</strong> — checkout, payments, and billing portal, if
          paid service is enabled; and
        </li>
        <li>
          <strong>Anthropic</strong> — the commercial model API used when AI
          assistance is enabled.
        </li>
      </ul>
      <p>
        These providers may process information in the United States and other
        locations described in their terms. We may also disclose information if
        required by valid legal process, to protect the Service and its users, or
        as part of a business transaction subject to appropriate safeguards. We
        will provide notice where legally permitted and appropriate.
      </p>

      <LegalH2>7. Cookies and browser storage</LegalH2>
      <p>
        We use strictly necessary first-party cookies and browser storage to
        maintain sign-in state and operate the workspace. Stripe may set
        necessary cookies on its own checkout and billing pages. We do not use
        advertising cookies, third-party behavioral analytics, or cross-site
        tracking in the current product.
      </p>

      <LegalH2>8. Retention</LegalH2>
      <p>
        We retain waitlist, application, and feedback information while it is
        reasonably needed for early-access outreach, product research, security,
        or support, and review those records for deletion when they are no longer
        needed. If you create an account and save a report, we retain that
        content until you delete the saved report in the workspace or ask us to
        close the account,
        subject to limited backups, fraud prevention, legal obligations, and
        dispute records. Anthropic&apos;s separate standard API retention is
        described in Section 5. You may request deletion at any time.
      </p>

      <LegalH2>9. Your choices and rights</LegalH2>
      <p>
        Depending on where you live, you may have rights to access, correct,
        delete, or receive a copy of personal information, and to opt out of
        marketing. To make a request, email privacy@disclosed.app. We may need to
        verify that you control the relevant email or account. You may appeal a
        denied request by replying with &ldquo;privacy appeal&rdquo; in the
        subject line, and you may contact your local privacy regulator.
      </p>

      <LegalH2>10. Children</LegalH2>
      <p>
        The Service is intended for professional use and is not directed to
        anyone under 18. We do not knowingly collect personal information from
        minors.
      </p>

      <LegalH2>11. Security and incident limits</LegalH2>
      <p>
        We use transport encryption, provider encryption at rest, access
        controls, row-level database isolation, bounded inputs, and restricted
        server credentials. No safeguard makes a service perfectly secure, and
        Disclosed. does not currently claim a formal security certification. We
        will provide notices of a qualifying data incident as required by
        applicable law.
      </p>

      <LegalH2>12. Changes</LegalH2>
      <p>
        We will post changes here and update the date above. We will provide
        additional notice before a material change to how saved content is used
        where required. Less protective practices will not be applied
        retroactively without an appropriate legal basis or consent.
      </p>

      <p>
        Disclosed. is not a law firm and cannot advise you whether a particular
        upload is permissible in your matter.
      </p>
    </LegalPage>
  );
}
