"use client"

import Image from "next/image"

const screenshots = [
  { src: "/g1-ss1.jpeg", alt: "HABET app home screen showing live sports betting markets and odds" },
  { src: "/g1-ss2.jpeg", alt: "HABET app cricket betting interface with IPL match odds and live scores" },
  { src: "/g1-ss3.jpeg", alt: "HABET app casino games section featuring live dealer and slot games" },
  { src: "/g1-ss4.jpeg", alt: "HABET app fast withdrawal screen showing UPI and bank transfer options" },
  { src: "/g1-ss5.jpeg", alt: "HABET app account dashboard with balance, bonuses, and transaction history" },
]

export function ScreenshotsGallery() {
  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold text-center mb-6">App Screenshots</h2>
      <div
        className="flex gap-4 overflow-x-auto px-4 pb-4"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {screenshots.map((shot, index) => (
          <div
            key={shot.src}
            className="flex-none rounded-xl overflow-hidden shadow-md"
            style={{ scrollSnapAlign: "start" }}
          >
            <Image
              src={shot.src}
              alt={shot.alt}
              width={220}
              height={440}
              className="object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
