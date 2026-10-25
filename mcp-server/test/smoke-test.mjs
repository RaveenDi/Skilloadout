// Manual smoke test, not shipped as part of the server. Run with: node test/smoke-test.mjs
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const SERVER = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "index.mjs");

const client = new Client({ name: "smoke-test", version: "0.0.1" });
const transport = new StdioClientTransport({ command: process.execPath, args: [SERVER] });
await client.connect(transport);

const tools = await client.listTools();
console.log("tools:", tools.tools.map((t) => t.name).join(", "));

const cats = await client.callTool({ name: "list_categories", arguments: {} });
console.log("\n[list_categories] first 2 lines:\n" + cats.content[0].text.split("\n").slice(0, 2).join("\n"));

const search = await client.callTool({ name: "search_skills", arguments: { query: "context engineering agent", limit: 5 } });
console.log("\n[search_skills] result:\n" + search.content[0].text);

const get = await client.callTool({ name: "get_skill", arguments: { id: "harness-engineering" } });
console.log("\n[get_skill harness-engineering] first 300 chars:\n" + get.content[0].text.slice(0, 300));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "skillloadout-mcp-test-"));
const install = await client.callTool({ name: "install_skill", arguments: { id: "ai-engineering", client: "claude", cwd: tmp } });
console.log("\n[install_skill ai-engineering] ->", install.content[0].text);
console.log("installed file exists:", fs.existsSync(path.join(tmp, ".claude", "skills", "ai-engineering", "SKILL.md")));
fs.rmSync(tmp, { recursive: true, force: true });

const reviewed = await client.callTool({ name: "get_skill", arguments: { id: "yara-rule-authoring--trailofbits" } });
console.log("\n[get_skill reviewed-benign] " + reviewed.content[0].text.split("\n").find((l) => l.startsWith("safety")));
const benignSearch = await client.callTool({ name: "search_skills", arguments: { query: "yara rule authoring", limit: 1 } });
console.log("[search reviewed-benign] no warning tag:", !/\[(⛔|⚠|ℹ)/.test(benignSearch.content[0].text.split("\n")[0]));
const unverified = await client.callTool({ name: "search_skills", arguments: { query: "aspire", limit: 1 } });
console.log("[search unverified] " + unverified.content[0].text.split("\n")[0]);

const badId = await client.callTool({ name: "get_skill", arguments: { id: "not-a-real-skill-xyz" } });
console.log("\n[get_skill bad id] isError:", !!badId.isError, "-", badId.content[0].text);

await client.close();
console.log("\nOK");
