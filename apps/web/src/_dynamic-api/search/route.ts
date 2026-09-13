import type { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { keywordSearch, listSkills, toCard, type Filters, type Skill } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/taxonomy";
import { site } from "@/lib/site";

// AI search: Claude plans retrieval queries -> local BM25 builds a candidate pool ->
// Claude picks, ranks and explains the best skills and composes a build plan.
// Streams NDJSON events so the UI can show progress.

const MODEL = "claude-opus-5";
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

const Plan = z.object({
  intent: z.string().describe("One sentence: what the user is trying to achieve"),
  queries: z.array(z.string()).describe("3-8 short keyword queries (2-5 words) covering the techniques, tools and domains needed"),
  categories: z.array(z.string()).describe("0-4 category ids from the provided list"),
  is_build_request: z.boolean().describe("true if the user wants to build/create something (vs. just looking up a skill)"),
});

const Answer = z.object({
  summary: z.string().describe("2-3 sentences: the recommended approach and why these skills"),
  results: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(["core", "supporting", "optional"]),
        why: z.string().describe("One sentence on what this skill contributes for THIS request"),
      }),
    )
    .describe("6-14 best skills, best first"),
  build_plan: z.array(z.object({ step: z.string(), skill_ids: z.array(z.string()) })).describe("Ordered steps (empty if not a build request)"),
  idea_sparks: z.array(z.string()).describe("For creative build requests: 3 bold, original concept directions nobody has seen; else empty"),
});

type Event = Record<string, unknown>;

const PLAN_SYSTEM = `You are the retrieval planner for ${site.name}, a library of thousands of AI agent skills (SKILL.md files for Claude, Codex/ChatGPT, Gemini CLI, Copilot, plus Cursor rules and Gemini extensions).
Turn the user's request into keyword queries that will find the right skills with a keyword search engine. Think about every technique, library, and discipline needed to do the job at the highest level (e.g. an immersive 3D website needs three.js/r3f, camera paths, GSAP ScrollTrigger, smooth scroll, shaders, 3D performance, frontend design, storytelling).
Category ids: ${CATEGORIES.map((c) => `${c.id} (${c.label})`).join(", ")}.`;

const ANSWER_SYSTEM = `You are the ${site.name} librarian — an expert at assembling the best combination of AI agent skills for a task.
You are given the user's request and a candidate list of skills (id | title | category | source | stars | description).
Pick the 6-14 skills that together let an agent do this task at the highest level. Prefer: official vendor skills (tier 1) for their own libraries, ${site.name} Originals (tier 0, flagship authored skills) for immersive/3D/scroll work, well-maintained popular community skills, and skills that complement rather than duplicate each other. Avoid near-duplicates; pick the best one.
Only use ids from the candidate list. Be concrete and brief. For creative build requests, idea_sparks should be genuinely original concepts tailored to the request (not generic effects).`;

function candidateLine(s: Skill) {
  const tier = s.source.tier === 0 ? "ORIGINAL" : s.source.official ? "official" : `tier${s.source.tier}`;
  return `${s.id} | ${s.title} | ${s.category} | ${s.source.repo} (${tier}) | ★${s.source.stars} | ${s.description.slice(0, 220)}`;
}

function buildPool(query: string, plan: z.infer<typeof Plan> | null, filters: Filters) {
  const scores = new Map<string, { skill: Skill; score: number }>();
  const add = (list: { skill: Skill; score: number }[], weight: number) => {
    list.forEach((r, i) => {
      const s = (r.score * weight) / (1 + i * 0.03);
      const cur = scores.get(r.skill.id);
      if (!cur || cur.score < s) scores.set(r.skill.id, { skill: r.skill, score: (cur?.score || 0) * 0.3 + s });
    });
  };
  add(keywordSearch(query, filters, 40), 1.2);
  for (const q of plan?.queries || []) add(keywordSearch(q, filters, 25), 1);
  for (const c of plan?.categories || []) {
    if (!CATEGORIES.some((x) => x.id === c)) continue;
    add(listSkills({ ...filters, category: c }, "score", 0, 10).items.map((skill) => ({ skill, score: 3 })), 1);
  }
  return [...scores.values()].sort((a, b) => b.score - a.score).slice(0, 90).map((x) => x.skill);
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { query?: string; filters?: Filters };
  const query = String(body.query || "").trim().slice(0, 1000);
  const filters: Filters = body.filters || {};
  if (!query) return Response.json({ error: "Empty query" }, { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: Event) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
          send({ type: "notice", message: "AI search is off — set ANTHROPIC_API_KEY in apps/web/.env.local. Showing keyword results." });
          send({ type: "candidates", items: keywordSearch(query, filters, 24).map((r) => toCard(r.skill)) });
          send({ type: "done", ai: false });
          return;
        }
        const client = new Anthropic();

        send({ type: "status", message: "Understanding your request…" });
        const planRes = await client.beta.messages.parse({
          model: MODEL,
          max_tokens: 2000,
          betas: [FALLBACK_BETA],
          fallbacks: "default",
          output_config: { effort: "low", format: zodOutputFormat(Plan) },
          system: PLAN_SYSTEM,
          messages: [{ role: "user", content: query }],
        });
        const plan = planRes.stop_reason === "refusal" ? null : planRes.parsed_output;
        if (plan) send({ type: "plan", plan });

        send({ type: "status", message: "Searching the library…" });
        const pool = buildPool(query, plan, filters);
        send({ type: "candidates", items: pool.slice(0, 24).map(toCard) });
        if (!pool.length) {
          send({ type: "done", ai: true });
          return;
        }

        send({ type: "status", message: "Assembling the best skill stack…" });
        const answerRes = await client.beta.messages.parse({
          model: MODEL,
          max_tokens: 8000,
          betas: [FALLBACK_BETA],
          fallbacks: "default",
          output_config: { effort: "medium", format: zodOutputFormat(Answer) },
          system: ANSWER_SYSTEM,
          messages: [
            {
              role: "user",
              content: `<request>\n${query}\n</request>\n${plan ? `<intent>${plan.intent} (build request: ${plan.is_build_request})</intent>\n` : ""}<candidates>\n${pool.map(candidateLine).join("\n")}\n</candidates>`,
            },
          ],
        });
        const answer = answerRes.stop_reason === "refusal" ? null : answerRes.parsed_output;
        if (!answer) {
          send({ type: "notice", message: "The AI couldn't rank this request — showing keyword results." });
          send({ type: "done", ai: false });
          return;
        }
        const byId = new Map(pool.map((s) => [s.id, s]));
        const results = answer.results.filter((r) => byId.has(r.id));
        send({
          type: "answer",
          summary: answer.summary,
          results: results.map((r) => ({ ...r, skill: toCard(byId.get(r.id)!) })),
          build_plan: answer.build_plan.map((p) => ({ ...p, skill_ids: p.skill_ids.filter((id) => byId.has(id)) })),
          idea_sparks: answer.idea_sparks,
        });
        send({ type: "done", ai: true });
      } catch (err) {
        const message =
          err instanceof Anthropic.AuthenticationError ? "Invalid ANTHROPIC_API_KEY."
          : err instanceof Anthropic.RateLimitError ? "Rate limited — try again in a moment."
          : err instanceof Anthropic.APIError ? `AI error ${err.status}: ${err.message}`
          : err instanceof Error ? err.message : "Unknown error";
        send({ type: "error", message });
        send({ type: "candidates", items: keywordSearch(query, filters, 24).map((r) => toCard(r.skill)) });
        send({ type: "done", ai: false });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
