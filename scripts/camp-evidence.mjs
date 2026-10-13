import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { analyze, createState, evaluateGoal, getActions, simulate, step } from '../src/camp.mjs';

const root = new URL('../', import.meta.url);
const output = new URL('docs/runs/signal-camp/', root);
const policyNames = ['signal-first', 'survey-first', 'bundle-first'];
const baselineBytes = await readFile(new URL('examples/signal-camp/baseline.json', root));
const baseline = JSON.parse(baselineBytes);
const revised = JSON.parse(await readFile(new URL('examples/signal-camp/revised.json', root), 'utf8'));
const original = JSON.parse(await readFile(new URL('baseline-observation.json', output), 'utf8'));
function economics(config) { const { id, title, titleZh, mode, ...rules } = config; return rules; }
function version(config) {
  const traces = Object.fromEntries(policyNames.map((policy) => [policy, simulate(config, { policy })]));
  return { config, traces, analysis: analyze(config) };
}
const versions = { baseline: version(baseline), revised: version(revised) };
const checks = []; const executions = {};
function check(id, name, nameZh, callback) {
  try {
    const result = callback(); executions[id] = result;
    checks.push({ id, name, nameZh, status: 'passed', description: result.description, descriptionZh: result.descriptionZh });
  } catch (error) {
    checks.push({ id, name, nameZh, status: 'failed', description: error.message, descriptionZh: `检查失败：${error.message}` });
  }
}
function replay(config, ids) {
  let state = createState(config);
  for (const id of ids) { const result = step(config, state, id); assert.equal(result.ok, true, id); state = result.state; }
  return state;
}
const baseRun = versions.baseline.traces['signal-first'];
const signalRun = versions.revised.traces['signal-first'];
const surveyRun = versions.revised.traces['survey-first'];

check('baseline-preserved', 'Original baseline retained', '原版快照保持不变', () => {
  const sha256 = createHash('sha256').update(baselineBytes).digest('hex');
  assert.equal(sha256, original.baselineConfigSha256);
  for (const run of original.runs) assert.deepEqual(versions.baseline.traces[run.policy], run);
  return { description: 'Baseline configuration bytes and both executed baseline traces match the record made before writing the revised configuration.',
    descriptionZh: '原版配置字节和两条实际轨迹，均与写入改版配置前保存的记录一致。', sha256 };
});
check('economic-contract-preserved', 'Only construction availability changes', '只改变建设开放方式', () => {
  assert.deepEqual(economics(baseline), economics(revised));
  assert.equal(baseline.mode, 'bundled'); assert.equal(revised.mode, 'modular');
  return { description: 'Initial supplies, income, horizon, all prices, mission windows/outcomes and goal requirements are identical. Only construction availability differs.',
    descriptionZh: '初始补给、逐回合到账、总时段、所有价格、任务窗口与结果、目标门槛均相同，只改变整包/分步建设开放方式。', parameters: economics(baseline) };
});
check('income-at-every-turn', 'Same income at every matching turn', '每一回合到账相同', () => {
  const ledgers = [baseRun, signalRun, surveyRun].map((run) => run.trajectory.map((state) => state.grossIncome));
  assert.deepEqual(ledgers, [0, 1, 2].map(() => [0, 1, 2, 3, 4, 5, 6]));
  for (const run of [baseRun, signalRun, surveyRun]) {
    assert.equal(run.finalState.turn, 6); assert.equal(run.finalState.spent, 8); assert.equal(run.finalState.supplies, 1);
  }
  return { description: 'All three completed witness routes receive [0,1,2,3,4,5,6] cumulative supplies, spend 8 and finish with 1. Initial supplies are 3; total available is 9.',
    descriptionZh: '三条完整对照路线逐时段累计到账均为[0,1,2,3,4,5,6]，花费8、余额1。初始3，含初始总可用9。', ledgers };
});
check('forced-wait-and-new-choice', 'Three forced waits become a turn-one fork', '前三回合被动等待变为首回合分支', () => {
  let state = createState(baseline); const availability = [];
  for (let turn = 0; turn < 3; turn++) {
    const legal = getActions(baseline, state).filter((action) => action.available).map((action) => action.id);
    assert.deepEqual(legal, ['wait']); availability.push({ turn: turn + 1, legal }); state = step(baseline, state, 'wait').state;
  }
  assert.equal(getActions(baseline, state).find((action) => action.id === 'build:bundle').available, true);
  const revisedInitial = getActions(revised, createState(revised)).filter((action) => action.available).map((action) => action.id);
  assert.deepEqual(revisedInitial, ['build:beacon', 'build:survey-kit', 'wait']);
  return { description: 'Baseline turns 1–3 allow only waiting; construction first opens at turn 4. Revision turn 1 exposes two distinct module routes plus voluntary waiting.',
    descriptionZh: '原版第1–3回合只能等待，第4回合首次可建设；改版第1回合开放两条结果不同的模块路线，并保留主动等待。', availability, revisedInitial };
});
check('inclusive-window-boundary', 'Turn two counts; turn three is late', '第2回合有效，第3回合已迟', () => {
  const results = [];
  for (const [module, mission] of [['beacon', 'signal'], ['survey-kit', 'survey']]) {
    const early = replay(revised, [`build:${module}`, mission]);
    const late = replay(revised, [`build:${module}`, 'wait', mission]);
    const rule = revised.missions[mission];
    assert.equal(early[rule.metric], rule.earlyValue); assert.equal(late[rule.metric], rule.lateValue);
    assert.equal(early.missions[0].early, true); assert.equal(late.missions[0].early, false);
    results.push({ mission, early, late });
  }
  return { description: 'Mission effects use the action being executed (turn + 1). Both early windows include turn 2; turn 3 pays the unchanged late outcome.',
    descriptionZh: '任务按即将执行的回合turn+1结算；第2回合仍命中早期窗口，第3回合只能获得原有的晚期结果。', scenarios: results };
});
check('goal-dependent-preference', 'The preferred module reverses with the goal', '目标变化，优先模块反转', () => {
  const matrix = [signalRun, surveyRun].map((run) => ({ policy: run.policy, people: run.finalState.people, routes: run.finalState.routes,
    goals: revised.goals.map((goal) => evaluateGoal(revised, run.finalState, goal.id)) }));
  assert.deepEqual(matrix.map((row) => row.goals.map((goal) => goal.met)), [[true, false], [false, true]]);
  return { description: 'Beacon first satisfies 6 people + 1 route; survey kit first satisfies 2 people + 3 routes. The other ordering fails that same hard goal.',
    descriptionZh: '信标先行达到6人+1路线；勘测先行达到2人+3路线。目标互换后，同一路线不再达标。', matrix };
});
check('all-futures-not-cherry-picked', 'Search every legal future', '穷举全部合法未来', () => {
  const old = versions.baseline.analysis; const current = versions.revised.analysis;
  assert.deepEqual(old.paretoFrontier.map(({ people, routes }) => [people, routes]), [[2, 1]]);
  assert.deepEqual(current.paretoFrontier.map(({ people, routes }) => [people, routes]), [[6, 1], [2, 3]]);
  assert.equal(current.terminalOutcomes.some((state) => state.people >= 6 && state.routes >= 3), false);
  for (const first of current.firstActions) {
    assert.equal(first.goals.find((goal) => goal.id === 'rescue-priority').achievable, first.id === 'build:beacon');
    assert.equal(first.goals.find((goal) => goal.id === 'route-priority').achievable, first.id === 'build:survey-kit');
  }
  return { description: 'The reachable frontier is (6 people,1 route) or (2 people,3 routes). No legal sequence attains both high outcomes; only its matching first module can attain each hard goal.',
    descriptionZh: '可达前沿只有(6人,1路线)和(2人,3路线)；没有合法序列同时拿到两种高结果。每个硬目标只能从对应的首回合模块达到。', firstActions: current.firstActions,
    baselineFrontier: old.paretoFrontier, revisedFrontier: current.paretoFrontier };
});
check('waiting-and-build-cost-disclosed', 'Waiting remains and construction takes another action', '等待仍在，建设多占一次行动', () => {
  assert.deepEqual(baseRun.summary.waitTurns, [1, 2, 3]);
  const counts = [];
  for (const run of [signalRun, surveyRun]) {
    assert.deepEqual(run.summary.waitTurns, [3, 4]);
    const builds = run.trace.filter((event) => event.action.startsWith('build:')).length;
    assert.equal(builds, 2); counts.push({ policy: run.policy, waits: run.summary.waitTurns, buildActions: builds });
  }
  assert.equal(baseRun.trace.filter((event) => event.action.startsWith('build:')).length, 1);
  return { description: 'The modular witnesses still wait on turns 3 and 4 and spend two construction actions instead of one. They move a consequential choice earlier; they do not remove all waiting.',
    descriptionZh: '改版对照路线第3、4回合仍等待，建设从一次变为两次。它把有后果的选择前移，并没有消除所有等待。', counts };
});
check('retained-bundle-is-not-a-third-winner', 'The retained bundle misses both early goals', '保留整包无法赶上两个早期目标', () => {
  const run = versions.revised.traces['bundle-first'];
  assert.deepEqual([run.finalState.people, run.finalState.routes], [2, 1]);
  assert.equal(run.summary.goals.some((goal) => goal.met), false);
  const firstWait = versions.revised.analysis.firstActions.find((action) => action.id === 'wait');
  assert.equal(firstWait.goals.some((goal) => goal.achievable), false);
  return { description: 'The retained bundle and a turn-one wait cannot reach either stated goal. They are convenience/comparison options, not a claimed third competitive strategy.',
    descriptionZh: '保留整包或首回合先等待，都无法达到任一既定目标。它们是对照/便捷选项，不能称为第三条同样有效的策略。', summary: run.summary, firstWait };
});
check('whole-state-legal-conservation', 'Conservation and previews hold in every reachable state', '所有可达状态收支与预览一致', () => {
  const counts = [];
  for (const config of [baseline, revised]) {
    const seen = new Set(); let accepted = 0; let rejected = 0;
    function visit(state) {
      const key = JSON.stringify([state.turn, state.supplies, state.modules, state.people, state.routes]);
      if (seen.has(key)) return; seen.add(key);
      assert.equal(state.grossIncome, state.turn * config.incomePerTurn);
      assert.equal(state.supplies, config.initialSupplies + state.grossIncome - state.spent);
      for (const action of getActions(config, state)) {
        const result = step(config, state, action.id);
        assert.equal(result.ok, action.available);
        if (!result.ok) { assert.deepEqual(result.state, state); rejected++; continue; }
        accepted++;
        for (const key of ['turn', 'supplies', 'people', 'routes']) assert.equal(result.state[key], action.preview[key]);
        visit(result.state);
      }
    }
    visit(createState(config)); counts.push({ configId: config.id, states: seen.size, accepted, rejected });
  }
  return { description: 'Every reachable state balances initial + gross income − spending. Every legal action matches its preview, and all rejected actions preserve state and receive no delivery.',
    descriptionZh: '所有可达状态都满足初始+毛收入−支出=余额。每个合法动作与预览一致；拒绝动作不改变状态，也不额外到账。', counts };
});
check('last-turn-and-no-early-stop', 'The horizon is fixed even after task completion', '任务完成后仍保持固定时长', () => {
  const fixture = { ...structuredClone(revised), initialSupplies: 20 };
  const complete = replay(fixture, ['build:bundle', 'signal', 'survey']);
  assert.equal(complete.missions.length, 2); assert.equal(complete.ended, false);
  const final = replay(fixture, ['build:bundle', 'signal', 'survey', 'wait', 'wait', 'wait']);
  assert.equal(final.grossIncome, 6); assert.equal(final.ended, true);
  const denied = step(fixture, final, 'wait'); assert.equal(denied.ok, false); assert.deepEqual(denied.state, final);
  assert.equal(signalRun.trace.at(-1).action, 'survey'); assert.equal(signalRun.finalState.routes, 1);
  return { description: 'A labeled high-starting-supply boundary fixture completes tasks at turn 3 but continues to turn 6. Final-turn mission effects and delivery resolve before closure; no seventh action runs.',
    descriptionZh: '标注的高初始补给边界测试在第3回合完成任务仍继续到第6回合。最后一回合先结算任务和到账再关闭，不允许第7次行动。', fixture: { config: fixture, complete, final } };
});
check('partial-buy-and-repeat-protection', 'No duplicate purchases or repeat rewards', '不能重复建设或刷任务结果', () => {
  const config = { ...structuredClone(revised), initialSupplies: 20 };
  const built = replay(config, ['build:beacon']);
  for (const id of ['build:beacon', 'build:bundle']) { const result = step(config, built, id); assert.equal(result.ok, false); assert.deepEqual(result.state, built); }
  const done = replay(config, ['build:beacon', 'signal']);
  const duplicate = step(config, done, 'signal'); assert.equal(duplicate.ok, false); assert.deepEqual(duplicate.state, done);
  return { description: 'A labeled high-supply boundary fixture cannot buy the same module, rebuy the whole bundle after a partial build, or repeat a completed mission.',
    descriptionZh: '标注的高补给边界测试不能重买已有模块、部分建设后再买整包，或重复执行已完成任务。', fixture: { config, built, done } };
});

const evidence = { schemaVersion: 1, caseId: 'signal-camp', kind: 'deterministic-engine-execution', ...versions,
  comparison: { horizon: baseline.turnLimit, initialSupplies: baseline.initialSupplies, incomePerTurn: baseline.incomePerTurn,
    grossIncome: baseline.turnLimit * baseline.incomePerTurn, totalAvailable: baseline.initialSupplies + baseline.turnLimit * baseline.incomePerTurn,
    baselineForcedWaitTurns: baseRun.summary.waitTurns, baselineFirstBuildTurn: baseRun.summary.firstBuildTurn,
    revisedFirstBuildTurn: signalRun.summary.firstBuildTurn, revisedWaitTurns: signalRun.summary.waitTurns,
    completedRouteSpending: baseRun.summary.spent, completedRouteBalance: baseRun.summary.balance }, checks, executions,
  limitations: [
    'The baseline is an original deliberately constrained comparison, not a measured defect in a released commercial game.',
    'People and route coverage are outcomes, not the supply resource. Only supply production is held constant.',
    'The original brief requests both versions; no later user feedback or human playtest is invented.',
    'All paths receive the same per-turn supplies; different uncompleted paths may spend different amounts or keep different balances.',
    'The modular witnesses still wait twice and require an extra construction action. Choosing the wrong first module permanently misses the selected goal.',
    'The retained bundle is dominated for these two goals. No claim is made that every available button is strategically competitive.',
    'Automated search and tests establish this model, not comprehension, fun, retention or general superiority.'
  ] };
const summaries = [['Original', baseRun], ['Beacon first', signalRun], ['Survey kit first', surveyRun]];
const markdown = `# Signal Camp — reproducible execution evidence\n\nGenerated by \`node scripts/camp-evidence.mjs --write\`. Check without changing files with \`--check\`. This is deterministic model execution, not a human playtest.\n\n## Complete-session comparison\n\nEvery row uses ${baseline.turnLimit} turns, ${baseline.initialSupplies} initial supplies and +${baseline.incomePerTurn} after each legal action. Evacuated people and marked routes are outcomes, not supply production.\n\n| Route | People | Routes | Gross income | Initial + income | Spent | Balance | Waiting turns |\n|---|---:|---:|---:|---:|---:|---:|---|\n${summaries.map(([name, run]) => `| ${name} | ${run.finalState.people} | ${run.finalState.routes} | ${run.finalState.grossIncome} | ${run.summary.totalAvailable} | ${run.finalState.spent} | ${run.finalState.supplies} | ${run.summary.waitTurns.join(', ')} |`).join('\n')}\n\nOriginal first construction is turn ${baseRun.summary.firstBuildTurn}; it is not a meaningful competing outcome choice. The revision exposes different consequences on turn ${signalRun.summary.firstBuildTurn}. Waiting remains on turns ${signalRun.summary.waitTurns.join(' and ')}; construction takes two actions instead of one.\n\n## Executed checks\n\n${checks.map((check) => `- **${check.status.toUpperCase()} — ${check.name} / ${check.nameZh}:** ${check.description}\n  ${check.descriptionZh}`).join('\n\n')}\n\n## Limits\n\n${evidence.limitations.map((line) => `- ${line}`).join('\n')}\n\n## 中文结论\n\n原版前三回合只能等，第4回合才能买整包；改版把原价6拆成各3的模块，第1回合可决定先做什么。两条完成路线分别为6人/1路线与2人/3路线，硬目标不同，首选也不同。两版每一回合到账完全一致，最终补给均为毛收入6、含初始总量9、花费8、余额1。收益来自更早开放用途，而非多发补给。改版仍有两回合等待，多占一次建设行动，首步错配无法追回早期目标；这些成本不能省略。\n`;
const json = JSON.stringify(evidence, null, 2) + '\n';
const mode = process.argv[2];
if (!['--write', '--check'].includes(mode) || process.argv.length !== 3) throw new Error('Usage: node scripts/camp-evidence.mjs --write|--check');
if (mode === '--write') {
  await mkdir(output, { recursive: true });
  await writeFile(new URL('evidence.json', output), json); await writeFile(new URL('evidence.md', output), markdown);
} else {
  for (const [filename, expected] of [['evidence.json', json], ['evidence.md', markdown]]) {
    if (await readFile(new URL(filename, output), 'utf8') !== expected) throw new Error(`${filename} is stale. Regenerate with --write.`);
  }
}
const failed = checks.filter((check) => check.status !== 'passed');
console.log(`Signal Camp: ${checks.length - failed.length}/${checks.length} checks passed; ${mode === '--write' ? 'evidence written' : 'evidence matches'}.`);
if (failed.length) { for (const check of failed) console.error(`${check.id}: ${check.description}`); process.exitCode = 1; }
