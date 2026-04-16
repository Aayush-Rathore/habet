"use client";

import { useEffect, useState } from "react";
import DownloadButton from "@/components/shared/DownloadButton";

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero-download-btn");

    // If there's no hero button on this page, show the sticky CTA immediately
    if (!hero) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.5 }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-white p-3">
      <DownloadButton className="w-full" />
    </div>
  );
}
