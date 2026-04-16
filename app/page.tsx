import type { Metadata } from "next";
import Link from "next/link";
import HeroSection from "@/components/home/HeroSection";
import AppInfoTable from "@/components/home/AppInfoTable";
import { ScreenshotsGallery } from "@/components/home/ScreenshotsGallery";
import FeaturesSection from "@/components/home/FeaturesSection";
import HowToDownload from "@/components/home/HowToDownload";
import WithdrawalMethods from "@/components/home/WithdrawalMethods";
import WhyChooseHabet from "@/components/home/WhyChooseHabet";
import HomeFAQ from "@/components/home/HomeFAQ";
import DisclaimerNotice from "@/components/shared/DisclaimerNotice";
import JsonLd from "@/components/shared/JsonLd";

const BASE_URL = "https://habetapk.com";

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "habetapk.com",
  url: BASE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${BASE_URL}/blog?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const generateMetadata = async (): Promise<Metadata> => ({
  title: "HABET APK Download 2026 with Live Odds & Fast Payouts",
  description:
    "HABET APK offers live betting, casino games, competitive odds, and secure transactions in one platform. Download HABET APK now.",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "HABET APK Download 2026 with Live Odds & Fast Payouts",
    description:
      "HABET APK offers live betting, casino games, competitive odds, and secure transactions in one platform. Download HABET APK now.",
    url: BASE_URL,
    type: "website",
    images: [
      {
        url: `${BASE_URL}/logo.png`,
        alt: "HABET APK Download",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HABET APK Download 2026 with Live Odds & Fast Payouts",
    description:
      "HABET APK offers live betting, casino games, competitive odds, and secure transactions in one platform. Download HABET APK now.",
  },
});

export default function Home() {
  return (
    <>
      <JsonLd data={websiteSchema} />
      <HeroSection />
      <div className="mx-auto max-w-2xl px-4 py-6 text-center">
        <a
          href="https://web-in.batwingo.com/en/affiliate-invited?c=WNRJ4DF4&s=1"
          className="btn-download inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white no-underline transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          Download HABET App
        </a>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <AppInfoTable />
      </div>
      <ScreenshotsGallery />
      <FeaturesSection />
      <HowToDownload />
      <WithdrawalMethods />
      <WhyChooseHabet />
      <HomeFAQ />
      <section className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-gray-600">
          <Link
            href="/about"
            className="font-semibold text-blue-600 hover:underline"
          >
            Learn more about HABET APK
          </Link>{" "}
          or{" "}
          <Link
            href="/blog"
            className="font-semibold text-blue-600 hover:underline"
          >
            Read HABET betting tips and guides
          </Link>
          .
        </p>
      </section>
      <div className="mx-auto max-w-3xl px-4 pb-10">
        <DisclaimerNotice />
      </div>
    </>
  );
}
