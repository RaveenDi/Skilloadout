// Shared card shape used by both server pages (from the full catalog) and client components
// (from the slim search index). Kept out of catalog.ts so client bundles never touch `server-only`.
import type { Item } from "./search-client";

export type Card = {
  id: string;
  title: string;
  name?: string;
  description: string;
  category: string;
  tags: string[];
  kind: string;
  origin: string;
  repo: string;
  stars: number;
  tier: number;
  official: boolean;
  license: string;
  mirrored: boolean;
  flags: string[];
  score: number;
  superpower?: boolean;
};

export function itemToCard(it: Item): Card {
  return {
    id: it.i,
    title: it.t,
    description: it.d,
    category: it.c,
    tags: it.g || [],
    kind: it.k || "skill",
    origin: it.o,
    repo: it.r,
    stars: it.s,
    tier: it.o === "world-skills" ? 0 : it.f ? 1 : 3,
    official: !!it.f,
    license: it.l,
    mirrored: !!it.m,
    flags: it.w ? ["high"] : [],
    score: it.q,
    superpower: !!it.p,
  };
}

export const downloadUrl = (id: string) => `/downloads/${id}.zip`;
export const bundleUrl = (name: string) => `/bundles/${name}.zip`;
