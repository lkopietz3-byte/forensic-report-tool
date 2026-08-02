import { ImageResponse } from "next/og";

// Default social-share card for the whole site (pages can override). Generated at
// build time — gives shared links a branded preview instead of a bare URL.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Disclosed. — expert reports you can explain line by line";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0f1b33 0%, #1A2B4A 58%, #1e3a8a 100%)",
          padding: 76,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "white",
              color: "#1A2B4A",
              fontSize: 38,
              fontWeight: 700,
            }}
          >
            D
          </div>
          <div style={{ fontSize: 38, fontWeight: 700 }}>Disclosed.</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", fontSize: 66, fontWeight: 700, lineHeight: 1.05, maxWidth: 940 }}>
            Expert reports you can explain line by line
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#c7d2fe", maxWidth: 900 }}>
            Your findings. Sentence-level evidence links. An independently verifiable AI-use record.
          </div>
        </div>

        <div style={{ display: "flex", gap: 18, fontSize: 24, color: "#93a3b8" }}>
          <div style={{ display: "flex" }}>Fed. R. Civ. P. 26(a)(2)(B)</div>
          <div style={{ display: "flex" }}>·</div>
          <div style={{ display: "flex" }}>Evidence-linked</div>
          <div style={{ display: "flex" }}>·</div>
          <div style={{ display: "flex" }}>For forensic expert witnesses</div>
        </div>
      </div>
    ),
    size,
  );
}
