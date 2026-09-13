import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root=path.resolve(import.meta.dirname,"..");const expected="webgl",file=path.join(root,"SKILL.md"),errors=[];
if(!fs.existsSync(file))errors.push("SKILL.md is missing");else{const text=fs.readFileSync(file,"utf8"),front=text.match(/^---\r?\n([\s\S]*?)\r?\n---/);if(!front)errors.push("frontmatter is missing");else{const name=front[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();if(name!==expected)errors.push(`name must be ${expected}`);const description=front[1].match(/^description:\s*(.+)$/m)?.[1]?.trim()??"";if(description.length<1||description.length>1024)errors.push("description must be 1-1024 characters");const fields=[...front[1].matchAll(/^([a-z][a-z-]*):/gm)].map((m)=>m[1]);for(const field of fields)if(!["name","description"].includes(field??""))errors.push(`non-portable frontmatter field: ${field}`);}for(const match of text.matchAll(/\[[^\]]*\]\(([^)#]+)(?:#[^)]+)?\)/g)){const target=match[1];if(!target||/^[a-z]+:/i.test(target))continue;const resolved=path.resolve(root,target);if(!resolved.startsWith(root+path.sep)||!fs.existsSync(resolved))errors.push(`broken/escaping link: ${target}`);}}
for(const child of ["references","checklists","examples","templates","scripts","evaluations"])if(!fs.existsSync(path.join(root,child)))errors.push(`missing ${child}`);
if(errors.length){console.error(errors.map((error)=>`ERROR ${error}`).join("\n"));process.exit(1);}console.log(`Audited ${expected} skill.`);
