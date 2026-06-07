import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Cat Adoption Matcher",
  description: "Find your ideal adoptable cat near Toronto",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased min-h-screen`}>
        <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
          <nav className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link href="/" className="font-semibold text-accent text-lg">
              🐱 Cat Matcher
            </Link>
            <Link href="/" className="text-sm hover:text-accent transition-colors">
              Matches
            </Link>
            <Link href="/cats" className="text-sm hover:text-accent transition-colors">
              All Cats
            </Link>
            <Link href="/settings" className="text-sm hover:text-accent transition-colors">
              Settings
            </Link>
            <Link href="/status" className="text-sm hover:text-accent transition-colors ml-auto">
              Refresh Status
            </Link>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
