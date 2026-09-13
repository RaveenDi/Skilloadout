import { site } from "@/lib/site";

export const metadata = { title: `Support & advertise — ${site.name}` };

export default function SupportPage() {
  const s = site.support;
  const donate = [
    s.buyMeACoffee && { label: "Buy me a coffee", emoji: "☕", href: `https://buymeacoffee.com/${s.buyMeACoffee}`, note: "One-off tip, no account needed.", primary: true },
    s.githubSponsors && { label: "GitHub Sponsors", emoji: "💜", href: `https://github.com/sponsors/${s.githubSponsors}`, note: "Monthly support — 0% fees." },
    s.kofi && { label: "Ko-fi", emoji: "🍵", href: `https://ko-fi.com/${s.kofi}`, note: "Tips or memberships." },
    s.stripeLink && { label: "Pay what you want", emoji: "💳", href: s.stripeLink, note: "Card / Apple Pay via Stripe." },
  ].filter(Boolean) as { label: string; emoji: string; href: string; note: string; primary?: boolean }[];
  const contact = s.sponsorEmail || site.contactEmail;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Keep {site.name} free</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {site.name} curates the world&apos;s best AI agent skills and re-checks every source every 3 days. If it gave your AI a superpower, you can help keep it running.
      </p>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Donate</h2>
        {donate.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {donate.map((d) => (
              <a key={d.label} href={d.href} target="_blank" rel="noreferrer" className={`rounded-2xl border p-5 transition hover:-translate-y-0.5 ${d.primary ? "border-amber-400/40 bg-amber-400/10" : "border-border bg-card hover:border-accent/50"}`}>
                <div className="text-2xl">{d.emoji}</div>
                <div className="mt-2 font-semibold">{d.label}</div>
                <div className="text-sm text-muted">{d.note}</div>
              </a>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-border bg-card p-5 text-sm text-muted">
            Tipping isn&apos;t open yet. The best support right now is free: share a skill stack with someone who&apos;d
            use it, or tell us which skills are missing.
          </p>
        )}
      </section>

      <section id="advertise" className="mt-14 scroll-mt-20">
        <h2 className="text-lg font-semibold">Advertise & sponsor</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">Reach developers, designers and builders at the exact moment they&apos;re choosing tools for their AI agents. Sponsorships are clearly labeled and never change rankings.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            { t: "Category sponsor", p: "Your brand on one category page + in-feed card", d: "e.g. “3D, WebGL & Immersive — presented by …”" },
            { t: "Stack sponsor", p: "Logo + link on a curated skill stack and its download", d: "Ideal for tools used in that stack (hosting, 3D, auth…)." },
            { t: "Featured skill", p: "Pin your official skill at the top of search results for its topic", d: "Must pass the same quality & safety review." },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl border border-border bg-card p-5">
              <div className="font-semibold">{x.t}</div>
              <div className="mt-1 text-sm">{x.p}</div>
              <div className="mt-2 text-xs text-muted">{x.d}</div>
            </div>
          ))}
        </div>
        {contact ? (
          <a href={`mailto:${contact}?subject=${encodeURIComponent(`Sponsoring ${site.name}`)}`} className="mt-5 inline-block rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90">
            Get in touch →
          </a>
        ) : (
          <p className="mt-5 text-sm text-muted">Sponsorship enquiries open soon.</p>
        )}
      </section>

      <section className="mt-14">
        <h2 className="text-lg font-semibold">Free ways to help</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Share a skill stack with a friend or on social media.</li>
          <li>Suggest a great skill repository we&apos;re missing.</li>
          <li>Star the project on GitHub.</li>
        </ul>
      </section>
    </div>
  );
}
