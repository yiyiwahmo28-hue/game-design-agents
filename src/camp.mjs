// A small, deterministic choice experiment. Both versions use this transition.
const MODULES = ['beacon', 'survey-kit'];
const MISSIONS = ['signal', 'survey'];
const ACTIONS = ['build:bundle', 'build:beacon', 'build:survey-kit', 'signal', 'survey', 'wait'];
const POLICIES = ['signal-first', 'survey-first', 'bundle-first'];
const clone = (value) => structuredClone(value);

function object(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new TypeError(`${label} must be a plain object`);
}
function keys(value, allowed, label) {
  object(value, label);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new TypeError(`${label}.${key} is unsupported`);
}
function integer(value, min, max, label) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new RangeError(`${label} must be an integer from ${min} to ${max}`);
}
function text(value, label) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 300 || value !== value.trim()) throw new TypeError(`${label} must be trimmed nonempty text`);
}
function same(left, right) {
  if (left === right) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const names = Object.keys(left);
  return names.length === Object.keys(right).length && names.every((name) => Object.hasOwn(right, name) && same(left[name], right[name]));
}

export function validateConfig(config) {
  keys(config, ['schemaVersion', 'id', 'title', 'titleZh', 'mode', 'turnLimit', 'initialSupplies', 'incomePerTurn', 'bundleCost', 'moduleCosts', 'missions', 'goals'], 'config');
  if (config.schemaVersion !== 1) throw new RangeError('config.schemaVersion must be 1');
  text(config.id, 'config.id');
  if (!/^[a-z0-9-]+$/.test(config.id)) throw new TypeError('config.id must be a lowercase identifier');
  text(config.title, 'config.title'); text(config.titleZh, 'config.titleZh');
  if (!['bundled', 'modular'].includes(config.mode)) throw new TypeError('config.mode must be bundled or modular');
  integer(config.turnLimit, 2, 8, 'config.turnLimit');
  integer(config.initialSupplies, 0, 20, 'config.initialSupplies');
  integer(config.incomePerTurn, 0, 5, 'config.incomePerTurn');
  integer(config.bundleCost, 2, 20, 'config.bundleCost');
  keys(config.moduleCosts, MODULES, 'config.moduleCosts');
  for (const id of MODULES) integer(config.moduleCosts[id], 1, 10, `config.moduleCosts.${id}`);
  if (config.bundleCost !== MODULES.reduce((sum, id) => sum + config.moduleCosts[id], 0)) throw new RangeError('The bundle must cost the sum of both modules in this experiment');
  keys(config.missions, MISSIONS, 'config.missions');
  for (const [index, id] of MISSIONS.entries()) {
    const mission = config.missions[id];
    keys(mission, ['module', 'metric', 'cost', 'earlyThroughTurn', 'earlyValue', 'lateValue', 'windowReason', 'windowReasonZh'], `config.missions.${id}`);
    if (mission.module !== MODULES[index] || mission.metric !== ['people', 'routes'][index]) throw new TypeError(`config.missions.${id} has the wrong module or metric`);
    integer(mission.cost, 1, 10, `${id}.cost`);
    integer(mission.earlyThroughTurn, 1, config.turnLimit, `${id}.earlyThroughTurn`);
    integer(mission.earlyValue, 1, 50, `${id}.earlyValue`);
    integer(mission.lateValue, 0, mission.earlyValue, `${id}.lateValue`);
    text(mission.windowReason, `${id}.windowReason`); text(mission.windowReasonZh, `${id}.windowReasonZh`);
  }
  if (!Array.isArray(config.goals) || config.goals.length !== 2) throw new TypeError('config.goals must contain two explicit scenarios');
  const ids = new Set();
  for (const goal of config.goals) {
    keys(goal, ['id', 'name', 'nameZh', 'description', 'descriptionZh', 'requirements'], 'goal');
    text(goal.id, 'goal.id'); text(goal.name, 'goal.name'); text(goal.nameZh, 'goal.nameZh');
    text(goal.description, 'goal.description'); text(goal.descriptionZh, 'goal.descriptionZh');
    if (ids.has(goal.id)) throw new TypeError('Goal ids must be unique'); ids.add(goal.id);
    keys(goal.requirements, ['people', 'routes'], 'goal.requirements');
    integer(goal.requirements.people, 0, 50, 'goal.requirements.people');
    integer(goal.requirements.routes, 0, 50, 'goal.requirements.routes');
  }
  return true;
}

function initial(config) {
  return { configId: config.id, turn: 0, supplies: config.initialSupplies, grossIncome: 0, spent: 0,
    modules: [], missions: [], people: 0, routes: 0, ended: false, actions: [] };
}
export function createState(config) { validateConfig(config); return initial(config); }

function describe(config, state, id) {
  const mission = config.missions[id];
  const moduleId = id.startsWith('build:') ? id.slice(6) : null;
  const type = moduleId ? 'build' : mission ? 'mission' : 'wait';
  const names = { 'build:bundle': ['Build the whole camp', '建设整套营地'], 'build:beacon': ['Build the beacon', '先建信标'],
    'build:survey-kit': ['Build the survey kit', '先建勘测工具'], signal: ['Send the rescue signal', '发出救援信号'],
    survey: ['Map safe routes', '勘测安全路线'], wait: ['Wait for supplies', '等待补给'] };
  const cost = moduleId === 'bundle' ? config.bundleCost : moduleId ? config.moduleCosts[moduleId] : mission?.cost ?? 0;
  let reasonCode = null; let reason = ''; let reasonZh = '';
  function deny(code, en, zh) { if (reasonCode === null) { reasonCode = code; reason = en; reasonZh = zh; } }
  if (state.ended) deny('camp-closed', 'The fixed session has ended.', '固定时段已结束。');
  if (moduleId && moduleId !== 'bundle' && config.mode === 'bundled') deny('bundled-only', 'This version sells both modules together.', '原版只能整包建设，不能单独购买。');
  if (moduleId === 'bundle' && state.modules.length) deny('module-already-built', 'Part of the camp is already built; buy only the missing module.', '已有模块，不能重复购买整包；只需补建缺少的模块。');
  if (moduleId !== 'bundle' && state.modules.includes(moduleId)) deny('module-already-built', 'This module is already built.', '该模块已建成。');
  if (mission && state.missions.some((item) => item.id === id)) deny('mission-complete', 'This mission has already been completed.', '该任务已完成，每局只能执行一次。');
  if (mission && !state.modules.includes(mission.module)) deny('module-required', `Build ${mission.module} first.`, mission.module === 'beacon' ? '请先建设信标。' : '请先建设勘测工具。');
  if (state.supplies < cost) deny('insufficient-supplies', `Needs ${cost} supplies; only ${state.supplies} are available before this turn's delivery.`, `需 ${cost} 补给，当前只有 ${state.supplies}；本回合到账不能提前花费。`);
  const nextTurn = state.turn + 1;
  const early = mission ? nextTurn <= mission.earlyThroughTurn : null;
  const missionValue = mission ? (early ? mission.earlyValue : mission.lateValue) : 0;
  const available = reasonCode === null;
  const preview = { turn: nextTurn, supplies: state.supplies - cost + config.incomePerTurn,
    people: state.people + (mission?.metric === 'people' ? missionValue : 0),
    routes: state.routes + (mission?.metric === 'routes' ? missionValue : 0), early, missionValue, metric: mission?.metric ?? null };
  // Blocked previews describe the proposed action, never a committed state.
  return { id, type, name: names[id][0], nameZh: names[id][1], cost, income: config.incomePerTurn, turnCost: 1,
    available, reasonCode, reason, reasonZh, preview, moduleId, missionId: mission ? id : null };
}
function apply(config, state, action) {
  const next = clone(state);
  next.turn += 1;
  next.supplies -= action.cost;
  next.spent += action.cost;
  if (action.type === 'build') next.modules = MODULES.filter((id) => state.modules.includes(id) || action.moduleId === 'bundle' || action.moduleId === id);
  if (action.type === 'mission') {
    next.missions.push({ id: action.id, turn: next.turn, value: action.preview.missionValue, early: action.preview.early });
    next[action.preview.metric] += action.preview.missionValue;
  }
  // Fixed income follows every legal action, including the last one. Missions
  // and facilities never change it; ending early would break the comparison.
  next.grossIncome += config.incomePerTurn;
  next.supplies += config.incomePerTurn;
  next.ended = next.turn === config.turnLimit;
  next.actions.push(action.id);
  return next;
}
function validateState(config, state) {
  object(state, 'state');
  if (!Array.isArray(state.actions) || state.actions.length > config.turnLimit) throw new TypeError('state.actions must be a bounded legal history');
  let expected = initial(config);
  for (const id of state.actions) {
    if (!ACTIONS.includes(id)) throw new TypeError('state.actions contains an unknown action');
    const action = describe(config, expected, id);
    if (!action.available) throw new TypeError('state.actions contains an illegal action');
    expected = apply(config, expected, action);
  }
  if (!same(state, expected)) throw new TypeError('state does not match the accepted action history');
}
export function getActions(config, state) {
  validateConfig(config); validateState(config, state);
  return ACTIONS.map((id) => describe(config, state, id));
}
export function step(config, state, actionId) {
  validateConfig(config); validateState(config, state);
  if (!ACTIONS.includes(actionId)) return { ok: false, state: clone(state), event: null,
    error: { code: 'unknown-action', message: 'Unknown action.', messageZh: '未知操作。' } };
  const action = describe(config, state, actionId);
  if (!action.available) return { ok: false, state: clone(state), event: null,
    error: { code: action.reasonCode, message: action.reason, messageZh: action.reasonZh } };
  const next = apply(config, state, action);
  return { ok: true, state: next, event: { action: action.id, turn: next.turn, cost: action.cost, income: config.incomePerTurn,
    missionValue: action.preview.missionValue, metric: action.preview.metric, early: action.preview.early, state: clone(next) }, error: null };
}
export function evaluateGoal(config, state, goalId) {
  validateConfig(config); validateState(config, state);
  const goal = config.goals.find((item) => item.id === goalId);
  if (!goal) throw new TypeError(`Unknown goal: ${goalId}`);
  const missing = Object.fromEntries(['people', 'routes'].map((metric) => [metric, Math.max(0, goal.requirements[metric] - state[metric])]));
  return { id: goalId, met: missing.people === 0 && missing.routes === 0, requirements: clone(goal.requirements), missing };
}
export function chooseAction(config, state, policy = 'signal-first') {
  const actions = getActions(config, state);
  if (!POLICIES.includes(policy)) throw new TypeError(`Unknown policy: ${policy}`);
  if (state.ended) return null;
  const first = policy === 'survey-first' ? 'survey' : 'signal';
  const second = first === 'signal' ? 'survey' : 'signal';
  const available = (id) => actions.find((item) => item.id === id)?.available;
  if (config.mode === 'bundled' || policy === 'bundle-first') {
    if (!state.modules.length) return available('build:bundle') ? 'build:bundle' : 'wait';
  }
  for (const missionId of [first, second]) {
    if (state.missions.some((item) => item.id === missionId)) continue;
    const moduleId = config.missions[missionId].module;
    if (!state.modules.includes(moduleId)) return available(`build:${moduleId}`) ? `build:${moduleId}` : 'wait';
    return available(missionId) ? missionId : 'wait';
  }
  return 'wait';
}
export function simulate(config, { policy = 'signal-first' } = {}) {
  let state = createState(config);
  const trajectory = [clone(state)]; const trace = [];
  while (!state.ended) {
    const result = step(config, state, chooseAction(config, state, policy));
    if (!result.ok) throw new Error('Policy returned an unavailable action');
    state = result.state; trace.push(result.event); trajectory.push(clone(state));
  }
  return { policy, trajectory, trace, finalState: state, summary: { turns: state.turn, people: state.people, routes: state.routes,
    grossIncome: state.grossIncome, totalAvailable: config.initialSupplies + state.grossIncome, spent: state.spent, balance: state.supplies,
    waitTurns: trace.filter((event) => event.action === 'wait').map((event) => event.turn),
    firstBuildTurn: trace.find((event) => event.action.startsWith('build:'))?.turn ?? null,
    goals: config.goals.map((goal) => evaluateGoal(config, state, goal.id)) } };
}
function signature(state) {
  // Histories with equal current outcomes and deadlines have identical futures.
  return JSON.stringify([state.turn, state.supplies, state.modules, state.people, state.routes,
    MISSIONS.filter((id) => state.missions.some((mission) => mission.id === id))]);
}
function frontier(outcomes) {
  return outcomes.filter((item) => !outcomes.some((other) => other.people >= item.people && other.routes >= item.routes
    && (other.people > item.people || other.routes > item.routes))).sort((a, b) => b.people - a.people || b.routes - a.routes);
}
function enumerate(config, start) {
  const seen = new Set(); const terminals = []; let transitions = 0;
  function visit(state) {
    const key = signature(state);
    if (seen.has(key)) return;
    seen.add(key);
    if (state.ended) { terminals.push(state); return; }
    for (const id of ACTIONS) {
      const action = describe(config, state, id);
      if (!action.available) continue;
      transitions += 1;
      visit(apply(config, state, action));
    }
  }
  visit(start);
  const byOutcome = new Map();
  for (const state of terminals) {
    const key = `${state.people}:${state.routes}`;
    if (!byOutcome.has(key)) byOutcome.set(key, { people: state.people, routes: state.routes, witness: [...state.actions],
      grossIncome: state.grossIncome, spent: state.spent, balance: state.supplies });
  }
  const outcomes = [...byOutcome.values()].sort((a, b) => b.people - a.people || b.routes - a.routes);
  return { reachableStates: seen.size, terminalStates: terminals.length, transitions, terminalOutcomes: outcomes,
    paretoFrontier: frontier(outcomes), goals: config.goals.map((goal) => {
      const witness = terminals.find((state) => state.people >= goal.requirements.people && state.routes >= goal.requirements.routes);
      return { id: goal.id, achievable: Boolean(witness), witness: witness ? [...witness.actions] : null };
    }) };
}
export function analyze(config) {
  const state = createState(config);
  const analysis = enumerate(config, state);
  return { ...analysis, firstActions: getActions(config, state).filter((action) => action.available).map((action) => {
    const result = enumerate(config, apply(config, state, action));
    return { id: action.id, paretoFrontier: result.paretoFrontier, goals: result.goals };
  }), assumptions: [
    'All legal action sequences run to the same fixed horizon; no task completion ends the session early.',
    'People and routes are separate outcomes, not supplies or a weighted score.',
    'Equivalent current states are merged; witnesses remain complete legal histories.',
    'This deterministic search proves reachable outcomes, not player comprehension or enjoyment.'
  ] };
}
