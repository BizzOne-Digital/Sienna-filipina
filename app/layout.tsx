import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "Sienna Filipina — Skincare & Apparel", template: "%s | Sienna Filipina" },
  description: "Skincare essentials and everyday apparel from Sienna Filipina.",
  icons: { icon: "/brand/logo-transparent.png" },
};

export const viewport: Viewport = { themeColor: "#FBF5EE", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
