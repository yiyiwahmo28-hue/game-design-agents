import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { analyze, chooseAction, createState, evaluateGoal, getActions, simulate, step, validateConfig } from '../src/camp.mjs';

const baseBytes = await readFile(new URL('../examples/signal-camp/baseline.json', import.meta.url));
const baseline = JSON.parse(baseBytes);
const revised = JSON.parse(await readFile(new URL('../examples/signal-camp/revised.json', import.meta.url), 'utf8'));
const observation = JSON.parse(await readFile(new URL('../docs/runs/signal-camp/baseline-observation.json', import.meta.url), 'utf8'));
const clone = (value) => structuredClone(value);
function replay(config, actions) {
  let state = createState(config);
  for (const action of actions) {
    const result = step(config, state, action);
    assert.equal(result.ok, true, `Expected ${action} to be legal`);
    state = result.state;
  }
  return state;
}
function economics(config) {
  const { id, title, titleZh, mode, ...rules } = config;
  return rules;
}

test('baseline fingerprint and every economic, deadline and goal parameter are preserved', () => {
  assert.equal(createHash('sha256').update(baseBytes).digest('hex'), observation.baselineConfigSha256);
  assert.deepEqual(economics(baseline), economics(revised));
  assert.equal(baseline.mode, 'bundled');
  assert.equal(revised.mode, 'modular');
});

test('baseline has exactly three forced waits, then one construction opportunity', () => {
  let state = createState(baseline);
  for (let turn = 0; turn < 3; turn++) {
    assert.deepEqual(getActions(baseline, state).filter((action) => action.available).map((action) => action.id), ['wait']);
    state = step(baseline, state, 'wait').state;
  }
  const bundle = getActions(baseline, state).find((action) => action.id === 'build:bundle');
  assert.equal(bundle.available, true);
  assert.equal(bundle.preview.turn, 4);
  assert.equal(bundle.cost, 6);
  assert.deepEqual(step(baseline, state, bundle.id).state.modules, ['beacon', 'survey-kit']);
});

test('the revised first turn offers two consequential modules and voluntary waiting', () => {
  const actions = getActions(revised, createState(revised));
  assert.deepEqual(actions.filter((action) => action.available).map((action) => action.id), ['build:beacon', 'build:survey-kit', 'wait']);
  const build = actions.find((action) => action.id === 'build:beacon');
  assert.equal(build.cost, 3);
  assert.equal(build.preview.supplies, 1);
  assert.equal(build.preview.turn, 1);
  assert.equal(actions.find((action) => action.id === 'signal').reasonCode, 'module-required');
  assert.equal(actions.find((action) => action.id === 'build:bundle').reasonCode, 'insufficient-supplies');
});

test('spending happens before income: this turn delivery cannot finance this turn purchase', () => {
  const state = replay(baseline, ['wait', 'wait']);
  assert.equal(state.supplies, 5);
  const denied = step(baseline, state, 'build:bundle');
  assert.equal(denied.ok, false);
  assert.equal(denied.error.code, 'insufficient-supplies');
  assert.deepEqual(denied.state, state);
  const waited = step(baseline, state, 'wait').state;
  assert.equal(waited.supplies, 6);
  assert.equal(step(baseline, waited, 'build:bundle').ok, true);
});

test('turn 2 is inside each mission window and turn 3 is outside it', () => {
  for (const [moduleId, missionId, metric, early, late] of [['beacon', 'signal', 'people', 6, 2], ['survey-kit', 'survey', 'routes', 3, 1]]) {
    const ready = replay(revised, [`build:${moduleId}`]);
    const preview = getActions(revised, ready).find((action) => action.id === missionId);
    assert.equal(preview.preview.turn, 2);
    assert.equal(preview.preview.early, true);
    assert.equal(preview.preview.missionValue, early);
    const onTime = step(revised, ready, missionId);
    assert.equal(onTime.state[metric], early);
    assert.equal(onTime.state.missions[0].turn, 2);
    const lateState = replay(revised, [`build:${moduleId}`, 'wait']);
    const latePreview = getActions(revised, lateState).find((action) => action.id === missionId);
    assert.equal(latePreview.preview.turn, 3);
    assert.equal(latePreview.preview.early, false);
    assert.equal(step(revised, lateState, missionId).state[metric], late);
  }
});

test('missions pay once, consume supplies and never create bonus supply income', () => {
  const state = replay(revised, ['build:beacon', 'signal']);
  assert.equal(state.supplies, 1);
  assert.equal(state.grossIncome, 2);
  assert.equal(state.spent, 4);
  const denied = step(revised, state, 'signal');
  assert.equal(denied.error.code, 'mission-complete');
  assert.deepEqual(denied.state, state);
});

test('partial modular construction cannot double-buy a module or the original bundle', () => {
  const config = { ...clone(revised), initialSupplies: 20 };
  const partial = replay(config, ['build:beacon']);
  for (const action of ['build:beacon', 'build:bundle']) {
    const result = step(config, partial, action);
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'module-already-built');
    assert.deepEqual(result.state, partial);
  }
  const complete = replay(config, ['build:beacon', 'build:survey-kit']);
  assert.deepEqual(complete.modules, ['beacon', 'survey-kit']);
  const bundled = replay(config, ['build:bundle']);
  assert.deepEqual(bundled.modules, complete.modules);
  assert.equal(bundled.spent, complete.spent);
  assert.equal(bundled.turn + 1, complete.turn);
});

test('completion does not stop income: all sessions run the fixed horizon', () => {
  const config = { ...clone(revised), initialSupplies: 20 };
  const completed = replay(config, ['build:bundle', 'signal', 'survey']);
  assert.equal(completed.missions.length, 2);
  assert.equal(completed.ended, false);
  const final = replay(config, ['build:bundle', 'signal', 'survey', 'wait', 'wait', 'wait']);
  assert.equal(final.turn, config.turnLimit);
  assert.equal(final.grossIncome, config.turnLimit * config.incomePerTurn);
  assert.equal(final.ended, true);
});

test('the final action resolves and receives its delivery before closure', () => {
  const before = replay(revised, ['build:beacon', 'signal', 'wait', 'wait', 'build:survey-kit']);
  const final = step(revised, before, 'survey');
  assert.equal(final.state.turn, 6);
  assert.equal(final.state.routes, 1);
  assert.equal(final.state.grossIncome, 6);
  assert.equal(final.state.spent, 8);
  assert.equal(final.state.supplies, 1);
  assert.equal(final.state.ended, true);
  for (const action of getActions(revised, final.state)) {
    assert.equal(action.available, false);
    assert.equal(action.reasonCode, 'camp-closed');
    assert.deepEqual(step(revised, final.state, action.id).state, final.state);
  }
  assert.equal(chooseAction(revised, final.state), null);
});

test('unknown and unavailable actions preserve all fields without aliasing inputs', () => {
  const state = createState(revised);
  const saved = clone(state);
  for (const id of [null, 3, {}, 'missing', 'signal', 'build:bundle']) {
    const result = step(revised, state, id);
    assert.equal(result.ok, false);
    assert.equal(result.event, null);
    assert.deepEqual(result.state, saved);
    assert.notEqual(result.state, state);
    assert.notEqual(result.state.actions, state.actions);
    result.state.modules.push('bad');
  }
  assert.deepEqual(state, saved);
  const accepted = step(revised, state, 'build:beacon');
  accepted.event.state.modules.push('bad');
  assert.deepEqual(accepted.state.modules, ['beacon']);
  assert.deepEqual(state, saved);
});

test('the two completed modular routes preserve every per-turn income and final ledger', () => {
  const baseRun = simulate(baseline, { policy: 'signal-first' });
  for (const policy of ['signal-first', 'survey-first']) {
    const run = simulate(revised, { policy });
    assert.deepEqual(run.trajectory.map((state) => state.grossIncome), baseRun.trajectory.map((state) => state.grossIncome));
    assert.deepEqual(run.trajectory.map((state) => state.grossIncome), [0, 1, 2, 3, 4, 5, 6]);
    assert.equal(run.finalState.spent, 8);
    assert.equal(run.finalState.supplies, 1);
    assert.deepEqual(run.summary.waitTurns, [3, 4]);
    assert.equal(run.trace.filter((event) => event.action.startsWith('build:')).length, 2);
    assert.deepEqual(replay(revised, run.trace.map((event) => event.action)), run.finalState);
    assert.deepEqual(simulate(revised, { policy }), run);
    for (const state of run.trajectory) assert.equal(state.supplies, revised.initialSupplies + state.grossIncome - state.spent);
  }
  assert.equal(baseRun.trace.filter((event) => event.action.startsWith('build:')).length, 1);
});

test('the preferred first module reverses with the hard scenario goal', () => {
  const signal = simulate(revised, { policy: 'signal-first' }).finalState;
  const survey = simulate(revised, { policy: 'survey-first' }).finalState;
  assert.deepEqual([signal.people, signal.routes], [6, 1]);
  assert.deepEqual([survey.people, survey.routes], [2, 3]);
  assert.equal(evaluateGoal(revised, signal, 'rescue-priority').met, true);
  assert.equal(evaluateGoal(revised, survey, 'rescue-priority').met, false);
  assert.equal(evaluateGoal(revised, survey, 'route-priority').met, true);
  assert.equal(evaluateGoal(revised, signal, 'route-priority').met, false);
  assert.deepEqual(evaluateGoal(revised, signal, 'route-priority').missing, { people: 0, routes: 2 });
  assert.throws(() => evaluateGoal(revised, signal, 'invented'));
});

test('exhaustive futures confirm two non-dominated outcomes and no route satisfying both goals', () => {
  const base = analyze(baseline); const current = analyze(revised);
  assert.deepEqual(base.paretoFrontier.map(({ people, routes }) => [people, routes]), [[2, 1]]);
  assert.deepEqual(current.paretoFrontier.map(({ people, routes }) => [people, routes]), [[6, 1], [2, 3]]);
  assert.equal(current.terminalOutcomes.some((outcome) => outcome.people >= 6 && outcome.routes >= 3), false);
  for (const first of current.firstActions) {
    assert.equal(first.goals.find((goal) => goal.id === 'rescue-priority').achievable, first.id === 'build:beacon');
    assert.equal(first.goals.find((goal) => goal.id === 'route-priority').achievable, first.id === 'build:survey-kit');
  }
  for (const outcome of current.terminalOutcomes) {
    const state = replay(revised, outcome.witness);
    assert.equal(state.people, outcome.people);
    assert.equal(state.routes, outcome.routes);
    assert.equal(state.ended, true);
  }
});

test('every reachable transition matches its preview and fixed-income conservation', () => {
  for (const config of [baseline, revised]) {
    const seen = new Set();
    function visit(state) {
      const signature = JSON.stringify([state.turn, state.supplies, state.modules, state.people, state.routes]);
      if (seen.has(signature)) return; seen.add(signature);
      for (const action of getActions(config, state)) {
        const result = step(config, state, action.id);
        assert.equal(result.ok, action.available);
        if (!result.ok) { assert.deepEqual(result.state, state); continue; }
        assert.equal(result.state.turn, action.preview.turn);
        assert.equal(result.state.supplies, action.preview.supplies);
        assert.equal(result.state.people, action.preview.people);
        assert.equal(result.state.routes, action.preview.routes);
        assert.equal(result.state.grossIncome, result.state.turn * config.incomePerTurn);
        assert.equal(result.state.supplies, config.initialSupplies + result.state.grossIncome - result.state.spent);
        assert.ok(result.state.supplies >= 0);
        visit(result.state);
      }
    }
    visit(createState(config));
    assert.ok(seen.size > 10);
  }
});

test('forged state, mismatched config and unsupported configuration are rejected', () => {
  const actual = replay(revised, ['build:beacon', 'signal']);
  for (const mutate of [(s) => { s.grossIncome++; }, (s) => { s.people++; }, (s) => { s.spent--; },
    (s) => { s.ended = true; }, (s) => { s.missions[0].turn = 3; }, (s) => { s.actions[0] = 'signal'; },
    (s) => { s.unexpected = 1; }]) {
    const forged = clone(actual); mutate(forged);
    assert.throws(() => step(revised, forged, 'wait'));
  }
  assert.throws(() => getActions(baseline, actual));
  for (const mutate of [(c) => { c.turnLimit = 9; }, (c) => { c.incomePerTurn = 0.5; }, (c) => { c.bundleCost = 5; },
    (c) => { c.missions.signal.earlyThroughTurn = 7; }, (c) => { c.mode = 'unknown'; },
    (c) => { c.goals[1].id = c.goals[0].id; }, (c) => { c.bonusIncome = 1; }]) {
    const invalid = clone(revised); mutate(invalid); assert.throws(() => validateConfig(invalid));
  }
  assert.throws(() => simulate(revised, { policy: 'optimal-ish' }));
});
