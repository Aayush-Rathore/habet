import { cn } from "@/lib/utils";

interface DownloadButtonProps {
  className?: string;
  id?: string;
  href?: string;
  label?: string;
}

export default function DownloadButton({ className, id, href, label }: DownloadButtonProps) {
  const downloadUrl = href || "https://cp7.me/BYQSOY/30i50zd";
  const buttonText = label || "Download HABET App";
  
  return (
    <a
      href={downloadUrl}
      id={id}
      className={cn(
        "btn-download inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-base font-semibold text-white no-underline transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
        className
      )}
      target="_blank"
      rel="noopener noreferrer"
    >
      {buttonText}
    </a>
  );
}
