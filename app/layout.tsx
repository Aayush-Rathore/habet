import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StickyCTA from "@/components/layout/StickyCTA";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "HABET APK Download 2026 - Habet App and Ha Bet",
    template: "%s | habetapk.com",
  },
  description:
    "Download HABET APK with live cricket betting, IPL odds, and fast payouts. Also known as Habet App or Ha Bet by Indian users.",
  keywords: [
    "habet",
    "ha bet",
    "habet apk",
    "habet app",
    "habet app download",
    "habet apk download",
  ],
  metadataBase: new URL("https://habetapk.com"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    siteName: "habetapk.com",
    url: "https://habetapk.com",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "https://habetapk.com/logo.jpg",
        width: 512,
        height: 512,
        alt: "HABET APK",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@habetapk",
    images: ["https://habetapk.com/logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <StickyCTA />
      </body>
    </html>
  );
}
