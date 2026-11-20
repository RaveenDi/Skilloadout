import { readFile } from 'node:fs/promises';

try {
  if (process.argv.length !== 3) throw new Error('Usage: node scripts/plan.mjs <preset.json>');
  const input = JSON.parse(await readFile(process.argv[2], 'utf8'));
  const schema = JSON.parse(await readFile(new URL('../inputs.schema.json', import.meta.url), 'utf8'));
  if (!input || Array.isArray(input) || typeof input !== 'object') throw new Error('Expected an input object');
  for (const name of Object.keys(input)) {
    if (!Object.hasOwn(schema.properties, name)) throw new Error(`Unknown input: ${name}`);
  }
  for (const name of schema.required) {
    const rule = schema.properties[name];
    if (typeof input[name] !== 'string' || !input[name].trim()
      || [...input[name]].length < rule.minLength || [...input[name]].length > rule.maxLength) {
      throw new Error(`${name} must contain 1–${rule.maxLength} Unicode code points of nonblank text`);
    }
  }
  const sequence = JSON.parse(await readFile(new URL('../materials/sequence.json', import.meta.url), 'utf8'));
  console.log(JSON.stringify({
    status: 'plan-only', subject: input.subject, design: 'DESIGN.md', unit: sequence.unit,
    scenes: sequence.scenes.map(scene => ({ ...scene, text: input[scene.input] })),
    audio: 'silent',
  }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
