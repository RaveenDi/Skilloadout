---
name: "anti-overengineering"
description: "Prevent AI over-engineering by keeping changes scoped, simple, and directly tied to the user's request"
license: CC0-1.0
---
# Anti Overengineering

> Converted from a Cursor rule so it also works as an Agent Skill (Claude, Codex, Gemini CLI, Copilot). Original file kept alongside.

# Anti-Over-Engineering

Only change what was asked. Simplest solution first. When unsure, ask.

Do not modify unrequested code, add abstractions without a concrete need, import unnecessary dependencies, rewrite entire files for small changes, or add error handling for impossible scenarios.

Before delivery: verify you only changed requested code, check for simpler approaches, confirm no unrequested files were touched.
