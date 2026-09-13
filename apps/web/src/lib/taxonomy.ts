// UI taxonomy. Categories come from catalog/taxonomy.json (shared with the sync scripts).
import taxonomy from "../../../../catalog/taxonomy.json";

export type Category = { id: string; group: string; label: string; emoji: string; description: string };
export const CATEGORIES: Category[] = taxonomy.map(({ id, group, label, emoji, description }) => ({ id, group, label, emoji, description }));
export const CATEGORY_GROUPS = ["Build", "Create", "Business", "Work", "Knowledge"] as const;

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));
export const CATEGORY_EMOJI: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.emoji]));

export const ORIGIN_LABEL: Record<string, string> = {
  "world-skills": "Original",
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  github: "GitHub",
  microsoft: "Microsoft",
  vercel: "Vercel",
  gsap: "GSAP",
  cloudflare: "Cloudflare",
  trailofbits: "Trail of Bits",
  huggingface: "Hugging Face",
  jetbrains: "JetBrains",
  posthog: "PostHog",
  community: "Community",
};
export const originLabel = (o: string) => ORIGIN_LABEL[o] || o.charAt(0).toUpperCase() + o.slice(1);

export const ECOSYSTEMS = [
  { id: "claude", label: "Claude", dir: "~/.claude/skills/" },
  { id: "codex", label: "Codex / ChatGPT", dir: "~/.codex/skills/" },
  { id: "gemini", label: "Gemini CLI", dir: "~/.gemini/skills/" },
  { id: "copilot", label: "GitHub Copilot", dir: ".github/skills/" },
  { id: "cursor", label: "Cursor", dir: ".cursor/rules/ or .cursor/skills/" },
] as const;

export const KIND_LABEL: Record<string, string> = { skill: "Skill", rule: "Cursor rule", extension: "Gemini extension" };
