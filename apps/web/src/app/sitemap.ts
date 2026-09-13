import type { MetadataRoute } from "next";
import { loadCatalog, getStacks } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/taxonomy";
import { site } from "@/lib/site";

// Full sitemap: static pages + every category + every skill (helps search engines and AdSense review).
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, "");
  const { skills, generatedAt } = loadCatalog();
  const updated = generatedAt ? new Date(generatedAt) : new Date();
  const staticPages = ["", "/browse", "/categories", "/stacks", "/updates", "/about", "/support", "/privacy"].map((p) => ({
    url: `${base}${p}`,
    lastModified: updated,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  return [
    ...staticPages,
    ...CATEGORIES.map((c) => ({ url: `${base}/categories/${c.id}`, lastModified: updated, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...getStacks().map((s) => ({ url: `${base}/stacks#${s.id}`, lastModified: updated, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...skills.map((s) => ({
      url: `${base}/skills/${s.id}`,
      lastModified: s.updatedAt ? new Date(s.updatedAt) : updated,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
