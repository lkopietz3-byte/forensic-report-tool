# Help Center — Disclosed. Knowledge Base

> **General information, not legal advice. Disclosed. is not a law firm. Verify
> the rules for your jurisdiction and matter before relying on any
> AI-disclosure practice.**

---

## Getting started

**Q1. What does Disclosed. actually do?**

The tool takes the findings, evidence, and notes you supply and structures them
into a Rule 26(a)(2)(B)-organized report — with every factual sentence tied to
a source you provided. It also keeps an automatic, append-only record of how AI
was used during that structuring, which becomes an AI-Disclosure Appendix in
your export. You review, edit, and sign the result. Authorship and professional
responsibility stay with you throughout.

**Q2. Who is the tool built for?**

Forensic expert witnesses in federal civil matters who need a Rule
26(a)(2)(B)-organized report and a clear record of any AI use they can
produce if asked. The first working template covers vocational rehabilitation
and earning-capacity opinions. Engineering and accident reconstruction templates
are in preview; join the waitlist to help shape the format for your discipline.

**Q3. What do I need to get started?**

A case caption, your name and credentials, and at least one evidence item — a
pasted excerpt, a document you load (PDF, Word, Excel, or scanned image), or a
note you type in. The tool parses the document in your browser; the file itself
never leaves your computer.

**Q4. Do I need an account?**

No account is required to build and preview a report. An account (free, with
magic-link sign-in) lets you save reports and reopen them later. Export to Word
or PDF uses a report credit once billing opens. Existing legacy members retain
their access, but new unlimited memberships are not sold. The first report
credit is free.

**Q5. How do I try it before committing to anything?**

Go to `/workspace`, click "Load a worked example," hit "Build & preview," then
download the Word or PDF. No card, no sign-in required for the preview. The
sample export at `/sample` shows a finished report with its AI-Disclosure
Appendix so you can see what travels with the document.

**Q6. What file types can I bring in as evidence?**

PDF, Word (.docx), Excel (.xlsx), HTML, plain-text formats (.txt, .md, .csv,
.tsv, .json, .xml), and images or scanned PDFs (read by OCR in your browser,
no server involved). OCR output is flagged "Read by OCR — check against the
original" so you review it before it becomes evidence. RTF and legacy .doc are
not supported; a mis-read is worse than no read.

---

## Evidence and grounding

**Q7. What is "closed-world grounding" and why does it matter?**

Every factual sentence in the report must carry a citation marker pointing to
evidence you supplied. The drafting prompt is restricted to supplied evidence,
and a missing or unknown source ID blocks export. That mechanical check does not
prove that a recognized source semantically supports the sentence or that the
source is true. The expert must compare every statement to its source before
signing.

**Q8. What do the green, amber, and red colors in the editor mean?**

As you type or edit a section, each sentence is grounded in real time against
the evidence you've added:

- **Green** — the sentence cites at least one source you supplied and that
  source is in your evidence list.
- **Amber** — the sentence contains a `[Expert input needed: …]` placeholder
  or hasn't been cited yet; the tool is waiting for your input.
- **Red** — the sentence makes a factual claim but has no citation, or cites
  an ID that isn't in your evidence list.

Red or uncited sentences block export; you resolve them by adding the
missing evidence or revising the sentence.

**Q9. Why did the tool flag my sentence even though I know the source?**

Grounding is about what's in your evidence list, not what you know. If you
added the source but used a citation ID that doesn't match the one in your list,
the system treats it as unresolved. Check that the `[[E:id]]` marker in your
sentence matches exactly the ID shown for that evidence item. You can click the
citation chip in the Sources panel to insert the correct marker at your cursor.

**Q10. What does `[Expert input needed: …]` mean?**

It means the tool reached a point in the structure where an opinion or figure is
expected — a post-injury earning range, an adopted TSA conclusion — and nothing
in your evidence resolved it. The placeholder names the gap precisely so you
know what to supply. The tool does not fill these in; that's your professional
judgment. Export is blocked until every placeholder is resolved or the section
is removed.

**Q11. Can I add an evidence item by typing it in rather than uploading a document?**

Yes. Every evidence item has a "content" field you can type into directly. Enter
the material, note the source and page in the "Source / location" field, and
assign it to the appropriate section. It's treated identically to extracted
text; any sentence that cites it must use its assigned ID.

---

## The AI-Disclosure record

**Q12. What is in the AI-Disclosure Appendix?**

For each AI-assisted section: the section name, the model name and version that
processed it, and the exact list of evidence items the model was given — and
nothing it was not given. The appendix also carries a statement that the expert
reviewed, verified, edited, and adopted all content, and that no AI-produced
text entered the report without that review. In no-AI mode the appendix states
plainly that no model produced any text.

**Q13. What does "tamper-evident" mean? Is the record tamper-proof?**

The audit log is append-only and hash-chained: each entry includes a
cryptographic hash of the previous entry, so the chain can be verified from
the beginning on every load. If the chain has been altered after the fact,
verification fails and the workspace reports it. "Tamper-evident" means
tampering is **detectable**, not that it's impossible. The tool cannot
physically prevent someone with direct database access from altering a record;
what it can do — and does — is make the alteration visible. We describe this as
"tamper-evident," not "tamper-proof" or "immutable."

**Q14. Can the Appendix be removed from the export?**

The AI-Disclosure Appendix is part of every export by design. Suppressing it
would defeat the product's core purpose. If you use no-AI mode, the appendix
still appears and states that no AI produced any text — which is itself a
disclosure.

**Q15. What is no-AI mode and when would I use it?**

No-AI mode assembles and formats your report using a fixed, rule-based engine
with no language model involved. Every sentence still has to cite evidence you
supplied; the closed-world grounding and the export gate are unchanged. The
AI-Disclosure Appendix then states `deterministic-structurer (no-ai-v1)` as the
method — an accurate record that no model wrote anything. Use it when you want
the structure and citation checking without any AI text in the chain, or when
your retaining agreement or firm policy requires it.

---

## Editing and citations

**Q16. Can I edit the structured text after the tool produces it?**

Yes, and the system expects it. Click "Edit" on any section to open a text
editor pre-loaded with the structured draft. Make your changes. When you save,
the tool re-grounds the section against your evidence: any sentence you added
or changed is checked the same way as the original. An uncited factual addition
blocks export just as it would in the original pass.

**Q17. How do I add a citation while editing?**

In the section editor, click "Cite" next to any evidence item in the Sources
panel. The citation marker (`[[E:id]]`) inserts at your cursor position, not
at the end of the text, so you can place it at the exact sentence you're
supporting. You can also type the marker directly if you know the ID.

**Q18. What happens if I cite the same source in multiple sections?**

That's fine and expected. The same evidence item can support sentences in
different sections; the grounding check is per-sentence, not per-section.
The disclosure appendix records each section's evidence list separately, so the
record reflects exactly which sources were behind which section.

**Q19. Can I reorder my evidence items?**

Yes. Each evidence row has up and down arrows to change its position in the
list. The narrative order of sections generally follows the order in which
evidence appears, so reordering items lets you adjust the flow without
re-entering everything.

---

## Exporting

**Q20. What export formats are available?**

Word (.docx) and PDF. Both formats are generated from the same report in the
same export call; there's no separate charge for the second format.

**Q21. What is "court formatting"?**

The export applies continuous line numbers in the left margin, Century
Schoolbook typeface (the federal standard for expert reports), and a cover
block with your name, credentials, matter caption, and retaining counsel.
These are formatting choices; they do not constitute a guarantee of compliance
with any particular court's local rules. Verify your court's requirements.
(General information, not legal advice.)

**Q22. What happens to figures — photos or diagrams I attached to evidence?**

An evidence item that has an image attached renders as a numbered figure in a
Figures section after the report body. It's cited by evidence ID like any other
source; the grounding rules are unchanged. Two current limits: (1) images are
not stored when you save a report — they stay in the current session and embed
when you export, but you'll need to re-attach them if you reopen the saved
report later; (2) the exporter accepts PNG only at this time. JPEG support is
on the roadmap.

**Q23. Why did export fail with an error about ungrounded sentences?**

The export gate is hard: if any factual sentence in the report lacks a citation
to an evidence item you supplied, or cites an ID that isn't in your list, the
export returns an error and shows you which sentences are blocked. This is
intentional. Resolve the flagged sentences — supply the missing source, revise
the claim, or remove the sentence — and export again.

---

## Confidentiality and data

**Q24. Does the tool upload my evidence files to a server?**

No. Document parsing (PDF, Word, Excel, scanned images) runs entirely in your
browser using client-side libraries. The file bytes never leave your computer.
Only the text you review and confirm — after you click "Pull items" — is sent
for structuring, and only that text. This is a deliberate confidentiality
feature, not a technical limitation.

**Q25. Does Disclosed. train its models on my case data?**

No. We do not use your case data to train models. That is a standing commitment.
We process content via the Anthropic API under its default data-handling terms,
which do not use customer inputs for training. We are working to formalize a
written zero-retention agreement with our model provider; until that is in
place, we describe this as a commitment we are operationally standing up, not a
signed certification. Our privacy terms are in draft pending legal review.

**Q26. What is stored when I save a report versus when I don't?**

If you don't save: everything stays in your browser session and is gone when
you close the tab. Nothing is written to our servers.

If you save (requires an account): your evidence text, section assignments,
expert edits, formatting choices, and the audit hash chain are written to your
account. Images attached to evidence items are **not** stored on save — the
evidence text and citations round-trip intact, but the pixel data is stripped
from the saved payload. A save confirmation note tells you this when it applies.
You remain responsible for determining whether uploading any material to a
cloud service is permitted under any protective order or confidentiality
agreement in your matter.

---

## Billing and credits

**Q27. How does pricing work?**

Reports are priced per export. The first report is free. After that, you can buy
a single report credit for $250 or a five-report pack for $1,000. New unlimited
memberships are not being sold while founding-pilot usage and support costs are
measured. Pricing is still being validated and may change before public billing.

**Q28. Do report credits expire or auto-renew?**

No automatic renewal is attached to one-time report credits. The planned credits
do not expire and are non-refundable once used for an export, except where law
requires otherwise. Word, PDF, and re-downloads of the same report version share
one credit; a materially revised version uses another.

---

## Trust and limits

**Q29. What does this tool NOT do?**

This is the most important section in the help center.

- **Does not originate opinions, facts, numbers, or citations.** The tool
  structures and formats content you supply. Every factual sentence must trace
  to evidence you provided. The tool has no ability to invent a wage figure,
  diagnose a condition, or create a source that wasn't in your file. If it can't
  ground a sentence, it flags it and blocks export.

- **Does not determine admissibility.** Whether your report — or the AI-use
  disclosure it contains — satisfies a particular court's standards is the
  court's determination. No tool can guarantee admissibility. The product is
  designed to support disclosure and to document AI use honestly; the legal
  sufficiency of that disclosure is outside our authority to declare.

- **Does not make the audit chain tamper-proof.** The chain is tamper-evident:
  alteration is detectable. We cannot prevent someone with direct database
  access from modifying a record; we can — and do — make the modification
  visible when the chain is re-verified.

- **Does not hold SOC 2 certification.** We are a pre-revenue product in
  validation. We have data-handling commitments and engineering controls
  (encryption in transit and at rest, RLS-enforced user isolation, session
  isolation for unauthenticated users), but we do not hold formal security
  certifications. We describe our protections honestly as commitments, not as
  certifications.

- **The vocational rehabilitation template is still being validated.** The
  vocational rehab template was built from peer-reviewed methodology and desk
  research. It is being red-teamed with a design partner before it's treated
  as production-ready. Use it as a structuring aid and apply your own
  professional judgment to every section. [VERIFY: confirm whether the design
  partner validation is underway or still pending at time of publication.]

- **Does not validate your evidence.** The grounding check verifies that a
  sentence cites a source you supplied. It does not verify that the source is
  accurate, complete, or admissible. You remain responsible for the underlying
  evidence and for confirming that your opinions are supported by sufficient
  facts and data under Fed. R. Evid. 702.

> This help content is general information, not legal advice. Disclosed. is not
> a law firm. Verify the applicable rules for your jurisdiction before relying
> on any AI-disclosure practice described here.
