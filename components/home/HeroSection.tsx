import Image from "next/image";
import DownloadButton from "@/components/shared/DownloadButton";

export default function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 px-4 py-12 text-center md:py-20">
      <Image
        src="/logo.png"
        alt="HABET APK Logo"
        width={160}
        height={160}
        priority={true}
        className="rounded-2xl"
      />

      <h1 className="text-3xl font-bold leading-tight text-foreground md:text-5xl">
        HABET APK Download 2026 – Live Odds &amp; Fast Payouts
      </h1>

      <p className="max-w-2xl text-base text-gray-300 md:text-lg">
        The <strong>HABET APK</strong> brings you live cricket
        betting, real-time odds, casino games, and lightning-fast payouts — all
        in one secure platform built for Indian bettors.
      </p>

      <div className="flex flex-col gap-4 mt-2">
        <DownloadButton id="hero-download-btn-1" />
        <DownloadButton 
          id="hero-download-btn-2" 
          href="https://web-in.batwingo.com/en/affiliate-invited?c=WNRJ4DF4&s=1"
        />
      </div>
    </section>
  );
}
