const reasons = [
  {
    icon: "📊",
    title: "Competitive Odds",
    description:
      "Industry-leading 3–5% margin means more money in your pocket on every winning bet.",
  },
  {
    icon: "🔴",
    title: "Live Betting",
    description:
      "Place in-play bets on live matches with odds that update ball-by-ball in real time.",
  },
  {
    icon: "💸",
    title: "Fast Payouts",
    description:
      "Withdrawals processed within minutes via UPI and e-wallets — no long waiting periods.",
  },
  {
    icon: "🎁",
    title: "₹500 Welcome Bonus",
    description:
      "New users receive a ₹500 bonus on first registration — no complex wagering requirements.",
  },
  {
    icon: "🔒",
    title: "18+ Secure Platform",
    description:
      "SSL-encrypted, age-verified, and fully compliant with responsible gambling standards.",
  },
  {
    icon: "🏆",
    title: "20+ Sports",
    description:
      "Bet on cricket, football, kabaddi, tennis, basketball, and over 20 sports markets.",
  },
];

export default function WhyChooseHabet() {
  return (
    <section className="bg-blue-600 px-4 py-12 md:py-16">
      <h2 className="mb-8 text-center text-2xl font-bold text-white md:text-3xl">
        Why Choose HABET?
      </h2>
      <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 md:grid-cols-3">
        {reasons.map((reason) => (
          <div
            key={reason.title}
            className="flex gap-4 rounded-2xl bg-white/10 p-5 backdrop-blur-sm"
          >
            <span className="text-3xl">{reason.icon}</span>
            <div>
              <p className="font-semibold text-white">{reason.title}</p>
              <p className="mt-1 text-sm text-blue-100">{reason.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
