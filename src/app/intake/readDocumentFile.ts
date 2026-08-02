// Client-side document reader for the "Try it" intake demo.
//
// The file is read ENTIRELY in the browser — its bytes never leave the page.
// Only the extracted text is later sent to /api/intake/extract (transiently,
// nothing stored), exactly as if the expert had pasted it. That keeps the
// confidentiality posture of a litigation-sensitive case file intact.
//
// Honesty: this reads the expert's OWN document and hands its text downstream
// for segmentation. It never originates content (CLAUDE.md invariant). PDF and
// Word (.docx) are parsed with pdfjs-dist / mammoth, loaded lazily so they only
// enter the client bundle when actually used. If a document yields no text
// (e.g. a scanned/image PDF), the reader says so rather than returning a silent
// partial read — for court evidence, a wrong read is worse than no read.

/** Cap an uploaded file so a huge document can't hang the page. */
export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB (PDFs run large)

/** Mirror the textarea cap so upload and paste behave identically downstream. */
const MAX_TEXT_CHARS = 50_000;

const TEXT_EXTENSIONS = [
  ".txt",
  ".text",
  ".md",
  ".markdown",
  ".csv",
  ".tsv",
  ".tab",
  ".log",
  ".json",
  ".xml",
  ".yaml",
  ".yml",
  ".rst",
];

const HTML_EXTENSIONS = [".html", ".htm", ".xhtml"];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif", ".tif", ".tiff"];
// OOXML spreadsheets only. Legacy binary .xls/.xlsb are handled as "legacy"
// (declined with a "save as .xlsx" message) — see classifyUpload. We read these
// with read-excel-file, a maintained dependency-free reader; the old npm
// `xlsx`/SheetJS build (which could read .xls) is unmaintained on npm and carried
// unpatched advisories, so it was removed.
const SPREADSHEET_EXTENSIONS = [".xlsx", ".xlsm"];

/** Bound how many pages of a scanned PDF we OCR, so one upload can't run for minutes. */
const MAX_OCR_PAGES = 10;

export interface ReadDocumentResult {
  /** Extracted text, capped at MAX_TEXT_CHARS. */
  text: string;
  /** True if the document was longer than the cap and was trimmed. */
  truncated: boolean;
  /** A clean source label suggestion derived from the filename. */
  suggestedLabel: string;
  /**
   * True when the text came from OCR (a photo or scanned document). OCR is
   * imperfect, so the caller MUST surface a "verify against the original"
   * prompt — the expert confirms every unit downstream regardless.
   */
  ocr: boolean;
}

export interface ReadDocumentOptions {
  /** Progress messages for slow reads (OCR). */
  onProgress?: (message: string) => void;
}

function extensionOf(name: string): string {
  const m = name.toLowerCase().match(/\.[^.]+$/);
  return m ? m[0] : "";
}

type FileLike = { name: string; type: string };

function isTextFile(file: FileLike): boolean {
  const name = file.name.toLowerCase();
  if ((file.type || "").startsWith("text/")) return true;
  if (file.type === "application/json") return true;
  return TEXT_EXTENSIONS.some((ext) => name.endsWith(ext));
}

/** How an uploaded file will be read. Pure and testable — no browser APIs. */
export type UploadKind =
  | "pdf"
  | "xlsx"
  | "docx"
  | "html"
  | "image"
  | "text"
  | "legacy"
  | "unsupported";

/**
 * Decide how to read a file from its name + MIME type alone. Order matters:
 * spreadsheets before docx (both are OOXML), and html/image before the generic
 * text path (text/html starts with "text/" and would otherwise leak raw tags).
 */
export function classifyUpload(file: FileLike): UploadKind {
  const ext = extensionOf(file.name);
  const type = file.type || "";
  if (ext === ".pdf" || type === "application/pdf") return "pdf";
  if (SPREADSHEET_EXTENSIONS.includes(ext) || type.includes("spreadsheetml")) {
    return "xlsx";
  }
  if (
    ext === ".docx" ||
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  if (HTML_EXTENSIONS.includes(ext) || type === "text/html") return "html";
  if (IMAGE_EXTENSIONS.includes(ext) || type.startsWith("image/")) return "image";
  if (ext === ".doc" || ext === ".rtf" || ext === ".xls" || ext === ".xlsb") return "legacy";
  if (isTextFile(file)) return "text";
  return "unsupported";
}

/** Strip the extension and tidy a filename into a citable source label. */
function labelFromFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

/** Collapse runaway whitespace without altering the words themselves. */
function tidy(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// --- Format-specific readers (lazy-loaded) -------------------------------

async function readPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // webpack/Next emits the worker as an asset and returns its URL.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  try {
    for (let i = 1; i <= doc.numPages; i += 1) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const line = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (line) pages.push(line);
    }
  } finally {
    await doc.destroy();
  }
  return pages.join("\n\n");
}

async function readDocx(file: File): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

// HTML → text via the browser's own parser (reliable, no dependency). Block-level
// elements get a trailing newline so paragraphs don't run together; scripts and
// styles are dropped so their source never leaks into the evidence.
async function readHtml(file: File): Promise<string> {
  const doc = new DOMParser().parseFromString(await file.text(), "text/html");
  doc.querySelectorAll("script, style, noscript, template, head").forEach((n) => n.remove());
  doc
    .querySelectorAll("p, div, br, li, tr, h1, h2, h3, h4, h5, h6, section, article, header, footer, blockquote")
    .forEach((n) => n.append("\n"));
  return doc.body?.textContent ?? doc.documentElement?.textContent ?? "";
}

// One spreadsheet cell → a CSV field: stringify, ISO-trim dates, and quote-escape
// anything containing a comma, quote, or newline.
function cellToCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Render parsed spreadsheet sheets as text: each sheet → CSV, multi-sheet
 * workbooks headed by the sheet name. Exported and pure so the extraction is
 * unit-tested against a REAL .xlsx without a browser (see readXlsxParse.test.ts).
 */
export function sheetsToText(
  sheets: ReadonlyArray<{ sheet: string; data: ReadonlyArray<ReadonlyArray<unknown>> }>,
): string {
  const parts: string[] = [];
  for (const sheet of sheets) {
    const csv = sheet.data.map((row) => row.map(cellToCsv).join(",")).join("\n");
    if (csv.trim()) parts.push(sheets.length > 1 ? `## ${sheet.sheet}\n${csv}` : csv);
  }
  return parts.join("\n\n");
}

// Spreadsheets → text via read-excel-file — a maintained, dependency-free,
// browser-side OOXML reader. (We moved off the npm `xlsx`/SheetJS build, which is
// unmaintained on npm and carried unpatched prototype-pollution/ReDoS advisories;
// read-excel-file pulls in zero transitive dependencies.) Each sheet becomes CSV;
// multi-sheet workbooks are headed by the sheet name. Only OOXML .xlsx/.xlsm are
// read; legacy binary .xls/.xlsb are declined upstream. The expert still reviews
// every cell downstream.
async function readXlsx(file: File): Promise<string> {
  const readXlsxFile = (await import("read-excel-file/browser")).default;
  return sheetsToText(await readXlsxFile(file)); // [{ sheet: name, data: rows }, …]
}

// --- OCR (self-hosted Tesseract; engine + model served from /public, no CDN) ---

type OcrWorker = { recognize: (input: unknown) => Promise<{ data: { text: string } }>; terminate: () => Promise<unknown> };

async function createOcrWorker(onProgress?: (m: string) => void): Promise<OcrWorker> {
  const Tesseract = await import("tesseract.js");
  // Engine mode 1 = LSTM only (matches the -lstm core variants we self-host).
  return (await Tesseract.createWorker("eng", 1, {
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract",
    langPath: "/tesseract",
    gzip: false, // we host an uncompressed eng.traineddata
    logger: (m: { status?: string; progress?: number }) => {
      if (onProgress && m.status === "recognizing text") {
        onProgress(`Reading text (OCR)… ${Math.round((m.progress ?? 0) * 100)}%`);
      }
    },
  })) as unknown as OcrWorker;
}

async function ocrImage(file: File, onProgress?: (m: string) => void): Promise<string> {
  onProgress?.("Reading text (OCR)…");
  const worker = await createOcrWorker(onProgress);
  try {
    const { data } = await worker.recognize(file);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

// Scanned PDF (no text layer): render each page to a canvas with pdfjs, then OCR
// it. Capped at MAX_OCR_PAGES so a huge scan can't run for minutes.
async function ocrPdf(file: File, onProgress?: (m: string) => void): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const worker = await createOcrWorker();
  const pages: string[] = [];
  try {
    const count = Math.min(doc.numPages, MAX_OCR_PAGES);
    for (let i = 1; i <= count; i += 1) {
      onProgress?.(`Reading text (OCR), page ${i} of ${count}…`);
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const { data } = await worker.recognize(canvas);
      if (data.text.trim()) pages.push(data.text.trim());
      canvas.width = 0;
      canvas.height = 0;
    }
  } finally {
    await worker.terminate();
    await doc.destroy();
  }
  return pages.join("\n\n");
}

// --- Entry point ----------------------------------------------------------

/**
 * Read a dropped/selected document into plain text for the intake demo.
 * Throws a user-facing Error for oversized, unsupported, unreadable, or empty
 * files. PDF/DOCX are parsed in the browser; only the extracted text is used.
 */
export async function readDocumentFile(
  file: File,
  opts: ReadDocumentOptions = {},
): Promise<ReadDocumentResult> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(
      "That file is over 15 MB. Upload a smaller excerpt, or paste the relevant text.",
    );
  }

  const onProgress = opts.onProgress;
  const route = classifyUpload(file);

  let raw: string;
  let kind: "pdf" | "docx" | "html" | "text" | "xlsx" | "ocr";

  try {
    if (route === "pdf") {
      raw = await readPdf(file);
      if (!raw.trim()) {
        // No text layer → it's a scan. OCR each page rather than declining.
        onProgress?.("No text layer found — running OCR…");
        raw = await ocrPdf(file, onProgress);
        kind = "ocr";
      } else {
        kind = "pdf";
      }
    } else if (route === "xlsx") {
      raw = await readXlsx(file);
      kind = "xlsx";
    } else if (route === "docx") {
      raw = await readDocx(file);
      kind = "docx";
    } else if (route === "html") {
      raw = await readHtml(file);
      kind = "html";
    } else if (route === "image") {
      raw = await ocrImage(file, onProgress);
      kind = "ocr";
    } else if (route === "legacy") {
      const ext = extensionOf(file.name);
      throw new Error(
        ext === ".xls" || ext === ".xlsb"
          ? "Legacy Excel (.xls/.xlsb) isn't supported — open it and Save As .xlsx, or paste the cells."
          : "Legacy .doc/.rtf isn't supported — save it as .docx, PDF, or HTML, or paste the text.",
      );
    } else if (route === "text") {
      raw = await file.text();
      kind = "text";
    } else {
      throw new Error(
        "Unsupported file type. Upload a PDF, Word, Excel, an image, HTML, or a text file, or paste the text.",
      );
    }
  } catch (err) {
    // Re-throw our own user-facing messages as-is; wrap parser internals.
    if (err instanceof Error && /isn't supported|Unsupported|over 15 MB/.test(err.message)) {
      throw err;
    }
    const label =
      route === "pdf"
        ? "PDF"
        : route === "docx"
          ? "Word document"
          : route === "html"
            ? "HTML file"
            : route === "xlsx"
              ? "spreadsheet"
              : route === "image"
                ? "image"
                : "file";
    throw new Error(
      `Couldn't read that ${label}. It may be corrupt or password-protected — paste the text instead.`,
    );
  }

  const isOcr = kind === "ocr";
  const text = tidy(raw);
  if (!text) {
    if (isOcr || route === "image") {
      throw new Error(
        "No text could be read from that scan — it may be too low-resolution or blank. Paste the text instead.",
      );
    }
    if (route === "xlsx") throw new Error("That spreadsheet has no readable cells.");
    throw new Error("That file has no readable text in it.");
  }

  return {
    text: text.slice(0, MAX_TEXT_CHARS),
    truncated: text.length > MAX_TEXT_CHARS,
    suggestedLabel: labelFromFilename(file.name),
    ocr: isOcr,
  };
}
