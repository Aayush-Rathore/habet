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
      
      {/* Content Section - moved from hero */}
      <section className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="text-3xl font-bold leading-tight text-foreground md:text-5xl mb-6">
          HABET APK Download 2026 – Live Odds &amp; Fast Payouts
        </h1>
        <p className="max-w-2xl mx-auto text-base text-gray-300 md:text-lg">
          The <strong>HABET APK</strong> brings you live cricket betting, real-time odds, 
          casino games, and lightning-fast payouts — all in one secure platform built for Indian bettors.
        </p>
      </section>

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
