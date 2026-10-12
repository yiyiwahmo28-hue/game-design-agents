import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildEvidenceReport, renderEvidenceJson, renderEvidenceMarkdown,
  checkEvidenceContents,
} from '../src/evidence.mjs';

const before = JSON.parse(await readFile(new URL('../examples/lantern-expedition/baseline.json', import.meta.url), 'utf8'));
const after = JSON.parse(await readFile(new URL('../examples/lantern-expedition/revised.json', import.meta.url), 'utf8'));

test('evidence includes the actual inputs and action traces without timestamps or local machine paths', () => {
  const report = buildEvidenceReport(before, after);
  assert.deepEqual(report.inputs[0].config, before);
  assert.deepEqual(report.inputs[1].config, after);
  const serialized = renderEvidenceJson(report);
  const markdown = renderEvidenceMarkdown(report);
  assert.equal(serialized, renderEvidenceJson(buildEvidenceReport(before, after)));
  assert.equal(markdown, renderEvidenceMarkdown(buildEvidenceReport(before, after)));
  assert.equal(serialized.includes('C:\\'), false);
  assert.equal(/generatedAt|timestamp|currentDate/.test(serialized), false);
  for (const row of report.comparison.policies) {
    assert.ok(row.before.events.length > 0);
    assert.ok(row.after.events.length > 0);
  }
  assert.match(markdown, /not reached/);
  assert.match(markdown, /Actual upgrade spend/);
  assert.match(markdown, /does not measure human-player experience/);
});

test('freshness checks detect missing files, altered numbers, changed assumptions and stale source configurations', () => {
  const report = buildEvidenceReport(before, after);
  const json = renderEvidenceJson(report);
  const markdown = renderEvidenceMarkdown(report);
  assert.deepEqual(checkEvidenceContents(json, markdown, report), { fresh: true, stale: [] });
  assert.equal(checkEvidenceContents(null, markdown, report).fresh, false);
  assert.equal(checkEvidenceContents(json, null, report).fresh, false);
  const fabricated = JSON.parse(json);
  fabricated.comparison.policies[0].after.completionSeconds = 1;
  assert.deepEqual(checkEvidenceContents(`${JSON.stringify(fabricated, null, 2)}\n`, markdown, report).stale, ['docs/evidence/simulation.json']);
  assert.deepEqual(checkEvidenceContents(json, markdown.replace('no gifts', 'free gifts'), report).stale, ['docs/evidence/simulation.md']);
  const changed = buildEvidenceReport(before, { ...structuredClone(after), exploreGoal: 9 });
  assert.deepEqual(checkEvidenceContents(json, markdown, changed).stale, ['docs/evidence/simulation.json', 'docs/evidence/simulation.md']);
});

test('different exploration costs keep each version\'s assumptions in the Markdown report', () => {
  const moreExpensiveExploration = { ...structuredClone(after), exploreCost: 10 };
  const report = buildEvidenceReport(before, moreExpensiveExploration);
  const markdown = renderEvidenceMarkdown(report);
  assert.match(markdown, /Exploration cost \/ goal: 8 \/ 8 before; 10 \/ 8 after/);
  for (const policy of ['upgrade-first', 'explore-first']) {
    const section = markdown.split(`### ${policy}\n`)[1].split('\n### ')[0].split('\n## ')[0];
    const beforeSection = section.split('#### Before\n')[1].split('#### After\n')[0];
    const afterSection = section.split('#### After\n')[1];
    assert.match(beforeSection, /Each exploration spends 8 resources/);
    assert.doesNotMatch(beforeSection, /Each exploration spends 10 resources/);
    assert.match(afterSection, /Each exploration spends 10 resources/);
    assert.doesNotMatch(afterSection, /Each exploration spends 8 resources/);
  }
  assert.match(renderEvidenceMarkdown(buildEvidenceReport(before, after)), /The before and after runs share these assumptions/);
});
