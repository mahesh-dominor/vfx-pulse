import "./globals.css";
import type { Metadata } from "next";

const fallbackAppUrl = "http://localhost:3000";

function getMetadataBase() {
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL ?? fallbackAppUrl;

  try {
    return new URL(rawUrl);
  } catch {
    return new URL(fallbackAppUrl);
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "VFX Pulse",
  description: "Enterprise production management platform for VFX studios.",
  applicationName: "VFX Pulse",
  keywords: [
    "VFX",
    "production management",
    "shot tracking",
    "review",
    "asset management",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "VFX Pulse",
    description: "Enterprise production management platform for VFX studios.",
    type: "website",
    url: "/",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}