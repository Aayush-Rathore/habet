import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/shared/JsonLd";
import DownloadButton from "@/components/shared/DownloadButton";

const BASE_URL = "https://habetapk.com";
const PAGE_URL = `${BASE_URL}/habet-apk`;

const TITLE = "HABET APK Download 2026 - Habet App / Ha Bet Guide";
const DESCRIPTION =
  "Download HABET APK (also searched as Habet App or Ha Bet) with latest install steps, features, login help, and safe-use tips for Indian users.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "habet",
    "ha bet",
    "habet apk",
    "habet app",
    "habet app download",
    "habet apk download",
  ],
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    type: "website",
    images: [{ url: `${BASE_URL}/logo.jpg`, alt: "HABET APK" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${BASE_URL}/logo.jpg`],
  },
};

const faqItems = [
  {
    question: "What is HABET (Ha Bet) app?",
    answer:
      "HABET is a sports betting and gaming app commonly searched as Habet, Ha Bet, or Habet App. It provides cricket, football, and other live markets with mobile-first gameplay.",
  },
  {
    question: "How can I download HABET APK?",
    answer:
      "Tap the download button, allow installation from unknown sources on Android, then install the APK. For iOS, follow the in-app instructions shown on the destination page.",
  },
  {
    question: "Is HABET app available in India?",
    answer:
      "The platform is used by Indian users and supports local payment methods. Laws can vary by state, so users should verify local regulations before using any real-money betting service.",
  },
  {
    question: "Why do people search for Ha Bet or Habet APK?",
    answer:
      "These are common spelling variations of the same brand intent, including HABET, Habet App, Ha Bet, and Habet APK download.",
  },
];

const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "HABET APK",
  applicationCategory: "GameApplication",
  operatingSystem: "Android, iOS",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  url: PAGE_URL,
  downloadUrl: "https://cp7.me/BYQSOY/30i50zd",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function HabetApkPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={softwareAppSchema} />
      <JsonLd data={faqSchema} />

      <h1 className="mb-4 text-3xl font-bold leading-tight md:text-4xl">
        HABET APK Download 2026: Habet App and Ha Bet Guide
      </h1>

      <p className="mb-6 text-base leading-relaxed text-muted-foreground">
        If you are searching for <strong>habet</strong>, <strong>ha bet</strong>,
        <strong> habet apk</strong>, or <strong>habet app</strong>, you are in the
        right place. This page gives you direct download guidance, login help,
        feature overview, and safety notes in one place.
      </p>

      <section className="mb-8 rounded-lg border border-border bg-card p-5">
        <h2 className="mb-3 text-xl font-semibold">Download HABET App</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Use the official button below to get the latest version and start with
          registration.
        </p>
        <div className="flex flex-wrap gap-3">
          <DownloadButton id="habet-apk-primary-download" />
          <DownloadButton
            id="habet-apk-secondary-download"
            href="https://web-in.batwingo.com/en/affiliate-invited?c=WNRJ4DF4&s=1"
            label="Betwin"
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">How To Install</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Tap the HABET APK download button.</li>
          <li>Enable unknown source installation in Android settings.</li>
          <li>Install and open the app.</li>
          <li>Register and complete account verification.</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">What You Get in Habet APK</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Live cricket, football, and other sports markets</li>
          <li>Mobile-first betting interface and fast loading</li>
          <li>UPI-friendly deposits and withdrawals</li>
          <li>Bonus and promotions for new users</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">FAQ</h2>
        <div className="space-y-4">
          {faqItems.map((item) => (
            <article key={item.question}>
              <h3 className="font-medium">{item.question}</h3>
              <p className="text-sm text-muted-foreground">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
        <p>
          18+ only. Real money betting involves risk. Check your local laws and
          play responsibly.
        </p>
      </section>

      <nav className="mt-8 flex flex-wrap gap-4 text-sm font-medium text-primary">
        <Link href="/">Home</Link>
        <Link href="/about">About HABET</Link>
        <Link href="/blog">HABET Blog</Link>
        <Link href="/disclaimer">Disclaimer</Link>
      </nav>
    </main>
  );
}
