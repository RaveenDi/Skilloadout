# Skill Loadout MCP server

Search, inspect, and install skills from the [Skill Loadout](https://github.com/RaveenDi/Skilloadout)
catalog — 12,000+ license-checked, safety-scanned AI agent skills — from any MCP-compatible client
(Claude Code, Claude Desktop, Cursor, Codex CLI, Gemini CLI). No backend, no API key, no network
calls: it reads `catalog/index.json` and `skills/` straight off the git checkout it runs in. The
repo's scheduler (`update-skills.yml`) refreshes that data every 3 days — `git pull` is all this
server ever needs to stay current.

## Tools

- **`search_skills`** — free-text query, optional `category` filter, returns ranked matches with
  id, title, category, availability, and any safety flags.
- **`get_skill`** — full `SKILL.md` for a mirrored (installable) skill, or the upstream link for a
  link-only one (license doesn't allow redistribution).
- **`install_skill`** — copies a skill's folder into a project: pick a `client`
  (`claude`/`codex`/`gemini`/`copilot`/`cursor`) for its conventional skills directory, or pass an
  explicit `targetDir`.
- **`list_categories`** — the 36 taxonomy categories, for narrowing `search_skills`.

## Run it

```bash
cd mcp-server
npm install
```

Then point any MCP client at `node <path-to-repo>/mcp-server/index.mjs`.

**Claude Code** (project-scoped — this repo already ships one at `.mcp.json`, so opening it in
Claude Code offers to connect automatically):

```json
{
  "mcpServers": {
    "skill-loadout": { "command": "node", "args": ["mcp-server/index.mjs"] }
  }
}
```

Or from elsewhere on disk:

```bash
claude mcp add skill-loadout -- node /path/to/Skilloadout/mcp-server/index.mjs
```

**Claude Desktop / Cursor / other MCP clients** — add the same `command`/`args` pair to that
client's MCP config, pointing at a local clone of this repo.

## Why no npm package (yet)

This ships as plain `node index.mjs` against a git clone on purpose: zero publish step, zero
registry account, and the data is always exactly what's checked out — no version to bump when the
catalog updates. Publishing `skill-loadout-mcp` to npm later (for a plain `npx -y skill-loadout-mcp`
one-liner) is a reasonable follow-up, but it needs someone's npm account to run `npm publish`, so
it's left as a manual, opt-in step rather than something done automatically here.

## Testing

`test/smoke-test.mjs` drives the server through a real MCP client connection (not shipped as a
dependency of the server itself):

```bash
npm install --no-save @modelcontextprotocol/client
node test/smoke-test.mjs
```
