const faqs = [
  {
    question: "What is the HABET app?",
    answer:
      "HABET is an online sports betting and casino app designed for Indian users. It offers live betting on cricket, football, kabaddi, and 20+ sports, along with casino games, fast withdrawals, and a ₹500 welcome bonus for new users.",
  },
  {
    question: "How do I download the HABET APK on Android?",
    answer:
      'Enable "Install from Unknown Sources" in your Android settings, then tap the Download button on this page to get the HABET APK. Open the file, tap Install, and launch the app to register.',
  },
  {
    question: "Is HABET available on iOS (iPhone)?",
    answer:
      "Yes. Open Safari on your iPhone, visit the HABET download page via the button above, and follow the on-screen instructions to install and trust the developer certificate.",
  },
  {
    question: "How long do withdrawals take on HABET?",
    answer:
      "UPI withdrawals are typically processed within 5 minutes. Bank transfers take up to 24 hours. E-wallet withdrawals are also fast with no hidden fees.",
  },
  {
    question: "Is HABET safe and legal to use in India?",
    answer:
      "HABET uses SSL encryption and age verification to keep your data and funds secure. The platform is intended for users aged 18 and above. Please check the gambling laws applicable in your state before playing.",
  },
  {
    question: "What is the minimum deposit on HABET?",
    answer:
      "HABET supports low minimum deposits to make betting accessible. New users also receive a ₹500 welcome bonus on their first registration. Check the app for current deposit limits and promotions.",
  },
];

export default function HomeFAQ() {
  return (
    <section className="px-4 py-12 md:py-16">
      <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 md:text-3xl">
        Frequently Asked Questions
      </h2>
      <div className="mx-auto max-w-3xl space-y-3">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-gray-900">
              {faq.question}
              <span className="shrink-0 text-blue-600 transition-transform group-open:rotate-45">
                ＋
              </span>
            </summary>
            <p className="px-5 pb-5 text-sm text-gray-500">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
