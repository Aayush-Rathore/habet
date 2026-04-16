import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import DownloadButton from "@/components/shared/DownloadButton";

export const metadata: Metadata = {
  title: "HABET APK Download 2026 – Live Sports Betting & Fast Withdrawal",
  description:
    "Download HABET APK for live sports betting. Bet on cricket, football & more. Earn real cash with fast and secure withdrawals.",
  alternates: {
    canonical: "https://habetapk.com/about",
  },
  openGraph: {
    title:
      "HABET APK Download 2026 – Live Sports Betting & Fast Withdrawal",
    description:
      "Download HABET APK for live sports betting. Bet on cricket, football & more. Earn real cash with fast and secure withdrawals.",
    url: "https://habetapk.com/about",
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
    title:
      "HABET APK Download 2026 – Live Sports Betting & Fast Withdrawal",
    description:
      "Download HABET APK for live sports betting. Bet on cricket, football & more. Earn real cash with fast and secure withdrawals.",
    images: ["https://habetapk.com/logo.jpg"],
  },
};

export default function AboutPage() {
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
        HABET APK Download 2026 – Live Sports Betting &amp; Fast
        Withdrawal
      </h1>

      {/* Section 1 – About HABET APK */}
      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold">About HABET APK</h2>
        <p className="mb-4 text-base leading-relaxed">
          HABET APK ek popular online sports betting application hai jo
          users ko live sports betting, real money gaming aur fast rewards ka
          best experience deta hai. Yeh app specially un users ke liye design
          kiya gaya hai jo sports prediction aur betting games khelkar online
          earning karna chahte hain. HABET App par aap cricket betting,
          football betting, kabaddi, tennis, basketball aur live match betting
          jaise multiple sports options enjoy kar sakte hain.
        </p>
        <p className="text-base leading-relaxed">
          HABET ka interface simple, smooth aur beginner-friendly hai,
          jisse new users bhi easily betting start kar sakte hain. App secure
          technology, fast loading aur fair play system ke saath aata hai jo
          safe aur trusted sports betting experience provide karta hai.
        </p>
      </section>

      {/* Section 2 – Key Features */}
      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold">
          Key Features of HABET
        </h2>
        <ul className="mb-4 space-y-2 text-base">
          <li>🏏 Live Cricket &amp; Sports Betting</li>
          <li>⚽ Multiple Sports Betting Options</li>
          <li>💰 Real Money Winning Games</li>
          <li>🎁 Signup Bonus &amp; Daily Offers</li>
          <li>🔐 Safe, Secure &amp; Trusted Platform</li>
          <li>⚡ Fast Deposit &amp; Instant Withdrawal</li>
          <li>📱 Android Compatible Sports APK</li>
        </ul>
        <p className="text-base leading-relaxed">
          HABET APK users ko attractive welcome bonus, daily betting
          rewards aur special promotions deta hai. Aap apni winning amount ko
          UPI, Paytm, PhonePe, Google Pay aur Bank Transfer ke through quickly
          withdraw kar sakte hain.
        </p>
      </section>

      {/* Section 3 – Why Choose */}
      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold">
          Why Choose HABET APP?
        </h2>
        <p className="text-base leading-relaxed mb-4">
          Agar aap ek best sports betting app in India, trusted cricket betting
          APK aur fast withdrawal sports app dhoondh rahe ho, to HABET
          APK ek perfect choice hai. Yeh app transparent system, smooth
          transactions aur 24/7 live sports access provide karta hai.
        </p>
        <p className="text-base leading-relaxed">
          Check out our{" "}
          <Link href="/blog" className="text-blue-600 hover:underline font-medium">
            expert betting tips and strategies
          </Link>
          {" "}to maximize your winnings, or visit our{" "}
          <Link href="/" className="text-blue-600 hover:underline font-medium">
            homepage
          </Link>
          {" "}to download the app now.
        </p>
      </section>

      {/* Section 4 – Download */}
      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold">HABET Download</h2>
        <p className="mb-6 text-base leading-relaxed">
          HABET APK ka latest version lightweight, secure aur Android
          devices ke liye fully optimized hai. App download karo, account
          register karo aur live sports betting khelkar real cash jeeto.
        </p>
        <DownloadButton />
      </section>

      {/* Section 5 – Note / Disclaimer */}
      <section className="mb-8 rounded-xl border border-yellow-300 bg-yellow-50 p-4">
        <h2 className="mb-2 text-lg font-semibold text-yellow-800">Note</h2>
        <p className="text-sm leading-relaxed text-yellow-900">
          HABET APK ek online sports betting platform hai. Is app ka use
          sirf 18+ users ke liye hai. Real money games mein financial risk ho
          sakta hai—isliye hamesha responsibly play karein. App ka use karne se
          pehle local laws &amp; rules check karna user ki responsibility hai.
        </p>
      </section>

      {/* Internal links */}
      <nav className="flex flex-wrap gap-4 text-sm font-medium text-blue-600">
        <Link href="/" className="hover:underline">
          HABET APK – Home
        </Link>
        <Link href="/blog" className="hover:underline">
          Betting Tips &amp; Blog
        </Link>
        <Link href="/disclaimer" className="hover:underline">
          Disclaimer
        </Link>
      </nav>
    </main>
  );
}
