import { ImageResponse } from "next/og";

// Favicon — the navy "D" lockup used in every header, so the browser tab matches
// the brand instead of showing a generic globe. Generated at build time.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1e3a8a",
          color: "white",
          fontSize: 44,
          fontWeight: 700,
          borderRadius: 14,
          fontFamily: "sans-serif",
        }}
      >
        D
      </div>
    ),
    size,
  );
}
