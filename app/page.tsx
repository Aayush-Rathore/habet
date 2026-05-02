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

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "habetapk.com",
  url: BASE_URL,
  logo: `${BASE_URL}/logo.jpg`,
};

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "HABET APK",
  applicationCategory: "GameApplication",
  operatingSystem: "Android, iOS",
  url: BASE_URL,
  downloadUrl: "https://cp7.me/BYQSOY/30i50zd",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
};

const homeFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the HABET app?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "HABET is an online sports betting and casino app for Indian users with live betting, casino games, and fast withdrawals.",
      },
    },
    {
      "@type": "Question",
      name: "How do I download the HABET APK?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Use the download button on this site, enable install from unknown sources on Android, then install and launch the app.",
      },
    },
    {
      "@type": "Question",
      name: "Is HABET also searched as Ha Bet or Habet App?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, users often search with spelling variations such as Habet, Ha Bet, Habet App, and Habet APK.",
      },
    },
  ],
};

export const generateMetadata = async (): Promise<Metadata> => ({
  title: "HABET APK Download 2026 - Habet App and Ha Bet",
  description:
    "Download HABET APK (also searched as Habet App or Ha Bet) for live betting, casino games, secure transactions, and fast withdrawals.",
  keywords: [
    "habet",
    "ha bet",
    "habet apk",
    "habet app",
    "habet app download",
    "habet apk download",
  ],
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "HABET APK Download 2026 - Habet App and Ha Bet",
    description:
      "Download HABET APK (Habet App / Ha Bet) for live betting, casino games, secure transactions, and fast withdrawals.",
    url: BASE_URL,
    type: "website",
    images: [
      {
        url: `${BASE_URL}/logo.jpg`,
        alt: "HABET APK Download",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HABET APK Download 2026 - Habet App and Ha Bet",
    description:
      "Download HABET APK (Habet App / Ha Bet) for live betting, casino games, secure transactions, and fast withdrawals.",
    images: [`${BASE_URL}/logo.jpg`],
  },
});

export default function Home() {
  return (
    <>
      <JsonLd data={websiteSchema} />
      <JsonLd data={organizationSchema} />
      <JsonLd data={softwareApplicationSchema} />
      <JsonLd data={homeFaqSchema} />
      <HeroSection />
      
      {/* Content Section - moved from hero */}
      <section className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="text-3xl font-bold leading-tight text-foreground md:text-5xl mb-6">
          HABET APK Download 2026 - Habet App and Ha Bet
        </h1>
        <p className="max-w-2xl mx-auto text-base text-gray-300 md:text-lg mb-4">
          The <strong>HABET APK</strong> brings you live cricket betting, real-time odds, 
          casino games, and lightning-fast payouts — all in one secure platform built for Indian bettors.
        </p>
        <p className="max-w-2xl mx-auto text-base text-gray-300">
          Looking for <strong>Habet App</strong> or <strong>Ha Bet</strong>? Visit our{" "}
          <Link href="/habet-apk" className="text-blue-500 hover:text-blue-400 underline font-medium">
            complete HABET APK guide
          </Link>
          {" "}for setup and FAQ.
        </p>
        <p className="max-w-2xl mx-auto text-base text-gray-300 mt-3">
          Explore our{" "}
          <Link href="/blog" className="text-blue-500 hover:text-blue-400 underline font-medium">
            betting tips and guides
          </Link>
          {" "}or read{" "}
          <Link href="/about" className="text-blue-500 hover:text-blue-400 underline font-medium">
            more about HABET APK
          </Link>
          .
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
