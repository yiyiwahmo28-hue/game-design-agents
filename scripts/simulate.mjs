import { readFile, mkdir, writeFile } from 'node:fs/promises';
import {
  buildEvidenceReport,
  renderEvidenceJson,
  renderEvidenceMarkdown,
  checkEvidenceContents,
} from '../src/evidence.mjs';

const root = new URL('../', import.meta.url);
const evidenceJson = new URL('docs/evidence/simulation.json', root);
const evidenceMarkdown = new URL('docs/evidence/simulation.md', root);

async function load(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, root), 'utf8'));
}

async function readOptional(url) {
  try {
    return await readFile(url, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && !['--write', '--check'].includes(args[0]))) {
    throw new Error('Usage: node scripts/simulate.mjs [--write|--check]');
  }
  const [before, after] = await Promise.all([
    load('examples/lantern-expedition/baseline.json'),
    load('examples/lantern-expedition/revised.json'),
  ]);
  const report = buildEvidenceReport(before, after);
  if (args[0] === '--write') {
    await mkdir(new URL('docs/evidence/', root), { recursive: true });
    await writeFile(evidenceJson, renderEvidenceJson(report), 'utf8');
    await writeFile(evidenceMarkdown, renderEvidenceMarkdown(report), 'utf8');
    process.stdout.write('Wrote docs/evidence/simulation.json and docs/evidence/simulation.md\n');
  } else if (args[0] === '--check') {
    const [json, markdown] = await Promise.all([readOptional(evidenceJson), readOptional(evidenceMarkdown)]);
    const check = checkEvidenceContents(json, markdown, report);
    if (!check.fresh) {
      process.stderr.write(`Stale or missing evidence: ${check.stale.join(', ')}\nRun node scripts/simulate.mjs --write\n`);
      process.exitCode = 1;
    } else {
      process.stdout.write('Evidence matches the current inputs and shared engine.\n');
    }
  } else {
    process.stdout.write(renderEvidenceJson(report));
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
