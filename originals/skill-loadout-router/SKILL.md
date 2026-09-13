---
name: skill-loadout-router
title: Skill Loadout Router
description: Meta-skill that helps an agent pick and combine the right skills from the Skill Loadout library for a task — maps task types to skill stacks (3D/immersive web, SaaS, mobile, data science, security, docs, media), explains how skills compose, and how to install them for Claude, Codex/ChatGPT, Gemini CLI, Copilot and Cursor. Use at the start of a large or unfamiliar task, or when the user asks which skills to use.
license: MIT
category: workflow-agents
---

# Skill Loadout Router

Skills are most powerful in **combinations**: one skill for the concept, one for the core
technology, one for quality (tests/perf/security), one for polish (design/writing).

## How to route a task

1. **Classify the job**: build (what artifact?), analyze, fix, write, or operate.
2. **Pick one skill per layer** (skip layers that don't apply):
   - *Concept / direction* — e.g. `immersive-concept-director`, brainstorming, product/marketing skills
   - *Core technology* — the official vendor skill for each library you'll use (GSAP, Stripe, Supabase, Cloudflare, Expo, Remotion…)
   - *Craft* — design, frontend, animation, storytelling skills
   - *Quality* — testing, performance, security, code review skills
   - *Delivery* — docs, deployment, changelog/release skills
3. **Prefer**: official vendor skill > Skill Loadout Original (for immersive web) > top community skill. Avoid loading two skills that cover the same ground.
4. Load only what the current step needs; agents see name+description first and pull full instructions on demand.

## Ready-made stacks

| Goal | Skills (ids in the library) |
|------|----------------------------|
| Never-seen-before 3D website | immersive-concept-director → cinematic-scroll-3d-website + camera-flythrough-paths + scroll-storytelling-director + webgl-shader-effects + gsap-scrolltrigger + 3d-web-performance + frontend-design |
| Room walkthrough / virtual tour | room-walkthrough-3d + camera-flythrough-paths + 3d-web-performance + r3f-scroll-scenes |
| React/Next.js 3D site | r3f-scroll-scenes + gsap-react + camera-flythrough-paths + 3d-web-performance |
| SaaS product | frontend-design + Next.js/React best practices + auth + Stripe + Postgres/Supabase + testing + security review |
| Research/data | scientific skills (analysis, plotting, literature) + docs/writing |

The website's AI search builds these stacks automatically for any request and downloads them as one zip.

## Install locations

| Tool | Location |
|------|----------|
| Claude Code | `~/.claude/skills/<name>/` or `<repo>/.claude/skills/<name>/` |
| Claude.ai / Desktop | Settings → Capabilities → Skills → upload zip |
| Codex / ChatGPT | `~/.codex/skills/<name>/` (or repo `.agents/skills/`) |
| Gemini CLI | `~/.gemini/skills/<name>/` or `<repo>/.gemini/skills/<name>/` |
| GitHub Copilot | `<repo>/.github/skills/<name>/` |
| Cursor | `<repo>/.cursor/skills/<name>/`; Cursor rules in `.cursor/rules/` |

## Safety

Skills can contain scripts. Before running any bundled script: read it, check the ATTRIBUTION.md
(source + license), and heed the library's safety flags (prompt-injection text, pipe-to-shell,
credential access, destructive commands).
