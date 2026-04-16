import { cn } from "@/lib/utils";

interface DownloadButtonProps {
  className?: string;
  id?: string;
  href?: string;
}

export default function DownloadButton({ className, id, href }: DownloadButtonProps) {
  const downloadUrl = href || "https://invite.habet.online/?i=AX7JY162";
  
  return (
    <a
      href={downloadUrl}
      id={id}
      className={cn(
        "btn-download inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white no-underline transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        className
      )}
      target="_blank"
      rel="noopener noreferrer"
    >
      Download HABET App
    </a>
  );
}
