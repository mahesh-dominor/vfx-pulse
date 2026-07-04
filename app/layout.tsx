import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VFX Pulse",
  description: "MR Production Database",
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