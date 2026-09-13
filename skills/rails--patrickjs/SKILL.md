---
name: "rails"
description: "Cursor rules for Rails development with basic setup."
license: CC0-1.0
---
# Rails

> Converted from a Cursor rule so it also works as an Agent Skill (Claude, Codex, Gemini CLI, Copilot). Original file kept alongside.

Rails 8 Development Guidelines

- Prefer Rails command-line generators over hand-written boilerplate.
- Use `bin/dev` for local development and check logs after significant changes.
- Follow Rails 8 conventions for Solid Queue, Solid Cache, Solid Cable, Propshaft, and Kamal where appropriate.
- Keep controllers RESTful and focused; use service objects for complex business logic.
- Use PostgreSQL, proper indexes, connection pooling, and safe migrations.
- Write Minitest coverage for models, controllers, and integration flows.
- Use Hotwire for standard Rails interactivity and Vite only when npm-managed JavaScript is needed.
