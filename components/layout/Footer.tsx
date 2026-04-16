import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-foreground mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About HABET APK
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-foreground transition-colors">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-3">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/blog" className="hover:text-foreground transition-colors">
                  Betting Blog
                </Link>
              </li>
              <li>
                <Link href="/blog/cricket-betting-tips-india-2026" className="hover:text-foreground transition-colors">
                  Cricket Betting Tips
                </Link>
              </li>
              <li>
                <Link href="/blog/ipl-betting-predictions-2026" className="hover:text-foreground transition-colors">
                  IPL Predictions
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-3">Guides</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/blog/habet-app-download-guide" className="hover:text-foreground transition-colors">
                  Download Guide
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-3">Download</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://invite.habet.online/?i=AX7JY162" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  Download HABET APK
                </a>
              </li>
              <li>
                <a href="https://web-in.batwingo.com/en/affiliate-invited?c=WNRJ4DF4&s=1" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  Betwin
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="text-center text-sm text-muted-foreground pt-6 border-t border-border">
          <p>
            Copyright &copy; 2026 habetapk.com &mdash; HABET is for 18+ users
            only. Online betting involves risk &mdash; play responsibly and only
            where it is legal.
          </p>
        </div>
      </div>
    </footer>
  );
}
