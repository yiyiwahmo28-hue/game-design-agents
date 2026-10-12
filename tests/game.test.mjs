import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Script, createContext } from 'node:vm';
import {
  validateConfig, createState, step, getAvailableActions, chooseAction,
  simulate, compareConfigs,
} from '../src/game.mjs';

const before = JSON.parse(await readFile(new URL('../examples/lantern-expedition/baseline.json', import.meta.url), 'utf8'));
const after = JSON.parse(await readFile(new URL('../examples/lantern-expedition/revised.json', import.meta.url), 'utf8'));
const clone = (value) => structuredClone(value);

test('shared engine creates a zero-resource state and rejects unaffordable actions without spending time', () => {
  const initial = createState(before);
  const snapshot = clone(initial);
  assert.deepEqual(getAvailableActions(before, initial), ['gather']);
  for (const action of ['upgrade', 'explore', 'teleport', 0.5, null]) {
    const result = step(before, initial, action);
    assert.equal(result.ok, false);
    assert.deepEqual(result.state, snapshot);
    assert.equal(result.event, null);
    assert.notEqual(result.state, initial);
  }
  assert.deepEqual(initial, snapshot);
});

test('manual gather and upgrade follow explicit prices, yields and action time', () => {
  let state = createState(before);
  for (let count = 0; count < 4; count += 1) state = step(before, state, 'gather').state;
  assert.equal(state.resources, 12);
  assert.equal(state.elapsedSeconds, 40);
  const preUpgrade = clone(state);
  const upgraded = step(before, state, 'upgrade');
  assert.equal(upgraded.ok, true);
  assert.equal(upgraded.state.level, 1);
  assert.equal(upgraded.state.resources, 0);
  assert.equal(upgraded.state.firstUpgradeSeconds, 48);
  assert.equal(upgraded.state.elapsedSeconds, 48);
  assert.equal(upgraded.event.cost, 12);
  assert.deepEqual(state, preUpgrade);
  const gathered = step(before, upgraded.state, 'gather');
  assert.equal(gathered.state.resources, 6);
  assert.equal(gathered.event.gained, 6);
  gathered.event.state.resources = 999;
  assert.equal(gathered.state.resources, 6);
});

test('all four declared runs conserve resources and stop exactly at the exploration goal', () => {
  for (const config of [before, after]) {
    for (const policy of ['upgrade-first', 'explore-first']) {
      const run = simulate(config, { policy });
      assert.equal(run.completed, true);
      assert.equal(run.stopReason, 'completed');
      assert.equal(run.events.length, run.turns);
      assert.equal(run.trajectory.length, run.turns + 1);
      let gathered = 0;
      let spent = 0;
      let time = 0;
      for (const [index, event] of run.events.entries()) {
        gathered += event.gained;
        spent += event.cost;
        time += event.seconds;
        assert.equal(event.state.resources, gathered - spent);
        assert.ok(event.state.resources >= 0);
        assert.equal(event.elapsedSeconds, time);
        assert.equal(event.turn, index + 1);
        assert.deepEqual(run.trajectory[index + 1], event.state);
      }
      assert.equal(run.finalState.explored, config.exploreGoal);
      assert.equal(run.completionSeconds, time);
      assert.deepEqual(getAvailableActions(config, run.finalState), []);
      const blocked = step(config, run.finalState, 'gather');
      assert.equal(blocked.ok, false);
      assert.equal(blocked.error.code, 'game-complete');
      assert.deepEqual(blocked.state, run.finalState);
    }
  }
});

test('price redistribution brings the first upgrade forward without gifts or changing total listed upgrade cost', () => {
  const comparison = compareConfigs(before, after);
  assert.equal(comparison.sameTotalUpgradeCost, true);
  assert.equal(comparison.beforeTotalUpgradeCost, 72);
  assert.equal(comparison.afterTotalUpgradeCost, 72);
  const upgradeFirst = comparison.policies.find((row) => row.policy === 'upgrade-first');
  assert.equal(upgradeFirst.before.firstUpgradeSeconds, 48);
  assert.equal(upgradeFirst.after.firstUpgradeSeconds, 28);
  assert.equal(upgradeFirst.before.completionSeconds, 300);
  assert.equal(upgradeFirst.after.completionSeconds, 290);
  assert.equal(upgradeFirst.firstUpgradeDeltaSeconds, -20);
  assert.equal(upgradeFirst.completionDeltaSeconds, -10);
  assert.equal(upgradeFirst.before.actualUpgradeCost, 72);
  assert.equal(upgradeFirst.after.actualUpgradeCost, 72);
  assert.equal(upgradeFirst.before.trajectory[0].resources, 0);
  assert.equal(upgradeFirst.after.trajectory[0].resources, 0);
});

test('explore-first has its own measured result and does not imply every player pays the full price list', () => {
  const comparison = compareConfigs(before, after);
  const exploreFirst = comparison.policies.find((row) => row.policy === 'explore-first');
  assert.equal(exploreFirst.before.firstUpgradeSeconds, null);
  assert.equal(exploreFirst.before.actualUpgradeCost, 0);
  assert.equal(exploreFirst.after.actualUpgradeCost, 6);
  assert.equal(exploreFirst.before.completionSeconds, 316);
  assert.equal(exploreFirst.after.completionSeconds, 234);
  assert.equal(exploreFirst.firstUpgradeDeltaSeconds, null);
  assert.equal(exploreFirst.completionDeltaSeconds, -82);
});

test('config schema rejects unsafe, missing, fractional and unsupported inputs', () => {
  assert.equal(validateConfig(before), true);
  assert.equal(validateConfig(after), true);
  const badInputs = [null, [], {}, { ...before, schemaVersion: 2 }, { ...before, baseYield: 0 },
    { ...before, baseYield: NaN }, { ...before, yieldPerLevel: Infinity },
    { ...before, exploreCost: 1.5 }, { ...before, exploreGoal: -1 },
    { ...before, upgradeCosts: [] }, { ...before, upgradeCosts: [12, 0, 36] },
    { ...before, upgradeCosts: [12, 2.5] }, { ...before, upgradeCosts: Array(2) },
    { ...before, upgradeCosts: Array(21).fill(1) },
    { ...before, baseYield: 1_001 }, { ...before, actionSeconds: { gather: 10, upgrade: 8 } },
    { ...before, actionSeconds: { ...before.actionSeconds, explore: 0 } },
    { ...before, actionSeconds: { ...before.actionSeconds, teleport: 1 } },
    { ...before, initialGift: 6 }];
  for (const input of badInputs) assert.throws(() => validateConfig(input));
});

test('invalid state is rejected rather than converted into apparent progress', () => {
  const initial = createState(before);
  const badStates = [null, {}, { ...initial, resources: -1 }, { ...initial, resources: NaN },
    { ...initial, resources: 1 }, { ...initial, turns: 0.5 }, { ...initial, completed: true },
    { ...initial, explored: 1 }, { ...initial, elapsedSeconds: 1 },
    { ...initial, firstUpgradeSeconds: 0 }, { ...initial, level: 4 },
    { ...initial, configId: after.id }];
  for (const state of badStates) assert.throws(() => step(before, state, 'gather'));
});

test('a huge unaffordable progression stops at its turn budget with null completion instead of hanging', () => {
  const expensive = { ...clone(before), upgradeCosts: [1_000_000], baseYield: 1, yieldPerLevel: 0 };
  const run = simulate(expensive, { policy: 'upgrade-first', maxTurns: 5 });
  assert.equal(run.completed, false);
  assert.equal(run.stopReason, 'max-turns');
  assert.equal(run.turns, 5);
  assert.equal(run.completionSeconds, null);
  assert.equal(run.firstUpgradeSeconds, null);
  assert.equal(run.finalState.resources, 5);
  assert.throws(() => simulate(before, { maxTurns: 0 }));
  assert.throws(() => simulate(before, { maxTurns: null }));
  assert.throws(() => simulate(before, { maxTurns: 2.5 }));
  assert.throws(() => simulate(before, { policy: null }));
  assert.throws(() => simulate(before, { policy: 'invented-player' }));
  assert.throws(() => chooseAction(before, createState(before), 'invented-player'));
});

test('manual autoplay follows the same selector and transitions as the shared simulation', () => {
  for (const policy of ['upgrade-first', 'explore-first']) {
    let state = createState(after);
    while (!state.completed) {
      const action = chooseAction(after, state, policy);
      assert.ok(getAvailableActions(after, state).includes(action));
      const previous = clone(state);
      const result = step(after, state, action);
      assert.equal(result.ok, true);
      assert.deepEqual(state, previous);
      state = result.state;
    }
    assert.deepEqual(state, simulate(after, { policy }).finalState);
    assert.equal(chooseAction(after, state, policy), null);
  }
});

test('comparison responds to actual inputs and never reuses a claimed outcome', () => {
  const same = compareConfigs(before, clone(before));
  for (const row of same.policies) {
    assert.equal(row.completionDeltaSeconds, 0);
    assert.equal(row.firstUpgradeDeltaSeconds, row.before.firstUpgradeSeconds === null ? null : 0);
  }
  const changed = { ...clone(after), upgradeCosts: [7, 27, 39], exploreGoal: 9 };
  const result = compareConfigs(before, changed);
  assert.equal(result.sameTotalUpgradeCost, false);
  assert.equal(result.afterTotalUpgradeCost, 73);
  for (const row of result.policies) {
    assert.equal(row.after.finalState.explored, 9);
    assert.notEqual(row.after.completionSeconds, compareConfigs(before, after).policies.find((old) => old.policy === row.policy).after.completionSeconds);
  }
  assert.deepEqual(compareConfigs(before, after), compareConfigs(before, after));
});

test('max-level upgrade is rejected without spending another price or turn', () => {
  const run = simulate(before, { policy: 'upgrade-first' });
  const fullLevel = run.trajectory.find((state) => state.level === before.upgradeCosts.length && !state.completed);
  const rejected = step(before, fullLevel, 'upgrade');
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error.code, 'max-level');
  assert.deepEqual(rejected.state, fullLevel);
});

test('the shared engine executes in an ECMAScript context with no Node globals or native imports', async () => {
  const source = await readFile(new URL('../src/game.mjs', import.meta.url), 'utf8');
  const context = createContext({});
  assert.equal(new Script('typeof process').runInContext(context), 'undefined');
  assert.equal(new Script('typeof require').runInContext(context), 'undefined');
  const script = new Script(`${source.replace(/^export /gm, '')}\nJSON.stringify(compareConfigs(${JSON.stringify(before)}, ${JSON.stringify(after)}));`);
  const computed = JSON.parse(script.runInContext(context));
  assert.deepEqual(computed, compareConfigs(before, after));
});
