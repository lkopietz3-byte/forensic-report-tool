import type { MetadataRoute } from "next";

// Web app manifest (PWA basics + a proper install identity). Next auto-wires
// <link rel="manifest"> from this file.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Disclosed.",
    short_name: "Disclosed.",
    description:
      "Structure your own findings into a Rule 26(a)(2)(B)-organized report with sentence-level evidence links and an independently verifiable AI-use record.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#1e3a8a",
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
