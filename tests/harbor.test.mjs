import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Script, createContext } from 'node:vm';
import { createHash } from 'node:crypto';
import { validateConfig, createState, getActions, step, chooseAction, simulate, analyze } from '../src/harbor.mjs';

const config = JSON.parse(await readFile(new URL('../examples/rain-harbor/baseline.json', import.meta.url), 'utf8'));
const revised = JSON.parse(await readFile(new URL('../examples/rain-harbor/revised.json', import.meta.url), 'utf8'));
const clone = (value) => structuredClone(value);

function bruteForce(state, preparationAllowed = true) {
  if (state.ended) return state.rescuedPeople;
  return Math.max(...getActions(config, state).filter((action) => action.available && (preparationAllowed || action.type !== 'prepare'))
    .map((action) => bruteForce(step(config, state, action.id).state, preparationAllowed)));
}

function replay(actions) {
  let state = createState(config);
  for (const action of actions) {
    const result = step(config, state, action);
    assert.equal(result.ok, true, `Unavailable witness action: ${action}`);
    state = result.state;
  }
  return state;
}

test('initial previews show the true cost, outcome and refusal reason', () => {
  const state = createState(config);
  assert.equal(state.fuel, 4);
  assert.equal(state.turn, 0);
  const actions = getActions(config, state);
  assert.equal(actions.find((action) => action.id === 'prepare').nextRefuelAmount, 5);
  assert.equal(actions.find((action) => action.id === 'rescue:skiff').people, 4);
  const ferry = actions.find((action) => action.id === 'rescue:ferry');
  assert.equal(ferry.cost, 8);
  assert.equal(ferry.available, false);
  assert.equal(ferry.reasonCode, 'insufficient-fuel');
  assert.match(ferry.reason, /8.*4/);
  for (const action of actions) assert.equal(step(config, state, action.id).ok, action.available);
});

test('unaffordable and unknown actions leave every field and input array unchanged', () => {
  const state = createState(config);
  const original = clone(state);
  for (const action of ['rescue:ferry', 'rescue:missing', 'fly', null, 1.5, NaN]) {
    const result = step(config, state, action);
    assert.equal(result.ok, false);
    assert.equal(result.event, null);
    assert.deepEqual(result.state, original);
    assert.notEqual(result.state, state);
    assert.notEqual(result.state.rescuedIds, state.rescuedIds);
  }
  assert.deepEqual(state, original);
});

test('preparation spends one turn and fuel, affects later refueling, and cannot repeat', () => {
  const original = createState(config);
  const prepared = step(config, original, 'prepare');
  assert.equal(prepared.state.fuel, 2);
  assert.equal(prepared.state.turn, 1);
  assert.equal(prepared.state.prepared, true);
  assert.deepEqual(original, createState(config));
  assert.equal(getActions(config, prepared.state).find((action) => action.id === 'refuel').gain, 5);
  const refused = step(config, prepared.state, 'prepare');
  assert.equal(refused.error.code, 'already-prepared');
  assert.deepEqual(refused.state, prepared.state);
  const refueled = step(config, prepared.state, 'refuel');
  assert.equal(refueled.state.fuel, 7);
  assert.equal(refueled.state.turn, 2);
});

test('rescue pays once and its event snapshot does not alias the returned state', () => {
  const rescued = step(config, createState(config), 'rescue:skiff');
  assert.equal(rescued.state.rescuedPeople, 4);
  assert.equal(rescued.state.fuel, 0);
  assert.equal(rescued.state.turn, 1);
  const refused = step(config, rescued.state, 'rescue:skiff');
  assert.equal(refused.error.code, 'already-rescued');
  assert.deepEqual(refused.state, rescued.state);
  rescued.event.state.rescuedIds.push('ferry');
  assert.deepEqual(rescued.state.rescuedIds, ['skiff']);
});

test('the seventh action resolves before closure and no eighth action can run', () => {
  const run = simulate(config, { policy: 'prepare-first' });
  const beforeLast = run.trajectory[6];
  assert.equal(beforeLast.rescuedPeople, 16);
  const last = step(config, beforeLast, 'rescue:dinghy');
  assert.equal(last.state.turn, 7);
  assert.equal(last.state.rescuedPeople, 18);
  assert.equal(last.state.ended, true);
  assert.equal(last.state.endReason, 'storm');
  const denied = step(config, last.state, 'refuel');
  assert.equal(denied.error.code, 'harbor-closed');
  assert.deepEqual(denied.state, last.state);
});

test('rescuing all boats early ends immediately', () => {
  const oneBoat = { ...clone(config), boats: [clone(config.boats[0])] };
  const result = step(oneBoat, createState(oneBoat), 'rescue:dinghy');
  assert.equal(result.state.endReason, 'all-rescued');
  assert.equal(result.state.turn, 1);
  assert.equal(step(oneBoat, result.state, 'prepare').ok, false);
  assert.equal(chooseAction(oneBoat, result.state, 'optimal'), null);
});

test('three named policies replay the shared rules with exact fuel and passenger accounting', () => {
  for (const policy of ['rescue-first', 'prepare-first', 'optimal']) {
    const run = simulate(config, { policy });
    let gained = 0;
    let spent = 0;
    let people = 0;
    assert.equal(run.trace.length + 1, run.trajectory.length);
    for (const [index, event] of run.trace.entries()) {
      gained += event.gain;
      spent += event.cost;
      people += event.people;
      assert.equal(event.state.fuel, config.initialFuel + gained - spent);
      assert.ok(event.state.fuel >= 0);
      assert.equal(event.state.turn, index + 1);
      assert.equal(event.state.rescuedPeople, people);
      assert.deepEqual(event.state, run.trajectory[index + 1]);
    }
    assert.equal(run.rescuedPeople, people);
    assert.equal(run.ended, true);
    assert.deepEqual(replay(run.trace.map((event) => event.action)), run.finalState);
    assert.deepEqual(simulate(config, { policy }), run);
  }
  assert.equal(simulate(config, { policy: 'rescue-first' }).rescuedPeople, 12);
  assert.equal(simulate(config, { policy: 'prepare-first' }).rescuedPeople, 18);
});

test('memoized optimum matches an independent enumeration, including a no-preparation restriction', () => {
  const result = analyze(config);
  assert.equal(result.optimalRescuedPeople, bruteForce(createState(config)));
  assert.equal(result.optimalWithoutPreparation, bruteForce(createState(config), false));
  assert.equal(result.optimalRescuedPeople, 18);
  assert.equal(result.optimalWithoutPreparation, 16);
  assert.equal(result.optimalWitness.finalState.rescuedPeople, 18);
  assert.equal(result.optimalWithoutPreparationWitness.finalState.rescuedPeople, 16);
  assert.equal(result.optimalWithoutPreparationWitness.trace.some((event) => event.action === 'prepare'), false);
  for (const first of result.firstActions) {
    assert.equal(first.witness[0].action, first.action);
    assert.equal(replay(first.witness.map((event) => event.action)).rescuedPeople, first.bestFinalPeople);
  }
  assert.equal(result.firstActions.find((first) => first.action === 'prepare').bestFinalPeople, 18);
  assert.equal(result.firstActions.find((first) => first.action === 'rescue:skiff').bestFinalPeople, 16);
});

test('the late-preparation counterexample is reachable and neither action dominates in every state', () => {
  const result = analyze(config);
  const late = result.latePreparationCounterexample;
  assert.ok(late);
  assert.deepEqual(replay(late.prefixActions), late.state);
  assert.equal(late.state.turn, 6);
  assert.equal(late.prepare.state.rescuedPeople, 6);
  assert.equal(late.rescue.state.rescuedPeople, 12);
  assert.equal(late.prepare.state.ended, true);
  assert.equal(late.rescue.state.ended, true);
});

test('invalid config, state and policy inputs are rejected without fabricating a run', () => {
  for (const invalid of [null, {}, { ...config, turnLimit: 0 }, { ...config, turnLimit: 13 },
    { ...config, initialFuel: NaN }, { ...config, refuelAmount: 1.5 },
    { ...config, prepareCost: Infinity }, { ...config, boats: Array(2) },
    { ...config, boats: [config.boats[0], config.boats[0]] },
    { ...config, boats: [{ ...config.boats[0], people: -1 }] }, { ...config, hiddenGift: 5 }]) {
    assert.throws(() => validateConfig(invalid));
  }
  const original = createState(config);
  for (const invalid of [null, {}, { ...original, fuel: -1 }, { ...original, fuel: 5 },
    { ...original, turn: 0.5 }, { ...original, prepared: true },
    { ...original, ended: true }, { ...original, rescuedIds: ['dinghy', 'dinghy'] },
    { ...original, configId: 'other-version' }]) assert.throws(() => step(config, invalid, 'refuel'));
  assert.throws(() => simulate(config, { policy: 'pretend-human' }));
  assert.throws(() => simulate(config, { maxActions: null }));
  const limited = simulate(config, { policy: 'prepare-first', maxActions: 2 });
  assert.equal(limited.ended, false);
  assert.equal(limited.stopReason, 'max-actions');
  assert.equal(limited.turnsUsed, 2);
});

test('the exact engine source runs without Node globals and yields the same analysis', async () => {
  const source = await readFile(new URL('../src/harbor.mjs', import.meta.url), 'utf8');
  const context = createContext({});
  assert.equal(new Script('typeof process').runInContext(context), 'undefined');
  const actual = new Script(`${source.replace(/^export /gm, '')}\nJSON.stringify(analyze(${JSON.stringify(config)}));`).runInContext(context);
  assert.deepEqual(JSON.parse(actual), analyze(config));
});

const basicKeys = ['configId', 'turn', 'fuel', 'prepared', 'rescuedIds', 'rescuedPeople', 'ended', 'endReason', 'fuelGained', 'fuelSpent'];
const basic = (state) => Object.fromEntries(basicKeys.map((key) => [key, clone(state[key])]));
const economics = (value) => Object.fromEntries(['turnLimit', 'initialFuel', 'refuelAmount', 'preparedRefuelAmount', 'prepareCost', 'boats'].map((key) => [key, clone(value[key])]));
const outcome = (run) => ({ rescuedPeople: run.rescuedPeople, turnsUsed: run.turnsUsed, fuelLeft: run.fuelLeft,
  rescuedBoatIds: run.rescuedBoatIds, remainingBoatIds: run.remainingBoatIds,
  preparationUsed: run.preparationUsed, endReason: run.endReason, actions: run.trace.map((event) => event.action) });

test('undo restores rescue, preparation and prepared refuel including all ledgers', () => {
  const initial = createState(revised);
  const prepared = step(revised, initial, 'prepare').state;
  const supplied = step(revised, prepared, 'refuel').state;
  for (const [before, action] of [[initial, 'prepare'], [initial, 'refuel'], [prepared, 'refuel'], [supplied, 'rescue:trawler']]) {
    const original = clone(before);
    const forward = step(revised, before, action);
    assert.equal(forward.ok, true);
    const preview = getActions(revised, forward.state).find((item) => item.id === 'undo');
    assert.equal(preview.available, true);
    assert.deepEqual(basic(preview.restores), basic(before));
    const restored = step(revised, forward.state, 'undo');
    assert.equal(restored.ok, true);
    assert.deepEqual(basic(restored.state), basic(before));
    assert.equal(restored.state.undoRemaining, 0);
    assert.equal(restored.state.undoUsed, true);
    assert.equal(restored.state.history, null);
    assert.equal(restored.event.undoneAction, action);
    assert.deepEqual(before, original);
  }
});

test('undo is disabled in the original and cannot run before a success in the revision', () => {
  const original = createState(config);
  assert.equal(step(config, original, 'undo').error.code, 'undo-disabled');
  const fresh = createState(revised);
  const refused = step(revised, fresh, 'undo');
  assert.equal(refused.error.code, 'nothing-to-undo');
  assert.deepEqual(refused.state, fresh);
  assert.equal(fresh.undoRemaining, 1);
});

test('undo reopens final-turn and all-rescued endings without regaining its allowance', () => {
  const terminal = simulate(revised, { policy: 'prepare-first' }).finalState;
  assert.equal(terminal.rescuedPeople, 18);
  assert.equal(getActions(revised, terminal).find((item) => item.id === 'undo').available, true);
  const restored = step(revised, terminal, 'undo').state;
  assert.equal(restored.turn, 6);
  assert.equal(restored.rescuedPeople, 16);
  assert.equal(restored.ended, false);
  assert.equal(restored.endReason, null);
  assert.equal(restored.undoRemaining, 0);
  const replayed = step(revised, restored, 'rescue:dinghy');
  assert.equal(replayed.state.rescuedPeople, 18);
  assert.equal(replayed.state.history, null);
  assert.equal(step(revised, replayed.state, 'undo').error.code, 'undo-spent');
  const single = { ...clone(revised), boats: [clone(revised.boats[0])] };
  const complete = step(single, createState(single), 'rescue:dinghy').state;
  assert.equal(complete.endReason, 'all-rescued');
  const reopened = step(single, complete, 'undo').state;
  assert.equal(reopened.ended, false);
  assert.equal(reopened.rescuedPeople, 0);
  assert.deepEqual(reopened.rescuedIds, []);
});

test('a second undo is refused immediately and after another successful action', () => {
  const after = step(revised, createState(revised), 'prepare').state;
  const restored = step(revised, after, 'undo').state;
  for (const state of [restored, step(revised, restored, 'refuel').state]) {
    const denied = step(revised, state, 'undo');
    assert.equal(denied.ok, false);
    assert.equal(denied.error.code, 'undo-spent');
    assert.deepEqual(denied.state, state);
    assert.equal(state.history, null);
  }
  assert.equal(createState(revised).undoRemaining, 1);
});

test('refused actions preserve the last success and undo allowance, including after closure', () => {
  const after = step(revised, createState(revised), 'prepare').state;
  for (const action of ['prepare', 'rescue:ferry', 'missing']) {
    const denied = step(revised, after, action);
    assert.equal(denied.ok, false);
    assert.deepEqual(denied.state, after);
    assert.equal(denied.state.history.action, 'prepare');
    assert.equal(denied.state.undoRemaining, 1);
  }
  assert.equal(step(revised, after, 'undo').state.fuel, 4);
  const terminal = simulate(revised, { policy: 'prepare-first' }).finalState;
  assert.deepEqual(step(revised, terminal, 'refuel').state, terminal);
  assert.equal(step(revised, terminal, 'undo').ok, true);
});

test('undo history is a validated single snapshot and does not alias earlier states', () => {
  const initial = createState(revised);
  const forward = step(revised, initial, 'prepare');
  forward.event.state.history.before.rescuedIds.push('ferry');
  assert.deepEqual(forward.state.history.before.rescuedIds, []);
  assert.deepEqual(initial.rescuedIds, []);
  assert.equal('history' in forward.state.history.before, false);
  const malformed = clone(forward.state);
  malformed.history.before.fuel = 5;
  assert.throws(() => step(revised, malformed, 'undo'));
  const nested = clone(forward.state);
  nested.history.before.history = null;
  assert.throws(() => step(revised, nested, 'undo'));
  const inconsistentQuota = clone(forward.state);
  inconsistentQuota.undoUsed = true;
  assert.throws(() => step(revised, inconsistentQuota, 'undo'));
});

test('the original bytes and economy remain unchanged and forward policies match the observed baseline', async () => {
  const raw = await readFile(new URL('../examples/rain-harbor/baseline.json', import.meta.url));
  const observation = JSON.parse(await readFile(new URL('../docs/runs/rain-harbor/baseline-observation.json', import.meta.url), 'utf8'));
  assert.equal(createHash('sha256').update(raw).digest('hex'), observation.baselineConfigSha256);
  assert.deepEqual(economics(config), economics(revised));
  for (const expected of observation.policies) {
    const original = simulate(config, { policy: expected.policy });
    const changed = simulate(revised, { policy: expected.policy });
    assert.deepEqual(outcome(original), outcome(changed));
    assert.equal(original.rescuedPeople, expected.people);
    assert.equal(original.turnsUsed, expected.turns);
    assert.deepEqual(original.trace.map((event) => event.action), expected.actions);
    assert.equal(changed.trace.some((event) => event.action === 'undo'), false);
  }
  assert.equal(analyze(revised).searchScope, 'forward-actions-only-no-undo');
});

test('all manual undo paths have bounded history and cannot inflate fuel or passengers', () => {
  const queue = [{ state: createState(revised), actions: 0 }];
  const visited = new Set();
  while (queue.length) {
    const { state, actions } = queue.pop();
    const key = JSON.stringify(state);
    if (visited.has(key)) continue;
    visited.add(key);
    assert.ok(actions <= revised.turnLimit + 2);
    assert.ok(state.fuel >= 0);
    assert.equal(state.fuel, revised.initialFuel + state.fuelGained - state.fuelSpent);
    assert.ok(state.rescuedPeople <= 18);
    assert.equal(state.undoRemaining, revised.undoLimit - Number(state.undoUsed));
    if (state.history) assert.equal('history' in state.history.before, false);
    for (const action of getActions(revised, state).filter((item) => item.available)) {
      const result = step(revised, state, action.id);
      assert.equal(result.ok, true);
      queue.push({ state: result.state, actions: actions + 1 });
    }
  }
  assert.ok(visited.size > 217);
});
