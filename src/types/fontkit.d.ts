// Minimal ambient declaration for the slice of fontkit we use. fontkit (a
// dependency of pdfkit) ships no type declarations and there is no
// @types/fontkit; we only need glyph-coverage queries for the PDF export guard.
declare module "fontkit" {
  export interface Font {
    hasGlyphForCodePoint(codePoint: number): boolean;
  }
  interface Fontkit {
    create(buffer: Buffer | Uint8Array): Font;
  }
  const fontkit: Fontkit;
  export default fontkit;
}
