import Link from "next/link";
import { loadCatalog, readJsonFile } from "@/lib/catalog";
import { site } from "@/lib/site";

export const metadata = { title: `About — ${site.name}`, description: `Who runs ${site.name}, how skills are chosen, licensed and kept up to date.` };

type Stats = { total: number; mirrored: number; sources: number; generatedAt: string };

export default function AboutPage() {
  const { skills } = loadCatalog();
  const stats = readJsonFile<Stats>("stats.json", { total: skills.length, mirrored: 0, sources: 0, generatedAt: "" });
  return (
    <div className="prose-skill mx-auto max-w-3xl px-5 py-12">
      <h1>About {site.name}</h1>
      <p>
        {site.name} is a curated library of <strong>Agent Skills</strong> — the open <code>SKILL.md</code> format that works
        across Claude, OpenAI Codex/ChatGPT, Gemini CLI, GitHub Copilot and Cursor. It currently lists{" "}
        <strong>{stats.total.toLocaleString()} skills</strong> from <strong>{stats.sources} sources</strong>, of which{" "}
        {stats.mirrored.toLocaleString()} can be downloaded directly.
      </p>

      <h2>Why it exists</h2>
      <p>
        Thousands of agent skills are scattered across GitHub, and most of them are mediocre or duplicated. The goal here is the
        opposite: find the few skills in every field that genuinely give an AI agent a new capability, check they are safe and
        properly licensed, and make them one click away.
      </p>

      <h2>How skills are chosen</h2>
      <ul>
        <li><strong>Sources are vetted</strong> — official vendor repositories first (Anthropic, OpenAI, Google, GitHub, Vercel, Stripe, Trail of Bits and others), then the strongest community collections. Mass-generated dumps are excluded.</li>
        <li><strong>⚡ Superpowers</strong> — in each of the 36 categories, a handful of skills are hand-picked as the best of the best.</li>
        <li><strong>Duplicates are merged</strong> and credited to the original author, not to whoever re-published them.</li>
        <li><strong>Every skill is safety-scanned</strong> for prompt-injection text, credential access, obfuscated code and destructive commands. Findings are shown on the skill page.</li>
      </ul>

      <h2>Licensing &amp; attribution</h2>
      <p>
        Only skills under a license that permits redistribution (MIT, Apache-2.0, BSD, ISC, CC0, CC-BY and similar) are mirrored
        here, always with the original license and an <code>ATTRIBUTION.md</code> naming the author and source commit. Everything
        else is listed with a link to the original repository and is never copied. If you are an author and want your skill
        removed or corrected, get in touch and it will be handled promptly.
      </p>

      <h2>How it stays current</h2>
      <p>
        An automated agent runs every three days: it searches for new skill repositories, reviews them for quality and safety,
        re-downloads every source, re-checks licenses, removes duplicates and rebuilds the catalog. You can see every run on the{" "}
        <Link href="/updates">updates page</Link>.
      </p>

      <h2>Contact</h2>
      <p>
        {site.contactEmail ? (
          <>Questions, corrections, takedown requests or sponsorship: <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.</>
        ) : (
          <>Corrections and takedown requests are handled through the project&apos;s GitHub repository.</>
        )}
      </p>
      <p>
        You can support the project on the <Link href="/support">support page</Link>. See also our <Link href="/privacy">privacy policy</Link>.
      </p>
    </div>
  );
}
