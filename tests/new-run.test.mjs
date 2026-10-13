import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkRun, createRun, parseArgs } from '../scripts/new-run.mjs';

const script = fileURLToPath(new URL('../scripts/new-run.mjs', import.meta.url));

async function workspace(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'game-design-entry-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

test('CLI preserves a Unicode multiline brief exactly and works outside the checkout', async t => {
  const cwd = await workspace(t);
  const brief = '\uFEFF采集与探索。\r\n\r\nPreserve `config` and ```markdown fences.\r\n';
  await fs.writeFile(path.join(cwd, 'input.md'), brief, 'utf8');
  const result = spawnSync(process.execPath, [script, '--name', 'new-game', '--brief-file', 'input.md', '--lang', 'zh', '--output', 'created'], { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const destination = path.join(cwd, 'created');
  assert.equal(await fs.readFile(path.join(destination, 'brief.md'), 'utf8'), brief);
  const instructions = await fs.readFile(path.join(destination, 'START_HERE.md'), 'utf8');
  assert.ok(instructions.includes(brief));
  assert.ok(instructions.includes(destination));
  assert.ok(instructions.includes(path.resolve(path.dirname(script), '..', 'skills', 'game-design-team', 'SKILL.md')));
  for (const directory of ['design', 'config', 'prototype', 'evidence']) {
    assert.deepEqual(await fs.readdir(path.join(destination, directory)), []);
  }
  const checked = spawnSync(process.execPath, [script, '--check', destination], { cwd, encoding: 'utf8' });
  assert.equal(checked.status, 1, 'An empty scaffold must never be reported as a completed delivery.');
});

test('inline brief, language, and chosen name survive creation', async t => {
  const cwd = await workspace(t);
  const brief = 'Make "choices" cost 2 energy.\nKeep $cost literal.';
  const options = parseArgs(['--name', 'choice-game', '--brief', brief, '--output', 'choice']);
  const { destination } = await createRun(options, { cwd });
  assert.equal(await fs.readFile(path.join(destination, 'brief.md'), 'utf8'), brief);
  const manifest = JSON.parse(await fs.readFile(path.join(destination, 'delivery.json'), 'utf8'));
  assert.equal(manifest.name, 'choice-game');
  assert.equal(manifest.language, 'en');
  assert.equal(manifest.executionMode, 'unrecorded');
});

test('existing user work is never overwritten, including an empty destination', async t => {
  const cwd = await workspace(t);
  for (const name of ['empty', 'occupied']) {
    await fs.mkdir(path.join(cwd, name));
    if (name === 'occupied') await fs.writeFile(path.join(cwd, name, 'brief.md'), 'KEEP THIS');
    await assert.rejects(createRun(parseArgs(['--name', name, '--brief', 'New idea', '--output', name]), { cwd }), /already exists/);
  }
  assert.equal(await fs.readFile(path.join(cwd, 'occupied', 'brief.md'), 'utf8'), 'KEEP THIS');
  assert.deepEqual(await fs.readdir(path.join(cwd, 'empty')), []);
});

test('unsafe names, ambiguous input, traversal, and empty requests cannot create a run', async t => {
  const cwd = await workspace(t);
  for (const name of ['../outside', '..\\outside', '/absolute', 'a/b', 'CON', 'nul', 'lpt1', '']) {
    assert.throws(() => parseArgs(['--name', name, '--brief', 'Idea']));
  }
  assert.throws(() => parseArgs(['--name', 'game', '--brief', 'Idea', '--brief-file', 'input.md']));
  assert.throws(() => parseArgs(['--name', 'game', '--brief', 'Idea', '--lang', 'xx']));
  assert.throws(() => parseArgs(['--name', 'game', '--brief', 'Idea', '--output', 'a', '--output', 'b']));
  await assert.rejects(createRun(parseArgs(['--name', 'game', '--brief', 'Idea', '--output', '../outside']), { cwd }), /traversal/);
  await assert.rejects(createRun(parseArgs(['--name', 'game', '--brief', ' \n ', '--output', 'empty-brief']), { cwd }), /non-whitespace/);
  assert.deepEqual(await fs.readdir(cwd), []);
});

test('delivery checking reports actual missing files and accepts a complete file set without claiming runtime quality', async t => {
  const cwd = await workspace(t);
  const { destination } = await createRun(parseArgs(['--name', 'game', '--brief', 'Idea', '--output', 'game']), { cwd });
  const manifestPath = path.join(destination, 'delivery.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const emptyCheck = await checkRun(destination);
  assert.equal(emptyCheck.ok, false);
  assert.equal(emptyCheck.problems.length, 6);
  manifest.executionMode = 'sequential';
  for (const artifact of manifest.artifacts) await fs.writeFile(path.join(destination, artifact.path), `File for ${artifact.id}; execution remains unverified.`);
  await fs.writeFile(manifestPath, JSON.stringify(manifest));
  assert.equal((await checkRun(destination)).ok, true);
  await fs.writeFile(path.join(destination, 'config', 'game.json'), '');
  const checked = await checkRun(destination);
  assert.equal(checked.ok, false);
  assert.ok(checked.problems.some(problem => problem.startsWith('config:')));
});

test('manifest paths cannot substitute instructions or escape the run directory', async t => {
  const cwd = await workspace(t);
  const { destination } = await createRun(parseArgs(['--name', 'game', '--brief', 'Idea', '--output', 'game']), { cwd });
  const manifestPath = path.join(destination, 'delivery.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  manifest.executionMode = 'sequential';
  for (const artifact of manifest.artifacts) await fs.writeFile(path.join(destination, artifact.path), `Delivered ${artifact.id}`);
  await fs.writeFile(manifestPath, JSON.stringify(manifest));
  assert.equal((await checkRun(destination)).ok, true);
  await fs.writeFile(path.join(cwd, 'outside.md'), 'Private neighbor');
  for (const value of ['../outside.md', '..\\outside.md', path.join(cwd, 'outside.md'), 'C:\\secret.md', 'brief.md', 'START_HERE.md', 'delivery.json']) {
    manifest.artifacts[0].path = value;
    await fs.writeFile(manifestPath, JSON.stringify(manifest));
    assert.equal((await checkRun(destination)).ok, false, value);
  }
  manifest.artifacts[0].path = manifest.artifacts[1].path;
  await fs.writeFile(manifestPath, JSON.stringify(manifest));
  assert.equal((await checkRun(destination)).ok, false, 'One file must not masquerade as multiple required outputs.');
  assert.equal(await fs.readFile(path.join(cwd, 'outside.md'), 'utf8'), 'Private neighbor');
});

test('symbolic-link destinations and manifest ancestors are rejected', async t => {
  const cwd = await workspace(t);
  await fs.mkdir(path.join(cwd, 'outside'));
  try {
    await fs.symlink(path.join(cwd, 'outside'), path.join(cwd, 'shortcut'), process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    if (error.code === 'EPERM' || error.code === 'EACCES') return t.skip('This environment cannot create a test symbolic link.');
    throw error;
  }
  await assert.rejects(createRun(parseArgs(['--name', 'game', '--brief', 'Idea', '--output', 'shortcut/game']), { cwd }), /Symbolic links/);
  assert.deepEqual(await fs.readdir(path.join(cwd, 'outside')), []);
  const { destination } = await createRun(parseArgs(['--name', 'game', '--brief', 'Idea', '--output', 'game']), { cwd });
  await fs.writeFile(path.join(cwd, 'outside', 'design.md'), 'Neighbor design');
  await fs.symlink(path.join(cwd, 'outside'), path.join(destination, 'external'), process.platform === 'win32' ? 'junction' : 'dir');
  const manifestPath = path.join(destination, 'delivery.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  manifest.artifacts[0].path = 'external/design.md';
  await fs.writeFile(manifestPath, JSON.stringify(manifest));
  const result = await checkRun(destination);
  assert.ok(result.problems.some(problem => problem.includes('Symbolic links')));
});
