const methods = [
  {
    icon: "🏦",
    title: "Bank Transfer",
    description:
      "Direct NEFT/IMPS transfers to all major Indian banks. Withdrawals processed within 24 hours.",
  },
  {
    icon: "📲",
    title: "UPI",
    description:
      "Instant withdrawals via Google Pay, PhonePe, Paytm, and any UPI-enabled app. Usually under 5 minutes.",
  },
  {
    icon: "💳",
    title: "E-Wallets",
    description:
      "Withdraw to popular e-wallets with fast processing times and zero hidden fees.",
  },
];

export default function WithdrawalMethods() {
  return (
    <section className="px-4 py-12 md:py-16">
      <h2 className="mb-4 text-center text-2xl font-bold text-gray-900 md:text-3xl">
        Withdrawal Methods
      </h2>
      <p className="mx-auto mb-8 max-w-xl text-center text-gray-500">
        HABET supports multiple fast and secure withdrawal options so you get
        your winnings without delay.
      </p>
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
        {methods.map((method) => (
          <div
            key={method.title}
            className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm"
          >
            <span className="text-5xl">{method.icon}</span>
            <h3 className="text-lg font-semibold text-gray-900">
              {method.title}
            </h3>
            <p className="text-sm text-gray-500">{method.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
