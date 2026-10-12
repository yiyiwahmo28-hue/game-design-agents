import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, readFile, writeFile, readdir, access, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const testRoot = resolve(fileURLToPath(new URL('./', import.meta.url)));
const projectRoot = resolve(testRoot, '..');

test('CLI stdout, regeneration and stale-evidence exit codes are exercised on an isolated copy', async () => {
  const temporary = await mkdtemp(join(testRoot, '.cli-check-'));
  try {
    for (const file of [
      'src/game.mjs', 'src/evidence.mjs', 'scripts/simulate.mjs',
      'examples/lantern-expedition/baseline.json',
      'examples/lantern-expedition/revised.json',
    ]) {
      const target = join(temporary, file);
      await mkdir(dirname(target), { recursive: true });
      await copyFile(join(projectRoot, file), target);
    }
    const run = (...args) => spawnSync(process.execPath, [join(temporary, 'scripts/simulate.mjs'), ...args], {
      cwd: temporary,
      encoding: 'utf8',
      timeout: 10_000,
    });
    const stdout = run();
    assert.equal(stdout.status, 0, stdout.stderr);
    assert.equal(JSON.parse(stdout.stdout).comparison.policies[0].after.completionSeconds, 290);
    await assert.rejects(access(join(temporary, 'docs/evidence/simulation.json')), { code: 'ENOENT' });
    const missing = run('--check');
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /Stale or missing evidence/);
    assert.equal(run('--write').status, 0);
    assert.deepEqual((await readdir(join(temporary, 'docs/evidence'))).sort(), ['simulation.json', 'simulation.md']);
    assert.equal(run('--check').status, 0);

    const jsonPath = join(temporary, 'docs/evidence/simulation.json');
    const markdownPath = join(temporary, 'docs/evidence/simulation.md');
    const originalJson = await readFile(jsonPath, 'utf8');
    const originalMarkdown = await readFile(markdownPath, 'utf8');
    const fabricated = JSON.parse(originalJson);
    fabricated.comparison.policies[0].after.completionSeconds = 1;
    await writeFile(jsonPath, `${JSON.stringify(fabricated, null, 2)}\n`, 'utf8');
    const staleJson = run('--check');
    assert.equal(staleJson.status, 1);
    assert.match(staleJson.stderr, /docs\/evidence\/simulation\.json/);
    assert.equal(run('--write').status, 0);
    assert.equal(await readFile(jsonPath, 'utf8'), originalJson);
    assert.equal(await readFile(markdownPath, 'utf8'), originalMarkdown);

    await writeFile(markdownPath, `${originalMarkdown}\nUnsupported claim.\n`, 'utf8');
    const staleMarkdown = run('--check');
    assert.equal(staleMarkdown.status, 1);
    assert.match(staleMarkdown.stderr, /docs\/evidence\/simulation\.md/);
    assert.equal(run('--write').status, 0);
    assert.equal(run('--check').status, 0);
    assert.equal(run('--unknown').status, 1);
  } finally {
    // Recursive cleanup is restricted to the freshly created child of tests/.
    assert.equal(dirname(resolve(temporary)), testRoot);
    await rm(temporary, { recursive: true, force: true });
  }
});
