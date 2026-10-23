import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Navigation from "./ui/Navigation";
export const metadata: Metadata = {
  title: {
    default: "Aldy Radya Herlambang | Portfolio",
    template: "%s | Aldy Radya Herlambang",
  },
  description:
    "Meet Aldy Radya Herlambang, a Diponegoro University student with experience in leadership, student organizations, and community service.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <div className="shell header-inner">
            <Link className="brand" href="/" aria-label="Aldy home">
              <span className="brand-symbol">a.</span>
              <span>
                Aldy Radya
                <span className="brand-sub">Stories & experiences</span>
              </span>
            </Link>
            <Navigation />
          </div>
        </header>
        <main id="main">{children}</main>
        <footer>
          <div className="shell footer-inner">
            <div>
              <Link className="footer-name" href="/">
                Aldy Radya Herlambang
              </Link>
              <p>Growing together. Contributing to others.</p>
            </div>
            <div className="footer-links">
              <Link href="/cv">View CV</Link>
              <Link href="/contact">Get in touch</Link>
              <Link href="/admin">Admin</Link>
              <small>© {new Date().getFullYear()} Aldy Radya</small>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
