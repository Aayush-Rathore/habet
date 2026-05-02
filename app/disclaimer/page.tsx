import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import DownloadButton from "@/components/shared/DownloadButton";

export const metadata: Metadata = {
  title: "HABET APK 2026 – Live Sports Betting App in India",
  description:
    "HABET APK ek online sports betting aur real money gaming platform hai. Yeh app sirf 18+ users ke liye hai.",
  alternates: {
    canonical: "https://habetapk.com/disclaimer",
  },
  openGraph: {
    title: "HABET APK 2026 – Live Sports Betting App in India",
    description:
      "HABET APK ek online sports betting aur real money gaming platform hai. Yeh app sirf 18+ users ke liye hai.",
    url: "https://habetapk.com/disclaimer",
    type: "website",
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
    title: "HABET APK 2026 – Live Sports Betting App in India",
    description:
      "HABET APK ek online sports betting aur real money gaming platform hai. Yeh app sirf 18+ users ke liye hai.",
    images: ["https://habetapk.com/logo.jpg"],
  },
};

export default function DisclaimerPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <Image
          src="/logo.jpg"
          alt="HABET APK Logo"
          width={120}
          height={120}
          className="rounded-xl"
        />
      </div>

      <h1 className="mb-6 text-3xl font-bold leading-tight text-blue-700">
        Disclaimer – HABET APK
      </h1>

      {/* Main disclaimer text */}
      <section className="mb-8 space-y-4 text-base leading-relaxed">
        <p>
          HABET APK ek online sports betting aur real money gaming
          platform hai. Yeh app sirf 18+ users ke liye hai. Online betting aur
          real money games mein financial risk hota hai, isliye users ko hamesha
          apni responsibility par game khelna chahiye.
        </p>
        <p>
          HABET APK kisi bhi tarah se government ya official sports
          authority se connected nahi hai. App ka use karne se pehle users ko
          apne local laws, rules aur regulations check kar lene chahiye. Agar
          aapke area mein online betting ya real money gaming illegal hai, to is
          app ka use na karein.
        </p>
        <p>
          Website/app par di gayi saari information sirf informational purpose
          ke liye hai. Hum kisi bhi loss, damage ya legal issue ke liye
          zimmedar nahi honge.
        </p>
        <p className="font-semibold">Play responsibly. Bet wisely.</p>
        <p>
          For more information about HABET APK features and benefits, visit our{" "}
          <Link href="/about" className="text-blue-600 hover:underline font-medium">
            About page
          </Link>
          {" "}or read our{" "}
          <Link href="/blog" className="text-blue-600 hover:underline font-medium">
            betting guides and tips
          </Link>
          .
        </p>
      </section>

      {/* Note section in Hindi */}
      <section className="mb-8 rounded-xl border border-yellow-300 bg-yellow-50 p-4">
        <h2 className="mb-2 text-lg font-semibold text-yellow-800">Note</h2>
        <p className="text-sm leading-relaxed text-yellow-900">
          HABET APK एक ऑनलाइन स्पोर्ट्स बेटिंग प्लेटफॉर्म है। इस ऐप
          का उपयोग केवल 18 वर्ष से अधिक उम्र के लोगों के लिए है। रियल मनी
          गेम्स में आर्थिक जोखिम हो सकता है, इसलिए कृपया हमेशा जिम्मेदारी से
          खेलें। ऐप का उपयोग करने से पहले अपने स्थानीय कानूनों और नियमों की
          जाँच करना उपयोगकर्ता की जिम्मेदारी है।
        </p>
      </section>

      {/* Download CTA */}
      <div className="mb-8">
        <DownloadButton />
      </div>

      {/* Internal link to Home */}
      <nav className="flex flex-wrap gap-4 text-sm font-medium text-blue-600">
        <Link href="/" className="hover:underline">
          HABET APK – Download &amp; Play Now
        </Link>
        <Link href="/habet-apk" className="hover:underline">
          HABET APK Guide
        </Link>
        <Link href="/about" className="hover:underline">
          About HABET APK
        </Link>
        <Link href="/blog" className="hover:underline">
          Betting Tips &amp; Guides
        </Link>
      </nav>
    </main>
  );
}
