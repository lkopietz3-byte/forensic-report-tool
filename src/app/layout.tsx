import type { Metadata } from "next";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { HelpWidget } from "./_components/HelpWidget";

const description =
  "Structure your own findings into a Rule 26(a)(2)(B)-organized report with sentence-level evidence links and an independently verifiable AI-use record. You review, verify, adopt, and sign.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Disclosed. — expert reports you can explain line by line",
    template: "%s · Disclosed.",
  },
  description,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Disclosed. — expert reports you can explain line by line",
    description,
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Disclosed. — expert reports you can explain line by line",
    description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
        <HelpWidget />
      </body>
    </html>
  );
}
