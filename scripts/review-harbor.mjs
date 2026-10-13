#!/usr/bin/env node
// Independent review oracle retained from the executed review. It writes no files.
// This is a second implementation for checking the contract, not a game runtime.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createState, step, getActions, simulate, analyze } from '../src/harbor.mjs';

const root = new URL('../', import.meta.url);
const baselineBytes = await readFile(new URL('examples/rain-harbor/baseline.json', root));
const baseline = JSON.parse(baselineBytes);
const revised = JSON.parse(await readFile(new URL('examples/rain-harbor/revised.json', root), 'utf8'));
const earlier = JSON.parse(await readFile(new URL('docs/runs/rain-harbor/baseline-observation.json', root), 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const fields = ['configId', 'turn', 'fuel', 'prepared', 'rescuedIds',
  'rescuedPeople', 'ended', 'endReason', 'fuelGained', 'fuelSpent'];
const base = state => Object.fromEntries(fields.map(key => [key, structuredClone(state[key])]));

function baselineOracle(state, id) {
  const next = structuredClone(state);
  if (state.ended) return null;
  if (id === 'refuel') {
    const gain = state.prepared ? baseline.preparedRefuelAmount : baseline.refuelAmount;
    next.fuel += gain;
    next.fuelGained += gain;
  } else if (id === 'prepare') {
    if (state.prepared || state.fuel < baseline.prepareCost) return null;
    next.fuel -= baseline.prepareCost;
    next.fuelSpent += baseline.prepareCost;
    next.prepared = true;
  } else {
    const boat = baseline.boats.find(item => id === `rescue:${item.id}`);
    if (!boat || state.rescuedIds.includes(boat.id) || state.fuel < boat.fuelCost) return null;
    next.fuel -= boat.fuelCost;
    next.fuelSpent += boat.fuelCost;
    next.rescuedIds.push(boat.id);
    next.rescuedPeople += boat.people;
  }
  next.turn++;
  next.endReason = next.rescuedIds.length === baseline.boats.length ? 'all-rescued'
    : next.turn === baseline.turnLimit ? 'storm' : null;
  next.ended = next.endReason !== null;
  return next;
}

function auditBaseline() {
  const queue = [createState(baseline)];
  const seen = new Set();
  let legal = 0, refused = 0, terminal = 0, maxPeople = 0;
  for (let index = 0; index < queue.length; index++) {
    const state = queue[index];
    const key = JSON.stringify([state.turn, state.fuel, state.prepared, [...state.rescuedIds].sort()]);
    if (seen.has(key)) continue;
    seen.add(key);
    if (state.ended) {
      terminal++;
      maxPeople = Math.max(maxPeople, state.rescuedPeople);
    }
    const snapshot = JSON.stringify(state);
    const actions = ['refuel', 'prepare', ...baseline.boats.map(boat => `rescue:${boat.id}`), 'unknown'];
    const previews = getActions(baseline, state);
    for (const id of actions) {
      const expected = baselineOracle(base(state), id);
      const actual = step(baseline, state, id);
      assert.equal(JSON.stringify(state), snapshot, 'Input mutated');
      assert.equal(actual.ok, expected !== null, `${key} ${id}`);
      if (expected) {
        assert.deepEqual(base(actual.state), expected);
        assert.equal(previews.find(action => action.id === id).available, true);
        queue.push(actual.state);
        legal++;
      } else {
        assert.deepEqual(actual.state, state);
        assert.ok(actual.error.message);
        if (id !== 'unknown') assert.equal(previews.find(action => action.id === id).available, false);
        refused++;
      }
    }
  }
  const policies = ['rescue-first', 'prepare-first', 'optimal']
    .map(policy => ({ policy, result: simulate(baseline, { policy }).rescuedPeople }));
  assert.equal(analyze(baseline).optimalRescuedPeople, maxPeople);
  return { states: seen.size, legalTransitions: legal, rejectedTransitions: refused,
    terminalStates: terminal, maxPeople, policies };
}

function revisionOracle(state, id) {
  if (id === 'undo') return state.undoRemaining === 1 && state.history
    ? { ...structuredClone(state.history.before), undoRemaining: 0, undoUsed: true, history: null }
    : null;
  if (state.ended) return null;
  const next = structuredClone(state);
  if (id === 'refuel') {
    const gain = state.prepared ? revised.preparedRefuelAmount : revised.refuelAmount;
    next.fuel += gain;
    next.fuelGained += gain;
  } else if (id === 'prepare') {
    if (state.prepared || state.fuel < revised.prepareCost) return null;
    next.fuel -= revised.prepareCost;
    next.fuelSpent += revised.prepareCost;
    next.prepared = true;
  } else {
    const boat = revised.boats.find(item => id === `rescue:${item.id}`);
    if (!boat || state.rescuedIds.includes(boat.id) || state.fuel < boat.fuelCost) return null;
    next.fuel -= boat.fuelCost;
    next.fuelSpent += boat.fuelCost;
    next.rescuedIds.push(boat.id);
    next.rescuedPeople += boat.people;
  }
  next.turn++;
  next.endReason = next.rescuedIds.length === revised.boats.length ? 'all-rescued'
    : next.turn === revised.turnLimit ? 'storm' : null;
  next.ended = next.endReason !== null;
  next.history = state.undoRemaining > 0 ? { action: id, before: base(state) } : null;
  return next;
}

function revisedKey(state) {
  const copy = structuredClone(state);
  copy.rescuedIds.sort();
  if (copy.history) copy.history.before.rescuedIds.sort();
  return JSON.stringify(copy);
}

async function auditRevision() {
  assert.equal(sha256(baselineBytes), earlier.baselineConfigSha256);
  for (const key of ['schemaVersion', 'turnLimit', 'initialFuel', 'refuelAmount',
    'preparedRefuelAmount', 'prepareCost', 'boats']) {
    assert.deepEqual(revised[key], baseline[key], `Changed preserved ${key}`);
  }
  assert.equal(baseline.undoLimit, undefined);
  assert.equal(revised.undoLimit, 1);
  const queue = [createState(revised)];
  const seen = new Set();
  let legal = 0, refused = 0, undos = 0, terminal = 0, maxPeople = 0, restoredTerminal = 0;
  for (let index = 0; index < queue.length; index++) {
    const state = queue[index];
    const key = revisedKey(state);
    if (seen.has(key)) continue;
    seen.add(key);
    if (state.ended) {
      terminal++;
      maxPeople = Math.max(maxPeople, state.rescuedPeople);
    }
    const original = structuredClone(state);
    for (const id of ['refuel', 'prepare', ...revised.boats.map(boat => `rescue:${boat.id}`), 'undo', 'unknown']) {
      const expected = revisionOracle(state, id);
      const actual = step(revised, state, id);
      assert.deepEqual(state, original, 'Input mutated');
      assert.equal(actual.ok, expected !== null, `${id} in ${key}`);
      if (expected) {
        assert.deepEqual(actual.state, expected, `${id} in ${key}`);
        const preview = getActions(revised, state).find(action => action.id === id);
        assert.equal(preview.available, true);
        if (id === 'undo') {
          undos++;
          if (state.ended) restoredTerminal++;
          assert.equal(preview.turnCost, 0);
          assert.equal(preview.cost, 0);
          assert.equal(preview.gain, expected.fuel - state.fuel);
          assert.equal(preview.people, expected.rescuedPeople - state.rescuedPeople);
          const { action, ...restore } = preview.restores;
          assert.deepEqual(restore, base(expected));
          assert.equal(action, state.history.action);
        }
        queue.push(actual.state);
        legal++;
      } else {
        assert.deepEqual(actual.state, state, 'Refusal changed history or allowance');
        assert.ok(actual.error.message);
        refused++;
      }
    }
  }
  assert.equal(maxPeople, 18);
  const policies = [];
  for (const policy of ['rescue-first', 'prepare-first', 'optimal']) {
    const original = simulate(baseline, { policy });
    const changed = simulate(revised, { policy });
    assert.deepEqual(original.trace.map(event => event.action), changed.trace.map(event => event.action));
    for (let index = 0; index < original.trajectory.length; index++) {
      const left = base(original.trajectory[index]);
      const right = base(changed.trajectory[index]);
      delete left.configId;
      delete right.configId;
      assert.deepEqual(left, right);
    }
    policies.push({ policy, baseline: original.rescuedPeople, revised: changed.rescuedPeople,
      actions: original.trace.map(event => event.action) });
  }
  assert.equal(analyze(revised).optimalRescuedPeople, maxPeople);
  const oneBoat = { ...structuredClone(revised), boats: [revised.boats[0]] };
  const initial = createState(oneBoat);
  const saved = step(oneBoat, initial, 'rescue:dinghy').state;
  assert.equal(saved.endReason, 'all-rescued');
  const undone = step(oneBoat, saved, 'undo');
  assert.equal(undone.ok, true);
  assert.deepEqual(base(undone.state), base(initial));
  assert.equal(undone.state.undoRemaining, 0);
  return { baselineConfigSha256: sha256(baselineBytes),
    engineSha256: sha256(await readFile(new URL('src/harbor.mjs', root))),
    statesIncludingUndoHistories: seen.size, legalTransitions: legal, rejectedTransitions: refused,
    acceptedUndos: undos, terminalStates: terminal, terminalUndoRestorations: restoredTerminal,
    maxPeople, allRescuedEarlyUndo: 'PASS with one-boat fixture', policies };
}

console.log(JSON.stringify({ environment: process.version,
  baseline: auditBaseline(), revision: await auditRevision() }, null, 2));
