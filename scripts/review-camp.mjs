#!/usr/bin/env node
// Independent contract oracle for the published Signal Camp case.
// Its rule model was executed before inspecting the engine implementation.
// This checks this case's frozen numbers, not a general-purpose game standard.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createState, getActions, step, evaluateGoal, simulate, analyze } from '../src/camp.mjs';

const root = new URL('../', import.meta.url);
const bytes = await readFile(new URL('examples/signal-camp/baseline.json', root));
const baseline = JSON.parse(bytes);
const revised = JSON.parse(await readFile(new URL('examples/signal-camp/revised.json', root), 'utf8'));
const earlier = JSON.parse(await readFile(new URL('docs/runs/signal-camp/baseline-observation.json', root), 'utf8'));
const sha256 = value => createHash('sha256').update(value).digest('hex');
const actions = ['wait', 'build:bundle', 'build:beacon', 'build:survey-kit', 'signal', 'survey'];
const goals = {
  'rescue-priority': { people: 6, routes: 1 },
  'route-priority': { people: 2, routes: 3 }
};
const initial = () => ({ turn: 0, supplies: 3, produced: 0, spent: 0, beacon: false,
  surveyKit: false, signalDone: false, surveyDone: false, people: 0, routes: 0 });

// Deliberately separate representation and fixed contract values. No runtime
// transition, action preview, policy, or solver is used to decide expectations.
function transition(state, action, mode) {
  if (state.turn >= 6) return null;
  const next = structuredClone(state);
  let cost = 0;
  if (action === 'wait') {}
  else if (action === 'build:bundle') {
    if (state.beacon || state.surveyKit) return null;
    cost = 6; next.beacon = true; next.surveyKit = true;
  } else if (action === 'build:beacon') {
    if (mode === 'bundled' || state.beacon) return null;
    cost = 3; next.beacon = true;
  } else if (action === 'build:survey-kit') {
    if (mode === 'bundled' || state.surveyKit) return null;
    cost = 3; next.surveyKit = true;
  } else if (action === 'signal') {
    if (!state.beacon || state.signalDone) return null;
    cost = 1; next.signalDone = true; next.people = state.turn + 1 <= 2 ? 6 : 2;
  } else if (action === 'survey') {
    if (!state.surveyKit || state.surveyDone) return null;
    cost = 1; next.surveyDone = true; next.routes = state.turn + 1 <= 2 ? 3 : 1;
  } else return null;
  if (state.supplies < cost) return null;
  next.turn++;
  next.supplies += 1 - cost;
  next.produced++;
  next.spent += cost;
  return next;
}
function expectedState(state, path, configId) {
  const modules = [state.beacon && 'beacon', state.surveyKit && 'survey-kit'].filter(Boolean);
  const missions = path.flatMap((id, index) => ['signal', 'survey'].includes(id) ? [{
    id, turn: index + 1, value: id === 'signal' ? state.people : state.routes, early: index + 1 <= 2
  }] : []);
  return { configId, turn: state.turn, supplies: state.supplies, grossIncome: state.produced,
    spent: state.spent, modules, missions, people: state.people, routes: state.routes,
    ended: state.turn === 6, actions: path };
}
const point = state => [state.people, state.routes];
const comparePoint = (a, b) => b[0] - a[0] || b[1] - a[1];
function distinctPoints(items) {
  return [...new Map(items.map(item => [JSON.stringify(point(item)), point(item)])).values()].sort(comparePoint);
}
function pareto(items) {
  const points = distinctPoints(items);
  return points.filter(item => !points.some(other => other[0] >= item[0] && other[1] >= item[1] &&
    (other[0] > item[0] || other[1] > item[1])));
}
const meets = (state, goal) => state.people >= goal.people && state.routes >= goal.routes;

assert.equal(sha256(bytes), earlier.baselineConfigSha256, 'Original configuration bytes changed');
for (const config of [baseline, revised]) {
  assert.equal(config.turnLimit, 6);
  assert.equal(config.initialSupplies, 3);
  assert.equal(config.incomePerTurn, 1);
  assert.equal(config.bundleCost, 6);
  assert.deepEqual(config.moduleCosts, { beacon: 3, 'survey-kit': 3 });
  for (const id of ['signal', 'survey']) {
    const mission = config.missions[id];
    assert.equal(mission.cost, 1);
    assert.equal(mission.earlyThroughTurn, 2);
    assert.equal(mission.earlyValue, id === 'signal' ? 6 : 3);
    assert.equal(mission.lateValue, id === 'signal' ? 2 : 1);
  }
  assert.deepEqual(Object.fromEntries(config.goals.map(goal => [goal.id, goal.requirements])), goals);
}
assert.equal(baseline.mode, 'bundled');
assert.equal(revised.mode, 'modular');
for (const key of Object.keys(baseline).filter(key => !['id', 'title', 'titleZh', 'mode'].includes(key))) {
  assert.deepEqual(baseline[key], revised[key], `Preserved contract changed: ${key}`);
}

function audit(config) {
  const queue = [{ state: initial(), path: [], actual: createState(config) }];
  const terminals = [];
  const canonical = new Set();
  let legal = 0, refused = 0, previewsChecked = 0, earlyMissions = 0, lateMissions = 0;
  // No history deduplication: exercise every legal action prefix through turn 6.
  for (let index = 0; index < queue.length; index++) {
    const { state, path, actual } = queue[index];
    canonical.add(JSON.stringify(state));
    assert.deepEqual(actual, expectedState(state, path, config.id));
    assert.equal(state.produced, state.turn, 'Income was front-loaded or action-dependent');
    assert.equal(3 + state.produced, state.spent + state.supplies, 'Ledger does not conserve supplies');
    if (state.turn === 6) {
      assert.equal(state.produced, 6);
      assert.ok(!(state.people === 6 && state.routes === 3), 'Both early windows became reachable');
      terminals.push({ ...state, path });
    }
    for (const [id, requirements] of Object.entries(goals)) {
      assert.deepEqual(evaluateGoal(config, actual, id), { id, met: meets(state, requirements),
        requirements, missing: { people: Math.max(0, requirements.people - state.people),
          routes: Math.max(0, requirements.routes - state.routes) } });
    }
    const original = structuredClone(actual);
    const previews = getActions(config, actual);
    assert.deepEqual(previews.map(item => item.id).sort(), [...actions].sort());
    for (const action of [...actions, 'unknown']) {
      const expected = transition(state, action, config.mode);
      const result = step(config, actual, action);
      assert.deepEqual(actual, original, 'Transition mutated its input');
      assert.equal(result.ok, expected !== null, `${config.id} ${path.join(',')} -> ${action}`);
      if (action !== 'unknown') {
        const preview = previews.find(item => item.id === action);
        assert.equal(preview.available, expected !== null);
        if (expected) {
          assert.equal(preview.income, 1);
          assert.equal(preview.turnCost, 1);
          assert.equal(preview.cost, expected.spent - state.spent);
          assert.equal(preview.preview.turn, expected.turn);
          assert.equal(preview.preview.supplies, expected.supplies);
          assert.equal(preview.preview.people, expected.people);
          assert.equal(preview.preview.routes, expected.routes);
          previewsChecked++;
        } else assert.ok(preview.reason && preview.reasonZh && preview.reasonCode);
      }
      if (expected) {
        const nextPath = [...path, action];
        assert.deepEqual(result.state, expectedState(expected, nextPath, config.id));
        const mission = ['signal', 'survey'].includes(action);
        const value = mission ? action === 'signal' ? expected.people : expected.routes : 0;
        assert.deepEqual(result.event, { action, turn: expected.turn, cost: expected.spent - state.spent,
          income: 1, missionValue: value, metric: mission ? action === 'signal' ? 'people' : 'routes' : null,
          early: mission ? expected.turn <= 2 : null, state: expectedState(expected, nextPath, config.id) });
        if (mission) expected.turn <= 2 ? earlyMissions++ : lateMissions++;
        queue.push({ state: expected, path: nextPath, actual: result.state });
        legal++;
      } else {
        assert.deepEqual(result.state, original, 'Rejected action changed a ledger or history');
        assert.equal(result.event, null);
        assert.ok(result.error.code && result.error.message && result.error.messageZh);
        refused++;
      }
    }
  }
  const computed = analyze(config);
  assert.deepEqual(computed.terminalOutcomes.map(point).sort(comparePoint), distinctPoints(terminals));
  assert.deepEqual(computed.paretoFrontier.map(point).sort(comparePoint), pareto(terminals));
  const firstActions = actions.filter(action => transition(initial(), action, config.mode));
  assert.deepEqual(computed.firstActions.map(item => item.id).sort(), [...firstActions].sort());
  const byFirstAction = {};
  for (const action of firstActions) {
    const final = terminals.filter(item => item.path[0] === action);
    const result = computed.firstActions.find(item => item.id === action);
    assert.deepEqual(result.paretoFrontier.map(point).sort(comparePoint), pareto(final));
    byFirstAction[action] = Object.fromEntries(Object.entries(goals).map(([id, goal]) => {
      const reachable = final.some(state => meets(state, goal));
      assert.equal(result.goals.find(item => item.id === id).achievable, reachable);
      return [id, reachable];
    }));
  }
  for (const { witness } of [...computed.terminalOutcomes, ...computed.paretoFrontier]) {
    let state = initial();
    for (const action of witness) {
      state = transition(state, action, config.mode);
      assert.ok(state, 'Solver witness contains an illegal action');
    }
    assert.equal(state.turn, 6);
  }
  const policyResults = ['signal-first', 'survey-first', 'bundle-first'].map(policy => {
    const result = simulate(config, { policy });
    let state = initial();
    for (const [index, event] of result.trace.entries()) {
      state = transition(state, event.action, config.mode);
      assert.ok(state);
      assert.deepEqual(result.trajectory[index + 1], expectedState(state, result.trace.slice(0, index + 1).map(item => item.action), config.id));
    }
    assert.equal(result.summary.grossIncome, 6);
    assert.equal(result.summary.totalAvailable, 9);
    assert.equal(result.summary.spent, 8);
    assert.equal(result.summary.balance, 1);
    assert.deepEqual(result.finalState, expectedState(state, result.trace.map(item => item.action), config.id));
    return { policy, people: state.people, routes: state.routes, grossIncome: state.produced,
      spent: state.spent, balance: state.supplies, path: result.trace.map(item => item.action) };
  });
  return { legalHistoryPrefixes: queue.length, canonicalEconomicStates: canonical.size,
    legalTransitions: legal, rejectedTransitions: refused, checkedAvailablePreviews: previewsChecked,
    terminalHistories: terminals.length, earlyMissionTransitions: earlyMissions, lateMissionTransitions: lateMissions,
    allTerminalGrossIncome: 6, paretoFrontier: pareto(terminals), byFirstAction, policies: policyResults };
}

const original = audit(baseline);
const changed = audit(revised);
assert.deepEqual(original.paretoFrontier, [[2, 1]]);
assert.deepEqual(changed.paretoFrontier, [[6, 1], [2, 3]]);
assert.deepEqual(changed.byFirstAction['build:beacon'], { 'rescue-priority': true, 'route-priority': false });
assert.deepEqual(changed.byFirstAction['build:survey-kit'], { 'rescue-priority': false, 'route-priority': true });
assert.deepEqual(changed.byFirstAction.wait, { 'rescue-priority': false, 'route-priority': false });
console.log(JSON.stringify({ environment: process.version,
  baselineConfigSha256: sha256(bytes), engineSha256: sha256(await readFile(new URL('src/camp.mjs', root))),
  scope: 'All legal prefixes for the frozen six-turn case, including rejected actions at terminal states; model evidence, not a human playtest.',
  baseline: original, revised: changed }, null, 2));
