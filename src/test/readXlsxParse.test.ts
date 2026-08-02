import { describe, it, expect } from "vitest";
import readXlsxFile from "read-excel-file/node";
import { sheetsToText } from "@/app/intake/readDocumentFile";

// Proves the .xlsx → text path works end-to-end on a REAL workbook after the
// migration off the unmaintained npm `xlsx`/SheetJS package. The fixture
// (src/test/fixtures/sample.xlsx) was generated with openpyxl; re-create it with:
//   python3 -c "import openpyxl; wb=openpyxl.Workbook(); ws=wb.active; ws.title='Earnings';
//   ws.append(['Year','Annual Wage','Worker']); ws.append([2019,52000,'Smith, John']);
//   ws.append([2020,54500,'Smith, John']); s=wb.create_sheet('Summary');
//   s.append(['Metric','Value']); s.append(['Total loss','$1,200,000']);
//   wb.save('src/test/fixtures/sample.xlsx')"
// The /node build shares the exact parser used by /browser in the app, so this
// runs headless in CI while still exercising the real reader.
describe("xlsx extraction via read-excel-file", () => {
  it("extracts cell text from a real multi-sheet .xlsx", async () => {
    const sheets = await readXlsxFile("src/test/fixtures/sample.xlsx");
    const text = sheetsToText(sheets);
    // Both sheets present, each headed by its name (multi-sheet workbook).
    expect(text).toContain("## Earnings");
    expect(text).toContain("## Summary");
    // Header row + numeric cells survive.
    expect(text).toContain("Year,Annual Wage,Worker");
    expect(text).toContain("2019,52000");
    // Comma-bearing values are CSV-escaped, not split into phantom columns.
    expect(text).toContain('"Smith, John"');
    expect(text).toContain('"$1,200,000"');
  });

  it("renders a single-sheet workbook without a sheet header", () => {
    const text = sheetsToText([{ sheet: "Only", data: [["a", "b"], [1, 2]] }]);
    expect(text).toBe("a,b\n1,2");
    expect(text).not.toContain("## Only");
  });

  it("escapes embedded quotes and skips empty sheets", () => {
    const text = sheetsToText([
      { sheet: "S1", data: [['He said "hi"', null]] },
      { sheet: "Empty", data: [[], [null]] },
    ]);
    expect(text).toContain('"He said ""hi"""');
    expect(text).not.toContain("## Empty");
  });
});
