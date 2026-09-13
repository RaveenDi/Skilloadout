import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import Analytics from "@/components/Analytics";
import { site } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: `${site.name} — ${site.tagline}`,
  description:
    "Search and download the world's best AI agent skills for Claude, Codex/ChatGPT, Gemini CLI, Copilot and Cursor — every category, hand-picked top skills, auto-updated every 3 days.",
  openGraph: { siteName: site.name, type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const bmc = site.support.buyMeACoffee;
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
          <nav className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-5">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent via-fuchsia-500 to-accent-2 text-sm">◎</span>
              {site.name}
            </Link>
            <div className="flex items-center gap-5 text-sm text-muted">
              <Link href="/categories" className="hover:text-foreground">Categories</Link>
              <Link href="/browse" className="hover:text-foreground">Browse</Link>
              <Link href="/stacks" className="hover:text-foreground">Stacks</Link>
              <Link href="/updates" className="hidden hover:text-foreground md:inline">Updates</Link>
            </div>
            <Link
              href={bmc ? `https://buymeacoffee.com/${bmc}` : "/support"}
              target={bmc ? "_blank" : undefined}
              className="ml-auto rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200 hover:bg-amber-400/20"
            >
              ☕ Support
            </Link>
          </nav>
        </header>
        <main className="flex-1 overflow-x-clip">{children}</main>
        <footer className="border-t border-border py-8 text-center text-xs text-muted">
          <div className="mb-3 flex justify-center gap-4">
            <Link href="/about" className="hover:text-foreground">About</Link>
            <Link href="/support" className="hover:text-foreground">Support</Link>
            <Link href="/support#advertise" className="hover:text-foreground">Advertise</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/updates" className="hover:text-foreground">Updates</Link>
          </div>
          {site.name} mirrors only openly-licensed skills (with attribution); others link to their source. Always review a skill&apos;s scripts before running them.
        </footer>
        <Analytics
          gaId={site.analytics.gaId || undefined}
          adsenseClient={site.ads.provider === "adsense" ? site.ads.adsenseClient || undefined : undefined}
          plausibleDomain={site.analytics.plausibleDomain || undefined}
        />
      </body>
    </html>
  );
}
