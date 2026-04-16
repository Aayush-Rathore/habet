const features = [
  {
    icon: "🏏",
    title: "Live Sports Betting",
    description:
      "Bet on cricket, football, kabaddi, and 20+ sports with real-time odds and live in-play markets.",
  },
  {
    icon: "🎰",
    title: "Casino & Live Games",
    description:
      "Enjoy a full casino suite with live dealers, slots, roulette, and card games available 24/7.",
  },
  {
    icon: "⚡",
    title: "Fast & Secure Transactions",
    description:
      "Deposits and withdrawals processed in minutes via UPI, bank transfer, and popular e-wallets.",
  },
  {
    icon: "📱",
    title: "Intuitive Mobile App",
    description:
      "A lightweight, smooth APK designed for Android and iOS — optimized for Indian mobile networks.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="px-4 py-12 md:py-16">
      <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 md:text-3xl">
        Key Features of HABET App
      </h2>
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm"
          >
            <span className="text-4xl">{feature.icon}</span>
            <h3 className="text-sm font-semibold text-gray-900 md:text-base">
              {feature.title}
            </h3>
            <p className="text-xs text-gray-500 md:text-sm">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
