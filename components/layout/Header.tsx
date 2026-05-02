"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/habet-apk", label: "HABET APK" },
  { href: "/about", label: "About" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/blog", label: "Blog" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="HABET Sports Betting App Logo"
            width={120}
            height={40}
            priority
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu trigger */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden" 
          aria-label="Toggle menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto flex flex-col px-4 py-4">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="py-3 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground border-b border-border last:border-0"
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
