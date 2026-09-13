import BrowseClient from "@/components/BrowseClient";
import { loadCatalog } from "@/lib/catalog";
import { originLabel } from "@/lib/taxonomy";
import { adProps, site } from "@/lib/site";

export const metadata = { title: `Browse all skills — ${site.name}` };

export default function BrowsePage() {
  const { skills } = loadCatalog();
  const counts = new Map<string, number>();
  for (const s of skills) counts.set(s.origin, (counts.get(s.origin) || 0) + 1);
  const origins = [...counts.entries()]
    .sort((a, b) => (a[0] === "world-skills" ? -1 : b[0] === "world-skills" ? 1 : b[1] - a[1]))
    .map(([id, count]) => ({ id, label: originLabel(id), count }));

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      <h1 className="text-2xl font-bold">Browse skills</h1>
      <p className="mb-4 text-sm text-muted">
        {skills.length.toLocaleString()} skills, filtered instantly in your browser. Looking for a whole setup? Try the{" "}
        <a href="/stacks" className="text-violet-300 hover:underline">ready-made loadouts</a>.
      </p>
      <div className="flex gap-6">
        <div className="min-w-0 flex-1">
          <BrowseClient origins={origins} ad={adProps("infeed")} />
        </div>
      </div>
    </div>
  );
}
