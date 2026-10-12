const ACTIONS = Object.freeze(['gather', 'upgrade', 'explore']);
const POLICIES = Object.freeze(['upgrade-first', 'explore-first']);
const CONFIG_KEYS = Object.freeze([
  'schemaVersion', 'id', 'title', 'upgradeCosts', 'baseYield', 'yieldPerLevel',
  'actionSeconds', 'exploreCost', 'exploreGoal',
]);
const STATE_KEYS = Object.freeze([
  'configId', 'level', 'resources', 'explored', 'elapsedSeconds', 'turns',
  'completed', 'firstUpgradeSeconds', 'resourcesGathered',
  'upgradeResourcesSpent', 'exploreResourcesSpent',
]);
const MAX_RESOURCE = 1_000_000_000_000;
const MAX_STATE_TURNS = 1_000_000;

function record(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new TypeError(`${label} must be a plain object`);
  }
}

function keys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new TypeError(`${label}.${key} is not supported`);
  }
}

function integer(value, min, max, label) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new RangeError(`${label} must be an integer from ${min} to ${max}`);
  }
}

function text(value, maxLength, label) {
  if (typeof value !== 'string' || value.length === 0
      || value.trim() !== value || value.length > maxLength) {
    throw new TypeError(`${label} must be a nonempty trimmed string of at most ${maxLength} characters`);
  }
}

/** Validate the documented schema. Returns true; invalid input throws. */
export function validateConfig(config) {
  record(config, 'config');
  keys(config, CONFIG_KEYS, 'config');
  if (config.schemaVersion !== 1) throw new RangeError('config.schemaVersion must be 1');
  text(config.id, 80, 'config.id');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(config.id)) {
    throw new TypeError('config.id must use lowercase letters, digits and hyphens');
  }
  text(config.title, 120, 'config.title');
  if (!Array.isArray(config.upgradeCosts) || config.upgradeCosts.length < 1
      || config.upgradeCosts.length > 20) {
    throw new RangeError('config.upgradeCosts must contain 1 to 20 levels');
  }
  for (let index = 0; index < config.upgradeCosts.length; index += 1) {
    integer(config.upgradeCosts[index], 1, 1_000_000, `config.upgradeCosts[${index}]`);
  }
  integer(config.baseYield, 1, 1_000, 'config.baseYield');
  integer(config.yieldPerLevel, 0, 1_000, 'config.yieldPerLevel');
  record(config.actionSeconds, 'config.actionSeconds');
  keys(config.actionSeconds, ACTIONS, 'config.actionSeconds');
  for (const action of ACTIONS) {
    integer(config.actionSeconds[action], 1, 3_600, `config.actionSeconds.${action}`);
  }
  integer(config.exploreCost, 1, 1_000_000, 'config.exploreCost');
  integer(config.exploreGoal, 1, 1_000, 'config.exploreGoal');
  return true;
}

function sumCosts(config, level = config.upgradeCosts.length) {
  return config.upgradeCosts.slice(0, level).reduce((sum, cost) => sum + cost, 0);
}

function validateState(config, state) {
  record(state, 'state');
  keys(state, STATE_KEYS, 'state');
  if (state.configId !== config.id) throw new TypeError('state.configId does not match config.id');
  integer(state.level, 0, config.upgradeCosts.length, 'state.level');
  integer(state.resources, 0, MAX_RESOURCE, 'state.resources');
  integer(state.explored, 0, config.exploreGoal, 'state.explored');
  integer(state.elapsedSeconds, 0, MAX_RESOURCE, 'state.elapsedSeconds');
  integer(state.turns, 0, MAX_STATE_TURNS, 'state.turns');
  integer(state.resourcesGathered, 0, MAX_RESOURCE, 'state.resourcesGathered');
  integer(state.upgradeResourcesSpent, 0, MAX_RESOURCE, 'state.upgradeResourcesSpent');
  integer(state.exploreResourcesSpent, 0, MAX_RESOURCE, 'state.exploreResourcesSpent');
  if (typeof state.completed !== 'boolean' || state.completed !== (state.explored === config.exploreGoal)) {
    throw new TypeError('state.completed must match the exploration goal');
  }
  if (state.upgradeResourcesSpent !== sumCosts(config, state.level)) {
    throw new RangeError('state upgrade spending does not match purchased levels');
  }
  if (state.exploreResourcesSpent !== state.explored * config.exploreCost) {
    throw new RangeError('state exploration spending does not match exploration count');
  }
  if (state.resources !== state.resourcesGathered - state.upgradeResourcesSpent - state.exploreResourcesSpent) {
    throw new RangeError('state resource ledger does not balance');
  }
  const gathers = state.turns - state.level - state.explored;
  if (gathers < 0) throw new RangeError('state.turns is smaller than the action counts');
  const expectedSeconds = gathers * config.actionSeconds.gather
    + state.level * config.actionSeconds.upgrade
    + state.explored * config.actionSeconds.explore;
  if (state.elapsedSeconds !== expectedSeconds) {
    throw new RangeError('state elapsed time does not match the action counts');
  }
  if (state.resourcesGathered < gathers * config.baseYield
      || state.resourcesGathered > gathers * (config.baseYield + state.level * config.yieldPerLevel)) {
    throw new RangeError('state gathered resources are outside the possible yield range');
  }
  if (state.level === 0) {
    if (state.firstUpgradeSeconds !== null) throw new TypeError('state.firstUpgradeSeconds must be null before upgrading');
  } else {
    const earliest = Math.ceil(config.upgradeCosts[0] / config.baseYield) * config.actionSeconds.gather
      + config.actionSeconds.upgrade;
    integer(state.firstUpgradeSeconds, earliest, state.elapsedSeconds, 'state.firstUpgradeSeconds');
  }
}

/** New expedition: no resources, purchased levels, exploration or elapsed time. */
export function createState(config) {
  validateConfig(config);
  return {
    configId: config.id,
    level: 0,
    resources: 0,
    explored: 0,
    elapsedSeconds: 0,
    turns: 0,
    completed: false,
    firstUpgradeSeconds: null,
    resourcesGathered: 0,
    upgradeResourcesSpent: 0,
    exploreResourcesSpent: 0,
  };
}

function availableUnchecked(config, state) {
  if (state.completed || state.turns >= MAX_STATE_TURNS) return [];
  const actions = [];
  const gain = config.baseYield + state.level * config.yieldPerLevel;
  if (state.resourcesGathered + gain <= MAX_RESOURCE) actions.push('gather');
  if (state.level < config.upgradeCosts.length && state.resources >= config.upgradeCosts[state.level]) {
    actions.push('upgrade');
  }
  if (state.resources >= config.exploreCost) actions.push('explore');
  return actions;
}

/** Available manual actions; completed expeditions have none. */
export function getAvailableActions(config, state) {
  validateConfig(config);
  validateState(config, state);
  return availableUnchecked(config, state);
}

function failed(state, code, message) {
  return { ok: false, state: { ...state }, event: null, error: { code, message } };
}

/** Pure transition. Rejected actions do not spend resources, time or turns. */
export function step(config, state, action) {
  validateConfig(config);
  validateState(config, state);
  if (!ACTIONS.includes(action)) return failed(state, 'unknown-action', 'Unknown action');
  if (state.completed) return failed(state, 'game-complete', 'The expedition is complete');
  if (state.turns >= MAX_STATE_TURNS) return failed(state, 'turn-limit', 'The state turn limit was reached');
  if (action === 'upgrade' && state.level === config.upgradeCosts.length) {
    return failed(state, 'max-level', 'All lantern upgrades are already purchased');
  }
  const cost = action === 'upgrade' ? config.upgradeCosts[state.level]
    : action === 'explore' ? config.exploreCost : 0;
  if (state.resources < cost) return failed(state, 'insufficient-resources', 'Not enough gathered resources');
  const gained = action === 'gather' ? config.baseYield + state.level * config.yieldPerLevel : 0;
  if (state.resourcesGathered + gained > MAX_RESOURCE) {
    return failed(state, 'resource-limit', 'The resource safety limit was reached');
  }
  const next = { ...state };
  next.resources += gained - cost;
  next.resourcesGathered += gained;
  next.turns += 1;
  next.elapsedSeconds += config.actionSeconds[action];
  if (action === 'upgrade') {
    next.upgradeResourcesSpent += cost;
    next.level += 1;
    if (next.firstUpgradeSeconds === null) next.firstUpgradeSeconds = next.elapsedSeconds;
  }
  if (action === 'explore') {
    next.exploreResourcesSpent += cost;
    next.explored += 1;
    next.completed = next.explored === config.exploreGoal;
  }
  validateState(config, next);
  return {
    ok: true,
    state: next,
    event: {
      turn: next.turns,
      action,
      seconds: config.actionSeconds[action],
      cost,
      gained,
      explorationGained: action === 'explore' ? 1 : 0,
      elapsedSeconds: next.elapsedSeconds,
      state: { ...next },
    },
    error: null,
  };
}

function validatePolicy(policy) {
  if (!POLICIES.includes(policy)) throw new RangeError(`policy must be one of: ${POLICIES.join(', ')}`);
}

/** The same strategy selector powers simulation and browser autoplay. */
export function chooseAction(config, state, policy = 'upgrade-first') {
  validatePolicy(policy);
  const available = getAvailableActions(config, state);
  if (available.length === 0) return null;
  if (policy === 'upgrade-first' && state.level < config.upgradeCosts.length) {
    return available.includes('upgrade') ? 'upgrade' : available.includes('gather') ? 'gather' : null;
  }
  if (available.includes('explore')) return 'explore';
  if (policy === 'explore-first' && available.includes('upgrade')) return 'upgrade';
  return available.includes('gather') ? 'gather' : null;
}

function assumptionsFor(config, policy, maxTurns) {
  return [
    'Starts with zero resources and level 0; no gifts, random outcomes or parallel actions.',
    `Gather adds ${config.baseYield} + level × ${config.yieldPerLevel} resources.`,
    `Each exploration spends ${config.exploreCost} resources and advances exactly one step; ${config.exploreGoal} steps complete the expedition.`,
    'Actions consume their configured seconds; the first upgrade time includes gathering and the upgrade action itself.',
    policy === 'upgrade-first'
      ? 'Upgrade-first buys every lantern level before exploring; it gathers whenever the next upgrade is unaffordable.'
      : 'Explore-first explores whenever affordable; otherwise it buys an affordable upgrade, otherwise it gathers. It can finish without buying every upgrade.',
    `Stops on completion, an unavailable strategy action, or ${maxTurns} accepted actions. This is a declared strategy, not a human-player prediction.`,
  ];
}

/** Deterministic bounded simulation. A null time means the event did not occur. */
export function simulate(config, options = {}) {
  validateConfig(config);
  record(options, 'options');
  keys(options, ['policy', 'maxTurns'], 'options');
  const policy = options.policy === undefined ? 'upgrade-first' : options.policy;
  const maxTurns = options.maxTurns === undefined ? 500 : options.maxTurns;
  validatePolicy(policy);
  integer(maxTurns, 1, 100_000, 'options.maxTurns');
  let state = createState(config);
  const trajectory = [{ ...state }];
  const events = [];
  let stopReason = 'max-turns';
  while (state.turns < maxTurns && !state.completed) {
    const action = chooseAction(config, state, policy);
    if (action === null) {
      stopReason = 'stalled';
      break;
    }
    const result = step(config, state, action);
    if (!result.ok) {
      stopReason = 'stalled';
      break;
    }
    state = result.state;
    events.push(result.event);
    trajectory.push({ ...state });
  }
  if (state.completed) stopReason = 'completed';
  return {
    configId: config.id,
    policy,
    assumptions: assumptionsFor(config, policy, maxTurns),
    completed: state.completed,
    turns: state.turns,
    firstUpgradeSeconds: state.firstUpgradeSeconds,
    completionSeconds: state.completed ? state.elapsedSeconds : null,
    totalUpgradeCost: sumCosts(config),
    actualUpgradeCost: state.upgradeResourcesSpent,
    finalState: { ...state },
    trajectory,
    events,
    stopReason,
  };
}

function difference(before, after) {
  return before === null || after === null ? null : after - before;
}

/** Comparison is computed from both inputs, never from supplied outcome numbers. */
export function compareConfigs(before, after) {
  validateConfig(before);
  validateConfig(after);
  const beforeTotalUpgradeCost = sumCosts(before);
  const afterTotalUpgradeCost = sumCosts(after);
  return {
    sameTotalUpgradeCost: beforeTotalUpgradeCost === afterTotalUpgradeCost,
    beforeTotalUpgradeCost,
    afterTotalUpgradeCost,
    policies: POLICIES.map((policy) => {
      const oldRun = simulate(before, { policy });
      const newRun = simulate(after, { policy });
      return {
        policy,
        before: oldRun,
        after: newRun,
        firstUpgradeDeltaSeconds: difference(oldRun.firstUpgradeSeconds, newRun.firstUpgradeSeconds),
        completionDeltaSeconds: difference(oldRun.completionSeconds, newRun.completionSeconds),
      };
    }),
  };
}
