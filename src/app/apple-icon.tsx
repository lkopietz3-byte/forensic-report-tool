import { ImageResponse } from "next/og";

// Apple touch icon (home-screen / bookmark on iOS). Same navy "D" lockup.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 118,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        D
      </div>
    ),
    size,
  );
}
