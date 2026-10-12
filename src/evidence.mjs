import { compareConfigs } from './game.mjs';

export function buildEvidenceReport(before, after) {
  return {
    schemaVersion: 1,
    experiment: 'lantern-expedition',
    engine: 'src/game.mjs',
    inputs: [
      { path: 'examples/lantern-expedition/baseline.json', config: structuredClone(before) },
      { path: 'examples/lantern-expedition/revised.json', config: structuredClone(after) },
    ],
    comparison: compareConfigs(before, after),
    limitations: [
      'These are deterministic results for two declared policies, not player research.',
      'The sum of all listed upgrade prices is not the amount every strategy spends.',
      'An earlier first upgrade can change the time to finish; completion time is reported separately.',
      'No outcome is asserted for untested player choices or future configurations.',
    ],
  };
}

export function renderEvidenceJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function seconds(value) {
  return value === null ? 'not reached' : `${value} s`;
}

function delta(value) {
  return value === null ? 'not comparable' : `${value > 0 ? '+' : ''}${value} s`;
}

export function renderEvidenceMarkdown(report) {
  const { comparison } = report;
  const before = report.inputs[0].config;
  const after = report.inputs[1].config;
  const lines = [
    '# Lantern Expedition: deterministic simulation evidence',
    '',
    'Generated from the committed inputs using the same engine as the browser demo.',
    'This records model execution under explicit strategies; it does not measure human-player experience.',
    '',
    '## Inputs and rules',
    '',
    '- Engine: `src/game.mjs`.',
    '- Before: `examples/lantern-expedition/baseline.json`.',
    '- After: `examples/lantern-expedition/revised.json`.',
    `- Upgrade prices: [${before.upgradeCosts.join(', ')}] → [${after.upgradeCosts.join(', ')}].`,
    `- Sum of all listed upgrade prices: ${comparison.beforeTotalUpgradeCost} → ${comparison.afterTotalUpgradeCost}. Equal: ${comparison.sameTotalUpgradeCost}.`,
    `- Gather yield: ${before.baseYield} + level × ${before.yieldPerLevel} before; ${after.baseYield} + level × ${after.yieldPerLevel} after.`,
    `- Seconds per action before: gather ${before.actionSeconds.gather}, upgrade ${before.actionSeconds.upgrade}, explore ${before.actionSeconds.explore}.`,
    `- Seconds per action after: gather ${after.actionSeconds.gather}, upgrade ${after.actionSeconds.upgrade}, explore ${after.actionSeconds.explore}.`,
    `- Exploration cost / goal: ${before.exploreCost} / ${before.exploreGoal} before; ${after.exploreCost} / ${after.exploreGoal} after.`,
    '- Initial resources: zero in both versions. No gifts or random events.',
    '',
    '## Computed results',
    '',
    '| Policy | Version | First upgrade | Completion | Turns | Actual upgrade spend | Stop reason |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const result of comparison.policies) {
    for (const [version, run] of [['Before', result.before], ['After', result.after]]) {
      lines.push(`| ${result.policy} | ${version} | ${seconds(run.firstUpgradeSeconds)} | ${seconds(run.completionSeconds)} | ${run.turns} | ${run.actualUpgradeCost} | ${run.stopReason} |`);
    }
  }
  lines.push('', 'Deltas are after minus before; a negative time delta means earlier.', '');
  for (const result of comparison.policies) {
    lines.push(`- ${result.policy}: first-upgrade delta ${delta(result.firstUpgradeDeltaSeconds)}; completion delta ${delta(result.completionDeltaSeconds)}.`);
  }
  lines.push('', '## Policy assumptions', '');
  for (const result of comparison.policies) {
    lines.push(`### ${result.policy}`, '');
    if (JSON.stringify(result.before.assumptions) === JSON.stringify(result.after.assumptions)) {
      lines.push('The before and after runs share these assumptions.', '');
      for (const assumption of result.before.assumptions) lines.push(`- ${assumption}`);
      lines.push('');
    } else {
      for (const [version, run] of [['Before', result.before], ['After', result.after]]) {
        lines.push(`#### ${version}`, '');
        for (const assumption of run.assumptions) lines.push(`- ${assumption}`);
        lines.push('');
      }
    }
  }
  lines.push('## Reproduce and check', '',
    '- `node scripts/simulate.mjs` prints the computed JSON to standard output.',
    '- `node scripts/simulate.mjs --write` regenerates only this Markdown and `docs/evidence/simulation.json`.',
    '- `node scripts/simulate.mjs --check` exits nonzero if either committed evidence file is missing or differs from the current computation.',
    '- The JSON contains input configurations, every accepted action and all state snapshots.',
    '', '## Limits', '');
  for (const limitation of report.limitations) lines.push(`- ${limitation}`);
  return `${lines.join('\n')}\n`;
}

/** Byte-for-byte freshness, including the input snapshot and both renderings. */
export function checkEvidenceContents(json, markdown, report) {
  const stale = [];
  if (json !== renderEvidenceJson(report)) stale.push('docs/evidence/simulation.json');
  if (markdown !== renderEvidenceMarkdown(report)) stale.push('docs/evidence/simulation.md');
  return { fresh: stale.length === 0, stale };
}
