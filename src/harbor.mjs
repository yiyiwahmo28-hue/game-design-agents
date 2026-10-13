const CONFIG_KEYS = ['schemaVersion', 'id', 'title', 'turnLimit', 'initialFuel',
  'refuelAmount', 'preparedRefuelAmount', 'prepareCost', 'boats'];
const STATE_KEYS = ['configId', 'turn', 'fuel', 'prepared', 'rescuedIds',
  'rescuedPeople', 'ended', 'endReason', 'fuelGained', 'fuelSpent'];
const POLICIES = ['rescue-first', 'prepare-first', 'optimal'];

function record(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new TypeError(`${label} must be a plain object`);
  }
}

function knownKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new TypeError(`${label}.${key} is not supported`);
  }
}

function integer(value, min, max, label) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new RangeError(`${label} must be an integer from ${min} to ${max}`);
  }
}

function shortText(value, max, label) {
  if (typeof value !== 'string' || value.trim() !== value || value.length === 0 || value.length > max) {
    throw new TypeError(`${label} must be a nonempty trimmed string of at most ${max} characters`);
  }
}

function identifier(value, label) {
  shortText(value, 80, label);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(value)) throw new TypeError(`${label} must use lowercase letters, digits and hyphens`);
}

export function validateConfig(config) {
  record(config, 'config');
  knownKeys(config, CONFIG_KEYS, 'config');
  if (config.schemaVersion !== 1) throw new RangeError('config.schemaVersion must be 1');
  identifier(config.id, 'config.id');
  shortText(config.title, 120, 'config.title');
  integer(config.turnLimit, 1, 12, 'config.turnLimit');
  integer(config.initialFuel, 0, 30, 'config.initialFuel');
  integer(config.refuelAmount, 1, 12, 'config.refuelAmount');
  integer(config.preparedRefuelAmount, 1, 24, 'config.preparedRefuelAmount');
  integer(config.prepareCost, 1, 30, 'config.prepareCost');
  if (!Array.isArray(config.boats) || config.boats.length < 1 || config.boats.length > 6) {
    throw new RangeError('config.boats must contain 1 to 6 boats');
  }
  const ids = new Set();
  for (const [index, boat] of config.boats.entries()) {
    record(boat, `config.boats[${index}]`);
    knownKeys(boat, ['id', 'name', 'fuelCost', 'people'], `config.boats[${index}]`);
    identifier(boat.id, `config.boats[${index}].id`);
    if (ids.has(boat.id)) throw new TypeError(`Duplicate boat id: ${boat.id}`);
    ids.add(boat.id);
    shortText(boat.name, 80, `config.boats[${index}].name`);
    integer(boat.fuelCost, 1, 30, `config.boats[${index}].fuelCost`);
    integer(boat.people, 1, 50, `config.boats[${index}].people`);
  }
  return true;
}

function copyState(state) {
  return { ...state, rescuedIds: [...state.rescuedIds] };
}

function endReason(config, state) {
  if (state.rescuedIds.length === config.boats.length) return 'all-rescued';
  if (state.turn === config.turnLimit) return 'storm';
  return null;
}

function validateState(config, state) {
  record(state, 'state');
  knownKeys(state, STATE_KEYS, 'state');
  if (state.configId !== config.id) throw new TypeError('state.configId does not match config.id');
  integer(state.turn, 0, config.turnLimit, 'state.turn');
  const maxFuel = config.initialFuel + config.turnLimit * Math.max(config.refuelAmount, config.preparedRefuelAmount);
  integer(state.fuel, 0, maxFuel, 'state.fuel');
  integer(state.fuelGained, 0, maxFuel, 'state.fuelGained');
  integer(state.fuelSpent, 0, 210, 'state.fuelSpent');
  integer(state.rescuedPeople, 0, 300, 'state.rescuedPeople');
  if (typeof state.prepared !== 'boolean' || typeof state.ended !== 'boolean') {
    throw new TypeError('state.prepared and state.ended must be booleans');
  }
  if (!Array.isArray(state.rescuedIds) || new Set(state.rescuedIds).size !== state.rescuedIds.length) {
    throw new TypeError('state.rescuedIds must be an array of unique boat ids');
  }
  let people = 0;
  let spent = state.prepared ? config.prepareCost : 0;
  for (const id of state.rescuedIds) {
    const boat = config.boats.find((item) => item.id === id);
    if (!boat) throw new TypeError('state.rescuedIds contains an unknown boat');
    people += boat.people;
    spent += boat.fuelCost;
  }
  if (state.rescuedPeople !== people || state.fuelSpent !== spent) {
    throw new RangeError('state rescue or spending totals do not match its actions');
  }
  if (state.fuel !== config.initialFuel + state.fuelGained - state.fuelSpent) {
    throw new RangeError('state fuel ledger does not balance');
  }
  const refuels = state.turn - state.rescuedIds.length - Number(state.prepared);
  if (refuels < 0) throw new RangeError('state.turn is smaller than the accepted action count');
  const base = refuels * config.refuelAmount;
  const change = config.preparedRefuelAmount - config.refuelAmount;
  if (!state.prepared || change === 0) {
    if (state.fuelGained !== base) throw new RangeError('state refuel total does not match its action count');
  } else {
    const preparedRefuels = (state.fuelGained - base) / change;
    integer(preparedRefuels, 0, refuels, 'state prepared refuel count');
  }
  const reason = endReason(config, state);
  if (state.endReason !== reason || state.ended !== (reason !== null)) {
    throw new TypeError('state ending flags do not match its turn and rescued boats');
  }
}

export function createState(config) {
  validateConfig(config);
  return { configId: config.id, turn: 0, fuel: config.initialFuel, prepared: false,
    rescuedIds: [], rescuedPeople: 0, ended: false, endReason: null, fuelGained: 0, fuelSpent: 0 };
}

/** UI previews and the execution path use the same affordability and eligibility. */
export function getActions(config, state) {
  validateConfig(config);
  validateState(config, state);
  const actions = [
    { id: 'refuel', type: 'refuel', boatId: null, label: 'Refuel', cost: 0,
      gain: state.prepared ? config.preparedRefuelAmount : config.refuelAmount,
      people: 0, turnCost: 1, nextRefuelAmount: null },
    { id: 'prepare', type: 'prepare', boatId: null, label: 'Prepare rescue boat',
      cost: config.prepareCost, gain: 0, people: 0, turnCost: 1,
      nextRefuelAmount: config.preparedRefuelAmount },
    ...config.boats.map((boat) => ({ id: `rescue:${boat.id}`, type: 'rescue', boatId: boat.id,
      label: boat.name, cost: boat.fuelCost, gain: 0, people: boat.people,
      turnCost: 1, nextRefuelAmount: null })),
  ];
  return actions.map((action) => {
    let reasonCode = null;
    let reason = null;
    if (state.ended) {
      reasonCode = 'harbor-closed';
      reason = state.endReason === 'all-rescued' ? 'All boats have been rescued.' : 'The storm has closed the harbor.';
    } else if (action.type === 'prepare' && state.prepared) {
      reasonCode = 'already-prepared';
      reason = 'The rescue boat is already prepared.';
    } else if (action.type === 'rescue' && state.rescuedIds.includes(action.boatId)) {
      reasonCode = 'already-rescued';
      reason = 'This boat has already been rescued.';
    } else if (state.fuel < action.cost) {
      reasonCode = 'insufficient-fuel';
      reason = `Needs ${action.cost} fuel; you have ${state.fuel}.`;
    }
    return { ...action, available: reasonCode === null, reasonCode, reason };
  });
}

export function step(config, state, actionId) {
  const action = getActions(config, state).find((item) => item.id === actionId);
  if (!action) return { ok: false, state: copyState(state), event: null,
    error: { code: 'unknown-action', message: 'Unknown harbor action.' } };
  if (!action.available) return { ok: false, state: copyState(state), event: null,
    error: { code: action.reasonCode, message: action.reason } };
  const next = copyState(state);
  next.turn += action.turnCost;
  next.fuel += action.gain - action.cost;
  next.fuelGained += action.gain;
  next.fuelSpent += action.cost;
  if (action.type === 'prepare') next.prepared = true;
  if (action.type === 'rescue') {
    next.rescuedIds.push(action.boatId);
    next.rescuedPeople += action.people;
  }
  next.endReason = endReason(config, next);
  next.ended = next.endReason !== null;
  validateState(config, next);
  return { ok: true, state: next, error: null, event: {
    action: action.id, type: action.type, boatId: action.boatId, turn: next.turn,
    cost: action.cost, gain: action.gain, people: action.people, state: copyState(next),
  } };
}

function validatePolicy(policy) {
  if (!POLICIES.includes(policy)) throw new RangeError(`policy must be one of: ${POLICIES.join(', ')}`);
}

function stateKey(config, state) {
  const mask = config.boats.reduce((value, boat, index) => value | (state.rescuedIds.includes(boat.id) ? 1 << index : 0), 0);
  return `${state.turn}:${state.fuel}:${Number(state.prepared)}:${mask}`;
}

/** Every accepted action consumes one turn, making this graph finite and acyclic. */
function makeSolver(config, allowPreparation = true) {
  const memo = new Map();
  function solve(state) {
    const key = stateKey(config, state);
    if (memo.has(key)) return memo.get(key);
    if (state.ended) {
      const result = { people: state.rescuedPeople, terminalTurn: state.turn, terminalFuel: state.fuel, action: null };
      memo.set(key, result);
      return result;
    }
    let best = null;
    for (const action of getActions(config, state).filter((item) => item.available && (allowPreparation || item.type !== 'prepare'))) {
      const next = step(config, state, action.id).state;
      const result = solve(next);
      if (best === null || result.people > best.people
          || (result.people === best.people && result.terminalTurn < best.terminalTurn)
          || (result.people === best.people && result.terminalTurn === best.terminalTurn && result.terminalFuel > best.terminalFuel)) {
        best = { ...result, action: action.id };
      }
    }
    if (best === null) throw new Error('A nonterminal state unexpectedly has no legal action');
    memo.set(key, best);
    return best;
  }
  return { solve, visited: () => memo.size };
}

function mostPeople(boats) {
  return [...boats].sort((a, b) => b.people - a.people || a.fuelCost - b.fuelCost || a.id.localeCompare(b.id))[0];
}

export function chooseAction(config, state, policy = 'rescue-first') {
  validatePolicy(policy);
  const actions = getActions(config, state).filter((item) => item.available);
  if (state.ended) return null;
  if (policy === 'optimal') return makeSolver(config).solve(state).action;
  const remaining = config.boats.filter((boat) => !state.rescuedIds.includes(boat.id));
  const affordable = remaining.filter((boat) => state.fuel >= boat.fuelCost);
  if (policy === 'rescue-first') {
    const boat = mostPeople(affordable);
    return boat ? `rescue:${boat.id}` : 'refuel';
  }
  if (!state.prepared) return actions.some((action) => action.id === 'prepare') ? 'prepare' : 'refuel';
  if (state.turn === config.turnLimit - 1) {
    const boat = mostPeople(affordable);
    return boat ? `rescue:${boat.id}` : 'refuel';
  }
  const target = mostPeople(remaining);
  return state.fuel >= target.fuelCost ? `rescue:${target.id}` : 'refuel';
}

function assumptions(config, policy) {
  const rule = policy === 'rescue-first'
    ? 'Rescue the most passengers among currently affordable boats; refuel only when none is affordable.'
    : policy === 'prepare-first'
      ? 'Prepare first, then save fuel for the remaining boat with the most passengers; on the last turn rescue the most passengers currently affordable.'
      : 'Maximize final rescued people by finite-state search; ties prefer fewer turns, then more remaining fuel, then the declared action order.';
  return [
    `Starts with ${config.initialFuel} fuel; every accepted action uses one of ${config.turnLimit} turns.`,
    `Refuel gains ${config.refuelAmount} before preparation and ${config.preparedRefuelAmount} after it; preparation costs ${config.prepareCost} fuel and one turn, once only.`,
    'Each boat can be rescued once; its entire passenger count is saved for its listed fuel cost.',
    'The final permitted action takes effect before closure; rescuing every boat ends the run early.',
    rule,
    'Deterministic declared policies and model optimization are not human-player observations.',
  ];
}

export function simulate(config, options = {}) {
  validateConfig(config);
  record(options, 'options');
  knownKeys(options, ['policy', 'maxActions'], 'options');
  const policy = options.policy === undefined ? 'rescue-first' : options.policy;
  const maxActions = options.maxActions === undefined ? config.turnLimit : options.maxActions;
  validatePolicy(policy);
  integer(maxActions, 1, 12, 'options.maxActions');
  let state = createState(config);
  const trajectory = [copyState(state)];
  const trace = [];
  const solver = policy === 'optimal' ? makeSolver(config) : null;
  while (!state.ended && trace.length < maxActions) {
    const action = solver ? solver.solve(state).action : chooseAction(config, state, policy);
    const result = step(config, state, action);
    if (!result.ok) throw new Error(`Policy attempted an unavailable action: ${action}`);
    state = result.state;
    trajectory.push(copyState(state));
    trace.push(result.event);
  }
  return { configId: config.id, policy, assumptions: assumptions(config, policy),
    turnsUsed: state.turn, rescuedPeople: state.rescuedPeople, rescuedBoatIds: [...state.rescuedIds],
    remainingBoatIds: config.boats.filter((boat) => !state.rescuedIds.includes(boat.id)).map((boat) => boat.id),
    fuelLeft: state.fuel, preparationUsed: state.prepared, ended: state.ended, endReason: state.endReason,
    stopReason: state.ended ? state.endReason : 'max-actions', finalState: copyState(state), trajectory, trace };
}

function replaySolution(config, solver, initial) {
  let state = copyState(initial);
  const trace = [];
  while (!state.ended) {
    const action = solver.solve(state).action;
    const result = step(config, state, action);
    if (!result.ok) throw new Error('The search witness contains an unavailable action');
    state = result.state;
    trace.push(result.event);
  }
  return { finalState: copyState(state), trace };
}

export function analyze(config) {
  validateConfig(config);
  const initial = createState(config);
  const solver = makeSolver(config);
  const noPreparation = makeSolver(config, false);
  const best = solver.solve(initial);
  const bestWithout = noPreparation.solve(initial);
  const firstActions = getActions(config, initial).filter((action) => action.available).map((action) => {
    const first = step(config, initial, action.id);
    const bestAfter = solver.solve(first.state);
    const witness = replaySolution(config, solver, first.state);
    return { action: action.id, immediatePeople: action.people, bestFinalPeople: bestAfter.people,
      witness: [first.event, ...witness.trace] };
  });
  let latePreparationCounterexample = null;
  const immediateRun = simulate(config, { policy: 'rescue-first' });
  for (let index = 0; index < immediateRun.trajectory.length; index += 1) {
    const state = immediateRun.trajectory[index];
    if (state.ended || state.turn !== config.turnLimit - 1) continue;
    const available = getActions(config, state).filter((action) => action.available);
    if (!available.some((action) => action.id === 'prepare')) continue;
    const rescue = available.filter((action) => action.type === 'rescue').sort((a, b) => b.people - a.people || a.id.localeCompare(b.id))[0];
    if (!rescue) continue;
    const prepared = step(config, state, 'prepare');
    const rescued = step(config, state, rescue.id);
    if (prepared.state.rescuedPeople < rescued.state.rescuedPeople) {
      latePreparationCounterexample = { state: copyState(state), prefixActions: immediateRun.trace.slice(0, index).map((event) => event.action),
        prepare: prepared.event, rescue: rescued.event };
      break;
    }
  }
  return { objective: 'maximize-rescued-people', optimalRescuedPeople: best.people,
    optimalWithoutPreparation: bestWithout.people, analysisStates: solver.visited(),
    noPreparationStates: noPreparation.visited(), optimalWitness: replaySolution(config, solver, initial),
    firstActions, latePreparationCounterexample,
    limitations: ['Optimal means only the stated passenger-count objective under this finite deterministic model.',
      'A higher rescued count does not prove that players understand or prefer this design.'] };
}
