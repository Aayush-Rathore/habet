import DownloadButton from "@/components/shared/DownloadButton";

const androidSteps = [
  {
    step: 1,
    title: "Enable Unknown Sources",
    desc: 'Go to Settings → Security → enable "Install from Unknown Sources".',
  },
  {
    step: 2,
    title: "Download APK",
    desc: "Tap the Download button above to get the latest HABET APK file.",
  },
  {
    step: 3,
    title: "Install",
    desc: "Open the downloaded file and tap Install. The process takes under a minute.",
  },
  {
    step: 4,
    title: "Open & Register",
    desc: "Launch the app, create your account, and claim your ₹500 welcome bonus.",
  },
];

const iosSteps = [
  {
    step: 1,
    title: "Open Safari",
    desc: "Use Safari on your iPhone or iPad — other browsers may not support the install flow.",
  },
  {
    step: 2,
    title: "Visit Download Page",
    desc: "Tap the Download button above to navigate to the HABET iOS download page.",
  },
  {
    step: 3,
    title: "Trust Developer Certificate",
    desc: 'Go to Settings → General → VPN & Device Management and tap "Trust" for HABET.',
  },
  {
    step: 4,
    title: "Launch App",
    desc: "Open HABET from your home screen, register, and start betting.",
  },
];

function StepList({
  steps,
}: {
  steps: { step: number; title: string; desc: string }[];
}) {
  return (
    <ol className="space-y-4">
      {steps.map(({ step, title, desc }) => (
        <li key={step} className="flex gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {step}
          </span>
          <div>
            <p className="font-semibold text-gray-900">{title}</p>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function HowToDownload() {
  return (
    <section id="download-guide" className="bg-gray-50 px-4 py-12 md:py-16">
      <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 md:text-3xl">
        How to Download HABET App
      </h2>
      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900">
            <span>🤖</span> Android Download
          </h3>
          <StepList steps={androidSteps} />
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900">
            <span>🍎</span> iOS Download
          </h3>
          <StepList steps={iosSteps} />
        </div>
      </div>
      <div className="mt-8 flex justify-center">
        <DownloadButton id="how-to-download-btn" />
      </div>
    </section>
  );
}
