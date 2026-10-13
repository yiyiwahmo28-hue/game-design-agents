import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { analyze, createState, getActions, simulate, step } from '../src/harbor.mjs';

const root = new URL('../', import.meta.url);
const jsonPath = new URL('docs/runs/rain-harbor/evidence.json', root);
const markdownPath = new URL('docs/runs/rain-harbor/evidence.md', root);
const policies = ['rescue-first', 'prepare-first', 'optimal'];
const baseKeys = ['configId', 'turn', 'fuel', 'prepared', 'rescuedIds', 'rescuedPeople', 'ended', 'endReason', 'fuelGained', 'fuelSpent'];
const base = (state) => Object.fromEntries(baseKeys.map((key) => [key, structuredClone(state[key])]));
const economics = (config) => Object.fromEntries(['turnLimit', 'initialFuel', 'refuelAmount', 'preparedRefuelAmount', 'prepareCost', 'boats'].map((key) => [key, structuredClone(config[key])]));
const economicState = (state) => Object.fromEntries(baseKeys.filter((key) => key !== 'configId').map((key) => [key, structuredClone(state[key])]));

function buildVersion(config) {
  const traces = Object.fromEntries(policies.map((policy) => [policy, simulate(config, { policy })]));
  const analysis = analyze(config);
  return { config, summary: {
    turnLimit: config.turnLimit, totalPeople: config.boats.reduce((sum, boat) => sum + boat.people, 0),
    policies: Object.values(traces).map((run) => ({ policy: run.policy, rescuedPeople: run.rescuedPeople,
      remainingBoatIds: run.remainingBoatIds, turnsUsed: run.turnsUsed, fuelLeft: run.fuelLeft,
      preparationUsed: run.preparationUsed, endReason: run.endReason })),
    optimalRescuedPeople: analysis.optimalRescuedPeople, optimalWithoutPreparation: analysis.optimalWithoutPreparation,
    analysisStates: analysis.analysisStates, firstActions: analysis.firstActions,
    latePreparationCounterexample: analysis.latePreparationCounterexample,
  }, analysis, traces };
}

function executeChecks(baseline, revised, rawBaseline, observation) {
  const checks = [];
  const executions = {};
  const config = revised.config;
  function check(id, name, nameZh, run) {
    try {
      const evidence = run();
      executions[id] = evidence;
      checks.push({ id, name, nameZh, status: 'passed', description: evidence.description, descriptionZh: evidence.descriptionZh });
    } catch (error) {
      checks.push({ id, name, nameZh, status: 'failed', description: error.message, descriptionZh: '检查未通过：' + error.message });
    }
  }
  function forward(state, action) {
    const result = step(config, state, action);
    assert.equal(result.ok, true, action + ' must succeed');
    return result;
  }
  function restoredScenario(before, action) {
    const saved = structuredClone(before);
    const accepted = forward(before, action);
    const preview = getActions(config, accepted.state).find((item) => item.id === 'undo');
    assert.equal(preview.available, true);
    assert.deepEqual(base(preview.restores), base(before));
    const restored = forward(accepted.state, 'undo');
    assert.deepEqual(base(restored.state), base(before));
    assert.equal(restored.state.undoRemaining, 0);
    assert.equal(restored.state.undoUsed, true);
    assert.equal(restored.state.history, null);
    assert.equal(restored.event.undoneAction, action);
    assert.deepEqual(before, saved);
    return { before, accepted: accepted.state, restored: restored.state, undoEvent: restored.event };
  }
  check('baseline-preserved', 'Original configuration preserved', '原版配置字节不变', () => {
    const sha256 = createHash('sha256').update(rawBaseline).digest('hex');
    assert.equal(sha256, observation.baselineConfigSha256);
    return { description: 'The baseline bytes match the SHA-256 recorded before the change request.',
      descriptionZh: '原版配置的字节内容与追加修改需求前记录的 SHA-256 一致。', sha256 };
  });
  check('economy-unchanged', 'Economic parameters unchanged', '经济参数保持不变', () => {
    assert.deepEqual(economics(baseline.config), economics(config));
    return { description: 'Turn budget, fuel, preparation and every boat cost/passenger count match the original.',
      descriptionZh: '回合上限、燃料、准备参数，以及每艘船的消耗和人数均与原版一致。', parameters: economics(config) };
  });
  check('undo-preparation', 'Preparation restored completely', '准备动作完整撤销', () => ({
    description: 'Prepare then undo restores turn, fuel, preparation and both fuel ledgers; the allowance stays spent.',
    descriptionZh: '准备后撤销会恢复回合、燃料、准备状态及燃料收支记录；撤销额度保持已用。',
    scenario: restoredScenario(createState(config), 'prepare'),
  }));
  check('undo-refuel', 'Refuel restored completely', '补给动作完整撤销', () => ({
    description: 'Undo restores ordinary and prepared refuel without keeping gained fuel.',
    descriptionZh: '普通补给和准备后的补给都能完整撤销，不会保留本次增加的燃料。',
    scenarios: [restoredScenario(createState(config), 'refuel'), restoredScenario(forward(createState(config), 'prepare').state, 'refuel')],
  }));
  check('undo-rescue', 'Rescue restored completely', '救援动作完整撤销', () => {
    const prepared = forward(createState(config), 'prepare').state;
    const supplied = forward(prepared, 'refuel').state;
    return { description: 'Prepare, refuel, rescue the trawler, then undo returns to turn 2, fuel 7 and zero rescued people.',
      descriptionZh: '准备、补给、救援渔船后撤销，恢复到第' + supplied.turn + '回合、燃料' + supplied.fuel + '、已救援' + supplied.rescuedPeople + '人。',
      scenario: restoredScenario(supplied, 'rescue:trawler') };
  });
  check('undo-terminal', 'Endings can be reopened', '终局后仍可撤销', () => {
    const terminal = revised.traces['prepare-first'].finalState;
    assert.equal(terminal.ended, true);
    const restored = forward(terminal, 'undo');
    assert.deepEqual(base(restored.state), terminal.history.before);
    assert.equal(restored.state.ended, false);
    assert.equal(restored.state.undoRemaining, 0);
    const fixture = { ...structuredClone(config), boats: [structuredClone(config.boats[0])] };
    const allRescued = step(fixture, createState(fixture), 'rescue:dinghy');
    assert.equal(allRescued.state.endReason, 'all-rescued');
    const reopened = step(fixture, allRescued.state, 'undo');
    assert.equal(reopened.ok, true);
    assert.equal(reopened.state.ended, false);
    assert.equal(reopened.state.rescuedPeople, 0);
    return { description: 'A storm ending and a one-boat all-rescued fixture both reopen; the undo allowance is spent.',
      descriptionZh: '暴风雨终局和单船全部获救的测试场景都可撤销并重新开放操作；撤销额度保持已用。',
      storm: { terminal, restored: restored.state }, allRescuedFixture: { config: fixture, terminal: allRescued.state, restored: reopened.state } };
  });
  check('undo-once', 'Allowance cannot be restored', '撤销额度不可恢复或刷取', () => {
    const spent = forward(forward(createState(config), 'prepare').state, 'undo').state;
    const later = forward(spent, 'refuel').state;
    const refusals = [spent, later].map((state) => {
      const result = step(config, state, 'undo');
      assert.equal(result.ok, false);
      assert.equal(result.error.code, 'undo-spent');
      assert.deepEqual(result.state, state);
      assert.equal(state.history, null);
      return result;
    });
    assert.equal(createState(config).undoRemaining, 1);
    return { description: 'A second undo fails immediately and after another successful action; a new run alone receives a new allowance.',
      descriptionZh: '撤销后立即再撤销、或再成功行动后撤销，均会被拒绝；只有开启新的一局才获得新额度。', refusals };
  });
  check('failures-preserve-history', 'Failures preserve the last success', '失败动作不覆盖撤销历史', () => {
    const after = forward(createState(config), 'prepare').state;
    const refused = ['prepare', 'rescue:ferry', 'missing'].map((action) => {
      const result = step(config, after, action);
      assert.equal(result.ok, false);
      assert.deepEqual(result.state, after);
      return { action, error: result.error };
    });
    const restored = forward(after, 'undo');
    assert.equal(restored.event.undoneAction, 'prepare');
    assert.deepEqual(base(restored.state), base(createState(config)));
    const terminal = revised.traces['prepare-first'].finalState;
    assert.deepEqual(step(config, terminal, 'refuel').state, terminal);
    assert.equal(step(config, terminal, 'undo').ok, true);
    return { description: 'Repeated preparation, unaffordable rescue, unknown input and closed-harbor attempts preserve history and resources.',
      descriptionZh: '重复准备、燃料不足的救援、未知操作和港口关闭后的行动尝试，均不改变历史与资源。', refused, restored: restored.state };
  });
  check('undo-ineligible', 'Undo respects eligibility', '原版与新局拒绝无效撤销', () => {
    const original = createState(baseline.config);
    const originalDenied = step(baseline.config, original, 'undo');
    assert.equal(originalDenied.error.code, 'undo-disabled');
    assert.deepEqual(originalDenied.state, original);
    const fresh = createState(config);
    const freshDenied = step(config, fresh, 'undo');
    assert.equal(freshDenied.error.code, 'nothing-to-undo');
    assert.deepEqual(freshDenied.state, fresh);
    return { description: 'The original has no undo; a new revised run cannot undo before its first success.',
      descriptionZh: '原版不提供撤销；修订版新局在首次成功行动前也不能撤销。', originalError: originalDenied.error, freshError: freshDenied.error };
  });
  check('forward-policies-preserved', 'Forward policy trajectories preserved', '不撤销策略轨迹保持一致', () => {
    const outcomes = policies.map((policy) => {
      const before = baseline.traces[policy];
      const after = revised.traces[policy];
      const expected = observation.policies.find((item) => item.policy === policy);
      assert.ok(expected);
      assert.deepEqual(before.trajectory.map(economicState), after.trajectory.map(economicState));
      assert.deepEqual(before.trace.map((event) => event.action), after.trace.map((event) => event.action));
      assert.deepEqual(before.trace.map((event) => event.action), expected.actions);
      assert.equal(before.rescuedPeople, expected.people);
      assert.equal(before.turnsUsed, expected.turns);
      assert.equal(after.trace.some((event) => event.action === 'undo'), false);
      return { policy, before: before.rescuedPeople, after: after.rescuedPeople, actions: after.trace.map((event) => event.action) };
    });
    assert.equal(revised.analysis.searchScope, 'forward-actions-only-no-undo');
    return { description: 'All three policies reproduce the originally observed actions and full economic trajectories; none chooses undo.',
      descriptionZh: '三种策略均复现首版实际记录的动作顺序与完整经济轨迹；这些策略都不会选择撤销。', outcomes };
  });
  return { checks, executions };
}

function renderMarkdown(report) {
  const { config, summary } = report.baseline;
  const lines = ['# Rain Harbor — executed baseline and revision evidence', '',
    'Generated by `node scripts/harbor-evidence.mjs --write` from both public fictional configurations and the shared engine.',
    'The follow-up request enables one undo; original configuration bytes and economic parameters are checked against the first-run record.', '',
    '## Executed rules', '',
    '- ' + config.turnLimit + ' forward turns; initial fuel ' + config.initialFuel + '. Refuel gains ' + config.refuelAmount + ', or ' + config.preparedRefuelAmount + ' after preparation. Preparation costs ' + config.prepareCost + ' fuel and one turn.',
    '- Every accepted forward action spends one turn. The final action resolves before closure.',
    '- Revised manual play can undo the last successful forward action once, including after an ending; undo restores its prior game state and spends no turn or fuel.',
    '- The spent allowance is outside the restored snapshot. Failed actions do not replace history.', '',
    '## Actual policy outcomes', '',
    '| Version | Policy | People rescued | Boats remaining | Fuel left | Turns | Prepared |',
    '| --- | --- | --- | --- | --- | --- | --- |'];
  for (const version of ['baseline', 'revised']) {
    for (const policy of report[version].summary.policies) lines.push('| ' + [version, policy.policy, policy.rescuedPeople, policy.remainingBoatIds.join(', ') || 'none', policy.fuelLeft, policy.turnsUsed, policy.preparationUsed].join(' | ') + ' |');
  }
  lines.push('', 'These policies do not use undo. Their full economic trajectories match the original observation; this does not predict human play.', '',
    '## Actual revision checks', '', 'Statuses come from assertions executed during report generation. Concrete states and events are retained under `executions` in the JSON.', '');
  for (const check of report.checks) lines.push('- **' + check.status + ': ' + check.name + '.** ' + check.description);
  lines.push('', '## Preparation and rescue tradeoff', '',
    'The forward-action optimizer visited ' + summary.analysisStates + ' physical states. Maximum rescued passengers: ' + summary.optimalRescuedPeople + '; with preparation prohibited: ' + summary.optimalWithoutPreparation + '.',
    'The revised optimizer also excludes undo and its histories. It does not enumerate every revised state.',
    'Undo returns to an earlier reachable position without retaining the discarded action benefit. It cannot improve the ideal-information passenger maximum in this fixed deterministic model; human mistake recovery remains unmeasured.', '',
    'Legal first-action comparisons (later forward choices optimized for the passenger objective):', '');
  for (const first of summary.firstActions) lines.push('- ' + first.action + ': ' + first.immediatePeople + ' people immediately; best final count ' + first.bestFinalPeople + '.');
  const late = summary.latePreparationCounterexample;
  if (late) lines.push('', 'Reachable late-choice counterexample:', '',
    'After ' + late.prefixActions.join(' → ') + ', turn ' + late.state.turn + ', fuel ' + late.state.fuel + ', ' + late.state.rescuedPeople + ' people rescued:',
    '- Prepare now: final ' + late.prepare.state.rescuedPeople + ' people.',
    '- ' + late.rescue.action + ' now: final ' + late.rescue.state.rescuedPeople + ' people.',
    'Both are actual transitions from the same reachable state. Preparing is not optimal in every state.');
  lines.push('', '## Policy traces and assumptions by version', '');
  for (const version of ['baseline', 'revised']) {
    for (const [policy, run] of Object.entries(report[version].traces)) {
      lines.push('### ' + version + ': ' + policy, '', run.trace.map((event) => event.action).join(' → '), '');
      for (const assumption of run.assumptions) lines.push('- ' + assumption);
      lines.push('');
    }
  }
  lines.push('## Reproduce', '', '`node --test tests/harbor.test.mjs`', '',
    '`node scripts/harbor-evidence.mjs --write`', '', '`node scripts/harbor-evidence.mjs --check`', '',
    '`--check` reruns actual scenarios and compares both reports byte for byte. Missing/stale files or failed scenarios cause a nonzero exit. Reports contain no execution timestamp or machine-specific path.', '',
    '## Limits', '');
  for (const limitation of report.limitations) lines.push('- ' + limitation);
  lines.push('', '## 中文摘要', '',
    '原版与修订版的不撤销策略实际结果一致：立即救援' + report.baseline.traces['rescue-first'].rescuedPeople + '人、先准备' + report.baseline.traces['prepare-first'].rescuedPeople + '人、前向优化' + summary.optimalRescuedPeople + '人；禁止准备的前向最优值' + summary.optimalWithoutPreparation + '人。',
    '撤销恢复准备、补给、救援及终局；额度不随快照恢复。通过状态来自本脚本实际断言，JSON保留执行状态。优化器未枚举全部撤销历史；不能据此证明真人理解、趣味性或多Agent优于单Agent。');
  return lines.join('\n') + '\n';
}

async function optionalRead(url) {
  try { return await readFile(url, 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && !['--write', '--check'].includes(args[0]))) throw new Error('Usage: node scripts/harbor-evidence.mjs [--write|--check]');
  const rawBaseline = await readFile(new URL('examples/rain-harbor/baseline.json', root));
  const original = JSON.parse(rawBaseline.toString('utf8'));
  const changed = JSON.parse(await readFile(new URL('examples/rain-harbor/revised.json', root), 'utf8'));
  const observation = JSON.parse(await readFile(new URL('docs/runs/rain-harbor/baseline-observation.json', root), 'utf8'));
  const baseline = buildVersion(original);
  const revised = buildVersion(changed);
  const { checks, executions } = executeChecks(baseline, revised, rawBaseline, observation);
  const report = { schemaVersion: 1, caseId: 'rain-harbor',
    source: { brief: 'docs/runs/rain-harbor/brief.md', changeRequest: 'docs/runs/rain-harbor/change-request.md',
      engine: 'src/harbor.mjs', baselineConfig: 'examples/rain-harbor/baseline.json', revisedConfig: 'examples/rain-harbor/revised.json',
      firstRunObservation: 'docs/runs/rain-harbor/baseline-observation.json' },
    baseline, revised, checks, executions,
    limitations: ['The core delegate combined systems, economy and implementation responsibilities; its local tests and this report are self-checks.',
      'The optimizer searches forward actions only, excluding undo histories; its optimum concerns the stated passenger objective.',
      'This script records deterministic model execution, not browser observation or human playtests.',
      'No improvement in fun, human comprehension or multi-agent effectiveness has been measured.'] };
  const json = JSON.stringify(report, null, 2) + '\n';
  const markdown = renderMarkdown(report);
  if (args[0] === '--write') {
    await mkdir(new URL('docs/runs/rain-harbor/', root), { recursive: true });
    await writeFile(jsonPath, json, 'utf8');
    await writeFile(markdownPath, markdown, 'utf8');
    console.log('Wrote docs/runs/rain-harbor/evidence.json and evidence.md');
  } else if (args[0] === '--check') {
    const actualJson = await optionalRead(jsonPath);
    const actualMarkdown = await optionalRead(markdownPath);
    const stale = [];
    if (actualJson !== json) stale.push('docs/runs/rain-harbor/evidence.json');
    if (actualMarkdown !== markdown) stale.push('docs/runs/rain-harbor/evidence.md');
    if (stale.length) {
      console.error('Stale or missing harbor evidence: ' + stale.join(', '));
      process.exitCode = 1;
    } else console.log('Harbor evidence matches both configurations, executed checks and the shared engine.');
  } else process.stdout.write(json);
  const failed = checks.filter((check) => check.status === 'failed');
  if (failed.length) {
    console.error('Failed harbor checks: ' + failed.map((check) => check.id).join(', '));
    process.exitCode = 1;
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
