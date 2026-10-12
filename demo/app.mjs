import * as game from '../src/game.mjs';
import { createScene } from './scene.mjs';

const copy = {
  en: {
    skip: 'Skip to the playable example', language: 'Language',
    eyebrow: 'A small studio. Clear handoffs.',
    headline: 'Turn a game idea into clear rules and a playable prototype.',
    intro: 'Try the loop. Switch the rules. See how one pricing change affects two different ways to play.',
    workflowLink: 'Read the agent workflow ↗', playable: 'Deterministic playable example',
    before: 'Before', after: 'After', originalRules: 'Original rules', revisedRules: 'Revised rules',
    gameTime: 'Game time', loading: 'Loading the game engine…', supplies: 'Supplies',
    lantern: 'Lantern level', moves: 'Moves taken', oneAction: 'One action per move',
    gather: 'Gather', upgrade: 'Upgrade', explore: 'Explore', playStrategy: 'Play strategy',
    pause: 'Pause strategy', replay: 'Replay strategy', reset: 'Reset expedition',
    sameEngine: 'Same engine. Same starting state.', comparison: 'What does the change do?',
    strategy: 'Strategy', upgradeFirst: 'Upgrade first', exploreFirst: 'Explore first',
    costMoves: 'Where the upgrade cost moves', viewConfig: 'View config ↗',
    assumptions: 'What this comparison assumes',
    simTime: 'Times are simulated action times, not measured player times. Every comparison starts from a fresh expedition.',
    engineSource: 'Game engine', beforeConfig: 'Before config', afterConfig: 'After config',
    assistantTeam: 'The team runs in your assistant', rolesTitle: 'Five roles, explicit handoffs.',
    roleDocs: 'Meet the roles ↗', roleLead: 'Design lead', roleLeadNote: 'Goal & decisions',
    roleSystems: 'Systems designer', roleSystemsNote: 'Rules & boundaries',
    roleEconomy: 'Economy designer', roleEconomyNote: 'Costs & progression',
    rolePrototype: 'Prototype developer', rolePrototypeNote: 'A playable loop',
    roleReviewer: 'Playtest reviewer', roleReviewerNote: 'Evidence & next tests',
    honesty: 'This browser demo runs a deterministic game example. The agents run in your own AI assistant; this page does not call an AI model.',
    footer: 'An original, small example you can read, play, and change.', openSource: 'Read the source ↗',
    title: 'Lantern Expedition', seconds: 's', noUpgrade: 'Not reached', unfinished: 'Unfinished',
    firstUpgrade: 'First upgrade', paidUpgrades: 'Paid for upgrades', completion: 'Route completed',
    incomparable: 'Not comparable', unchanged: 'Unchanged', maxLevel: 'Fully upgraded',
    upgradePolicy: 'Upgrade the lantern whenever possible; explore after the final upgrade.',
    explorePolicy: 'Explore when possible; otherwise upgrade if affordable, then gather.',
    sceneDescription: 'A lighthouse island and a boat mapping routes. Marked routes and the lantern reflect your current game state.',
    ready: 'Gather supplies, improve the lantern, and chart the island routes.',
    paused: 'Strategy paused. You can continue manually or resume autoplay.',
    unavailable: 'The example could not load. Reload the page to try again.',
    autoplayStarted: 'Playing the selected strategy from the current game state.',
    notAvailable: 'This action is not available in the current game state.',
    finished: 'Expedition complete. All routes are mapped.',
    budgetLabel: 'Full upgrade budget', sourceAssumptions: 'Assumptions returned by the shared engine:',
    extraUpgrade: 'This policy reaches an upgrade only after the price change.',
    noUpgradeBoth: 'Neither run reaches an upgrade under this policy.',
    laterPrices: 'Later upgrades are priced higher.',
    commonAssumptions: 'Shared by both configurations',
  },
  zh: {
    skip: '跳到可玩示例', language: '语言', eyebrow: '小团队，清楚的交接。',
    headline: '把游戏想法写成清楚的规则，再做成可玩的原型。',
    intro: '玩一轮，切换规则，看看一次价格改动如何影响两种玩法。',
    workflowLink: '阅读智能体协作流程 ↗', playable: '可玩的确定性示例',
    before: '改动前', after: '改动后', originalRules: '原始规则', revisedRules: '修改后的规则',
    gameTime: '游戏时间', loading: '正在加载游戏引擎…', supplies: '物资',
    lantern: '灯塔等级', moves: '行动次数', oneAction: '每次执行一个动作',
    gather: '采集', upgrade: '升级', explore: '探索', playStrategy: '自动演示策略',
    pause: '暂停演示', replay: '重新演示', reset: '重新开始',
    sameEngine: '同一引擎，相同初始状态。', comparison: '这次改动有什么影响？',
    strategy: '行动策略', upgradeFirst: '优先升级', exploreFirst: '优先探索',
    costMoves: '升级成本移到了哪里', viewConfig: '查看配置 ↗',
    assumptions: '这份比较采用了哪些假设',
    simTime: '这里是模拟行动时间，不是真人实测时长。所有比较都从新的远征开始。',
    engineSource: '游戏引擎', beforeConfig: '改动前配置', afterConfig: '改动后配置',
    assistantTeam: '团队在你的 AI 助手中运行', rolesTitle: '五个角色，明确交接。',
    roleDocs: '了解各角色 ↗', roleLead: '设计负责人', roleLeadNote: '目标与决定',
    roleSystems: '系统设计师', roleSystemsNote: '规则与边界',
    roleEconomy: '经济设计师', roleEconomyNote: '成本与成长',
    rolePrototype: '原型开发者', rolePrototypeNote: '可玩的循环',
    roleReviewer: '试玩评审者', roleReviewerNote: '证据与后续测试',
    honesty: '浏览器只运行这个确定性游戏示例。智能体在你自己的 AI 助手中运行，本页面不调用 AI 模型。',
    footer: '一个原创的小示例，代码可读、实际可玩、规则可改。', openSource: '阅读源代码 ↗',
    title: '灯塔远征', seconds: '秒', noUpgrade: '未达到', unfinished: '未完成',
    firstUpgrade: '首次升级', paidUpgrades: '升级实际花费', completion: '完成探索',
    incomparable: '不可比', unchanged: '未变化', maxLevel: '已升至最高级',
    upgradePolicy: '能升级时优先升级灯塔，升至最高级后再探索。',
    explorePolicy: '能探索时优先探索；否则能升级就升级，再否则采集。',
    sceneDescription: '小岛上的灯塔与探索航线。已标记的航线和灯塔变化对应当前游戏状态。',
    ready: '采集物资，升级灯塔，再探索周围的航线。',
    paused: '演示已暂停，可以手动继续或恢复自动行动。',
    unavailable: '示例暂时无法加载，请刷新页面重试。',
    autoplayStarted: '正在从当前游戏状态按所选策略行动。',
    notAvailable: '当前游戏状态无法执行这个动作。',
    finished: '远征完成，所有航线都已探索。',
    budgetLabel: '全部升级的价目合计', sourceAssumptions: '共享引擎返回的假设说明（原文）：',
    extraUpgrade: '这项策略在价格修改后才会进行升级。',
    noUpgradeBoth: '这项策略的两次模拟都没有升级。',
    laterPrices: '后续等级的升级价格提高了。',
    commonAssumptions: '两份配置采用的共同假设',
  }
};

const params = new URLSearchParams(location.search);
let language = ['zh', 'zh-CN'].includes(params.get('lang')) ? 'zh' : 'en';
let mode = params.get('mode') === 'revised' ? 'revised' : 'baseline';
let policy = params.get('policy') === 'explore-first' ? 'explore-first' : 'upgrade-first';
let configs, comparison, state, lastEvent, ready = false, running = false, autoTimer;
let messageKey = 'loading';
const scene = createScene(document.querySelector('#island-scene'));
const byId = id => document.getElementById(id);
const text = (id, value) => { byId(id).textContent = value; };
const t = key => copy[language][key] ?? copy.en[key] ?? key;
const number = value => new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en').format(value);
const time = value => `${number(value)} ${t('seconds')}`;
const currentConfig = () => configs[mode];
const selectedComparison = () => comparison.policies.find(item => item.policy === policy);
const github = 'https://github.com/yiyiwahmo28-hue/game-design-agents/blob/main/';

function announce(message) {
  byId('announcement').textContent = message;
}

function updateUrl() {
  const url = new URL(location.href);
  url.searchParams.set('mode', mode);
  url.searchParams.set('policy', policy);
  if (language === 'zh') url.searchParams.set('lang', 'zh');
  else url.searchParams.delete('lang');
  history.replaceState(null, '', url);
}

function renderLanguage() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.title = `Game Design Agents · ${t('title')}`;
  document.querySelectorAll('[data-i18n]').forEach(element => {
    element.textContent = t(element.dataset.i18n);
  });
  byId('demo-title').textContent = t('title');
  byId('language-select').value = language;
  byId('policy-select').value = policy;
  byId('mode-group').setAttribute('aria-label', language === 'zh' ? '选择规则配置' : 'Choose configuration');
  byId('game-card').setAttribute('aria-label', language === 'zh' ? '可玩的灯塔远征' : 'Playable Lantern Expedition');
  byId('exploration-progress').setAttribute('aria-label', language === 'zh' ? '探索进度' : 'Exploration progress');
  const workflow = `${github}docs/workflow${language === 'zh' ? '.zh-CN' : ''}.md`;
  byId('workflow-top').href = workflow;
  document.querySelectorAll('.role-item').forEach(element => { element.href = workflow; });
  byId('role-docs').href = `${github}skills/game-design-team/references/roles.md`;
}

function moveDescription(event) {
  if (!event) return t(messageKey);
  const duration = time(event.seconds);
  if (event.action === 'gather') {
    return language === 'zh' ? `采集获得 ${number(event.gained)} 物资 · ${duration}` : `Gathered ${number(event.gained)} supplies · ${duration}`;
  }
  if (event.action === 'upgrade') {
    return language === 'zh' ? `灯塔升至 ${number(state.level)} 级，花费 ${number(event.cost)} 物资 · ${duration}` : `Lantern upgraded to level ${number(state.level)}; spent ${number(event.cost)} supplies · ${duration}`;
  }
  return language === 'zh' ? `探索一条航线，花费 ${number(event.cost)} 物资 · ${duration}` : `Charted a route; spent ${number(event.cost)} supplies · ${duration}`;
}

function renderGame() {
  if (!ready || !state) return;
  const config = currentConfig();
  const available = game.getAvailableActions(config, state);
  const yieldAmount = config.baseYield + state.level * config.yieldPerLevel;
  text('scenario-tag', t(mode === 'baseline' ? 'originalRules' : 'revisedRules'));
  text('time-value', time(state.elapsedSeconds));
  text('resources-value', number(state.resources));
  text('level-value', `${number(state.level)} / ${number(config.upgradeCosts.length)}`);
  text('turns-value', number(state.turns));
  text('yield-value', language === 'zh' ? `每次采集 +${number(yieldAmount)}` : `+${number(yieldAmount)} per gather`);
  text('level-note', state.level === config.upgradeCosts.length ? t('maxLevel') : language === 'zh' ? '升级会提高采集收益' : 'Upgrades increase gathering yield');
  const percent = Math.round(state.explored / config.exploreGoal * 100);
  text('exploration-label', language === 'zh' ? `已探索 ${number(state.explored)} / ${number(config.exploreGoal)} 条航线` : `${number(state.explored)} / ${number(config.exploreGoal)} routes mapped`);
  text('progress-percent', `${percent}%`);
  byId('progress-fill').style.width = `${percent}%`;
  byId('exploration-progress').setAttribute('aria-valuenow', String(percent));
  byId('exploration-progress').setAttribute('aria-valuetext', byId('exploration-label').textContent);
  text('gather-detail', `+${number(yieldAmount)} · ${time(config.actionSeconds.gather)}`);
  text('upgrade-detail', state.level < config.upgradeCosts.length ? `${number(config.upgradeCosts[state.level])} · ${time(config.actionSeconds.upgrade)}` : t('maxLevel'));
  text('explore-detail', `${number(config.exploreCost)} · ${time(config.actionSeconds.explore)}`);
  document.querySelectorAll('[data-action]').forEach(button => {
    button.disabled = running || !available.includes(button.dataset.action);
  });
  document.querySelectorAll('[data-mode]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  });
  byId('autoplay-button').disabled = false;
  byId('reset-button').disabled = false;
  text('autoplay-label', t(running ? 'pause' : state.completed ? 'replay' : 'playStrategy'));
  text('move-message', state.completed ? t('finished') : moveDescription(lastEvent));
  byId('state-dot').classList.toggle('is-running', running);
  byId('state-dot').classList.toggle('is-complete', state.completed);
  scene.update(state, config, t('title'), t('sceneDescription'));
}

function makeMetric(label, before, after, unit, note, missingLabel) {
  const row = document.createElement('div');
  row.className = 'metric-row';
  const name = document.createElement('div');
  name.className = 'metric-label';
  name.textContent = label;
  if (note) {
    const detail = document.createElement('small');
    detail.textContent = note;
    name.append(detail);
  }
  row.append(name);
  for (const value of [before, after]) {
    const cell = document.createElement('div');
    cell.className = `metric-value${value === null ? ' is-word' : ''}`;
    cell.textContent = value === null ? missingLabel : number(value);
    if (value !== null && unit) {
      const suffix = document.createElement('small');
      suffix.textContent = unit;
      cell.append(suffix);
    }
    row.append(cell);
  }
  return row;
}

function describeDelta(delta) {
  if (delta === null) return t('incomparable');
  if (delta === 0) return t('unchanged');
  const duration = time(Math.abs(delta));
  return language === 'zh' ? `${delta < 0 ? '提前' : '推迟'} ${duration}` : `${duration} ${delta < 0 ? 'earlier' : 'later'}`;
}

function renderComparison() {
  if (!ready) return;
  const result = selectedComparison();
  text('policy-description', t(policy === 'upgrade-first' ? 'upgradePolicy' : 'explorePolicy'));
  byId('comparison-metrics').replaceChildren(
    makeMetric(t('firstUpgrade'), result.before.firstUpgradeSeconds, result.after.firstUpgradeSeconds, t('seconds'), describeDelta(result.firstUpgradeDeltaSeconds), t('noUpgrade')),
    makeMetric(t('paidUpgrades'), result.before.actualUpgradeCost, result.after.actualUpgradeCost, '', '', t('noUpgrade')),
    makeMetric(t('completion'), result.before.completionSeconds, result.after.completionSeconds, t('seconds'), describeDelta(result.completionDeltaSeconds), t('unfinished')),
  );
  const tradeoffs = [];
  if (result.before.firstUpgradeSeconds === null && result.after.firstUpgradeSeconds !== null) tradeoffs.push(t('extraUpgrade'));
  else if (result.before.firstUpgradeSeconds === null && result.after.firstUpgradeSeconds === null) tradeoffs.push(t('noUpgradeBoth'));
  if (result.completionDeltaSeconds !== null) {
    const delta = describeDelta(result.completionDeltaSeconds);
    tradeoffs.push(language === 'zh' ? `在这项策略下，完成探索${delta}。` : `Under this policy, route completion is ${delta.toLowerCase()}.`);
  }
  if (configs.revised.upgradeCosts.some((cost, index) => cost > configs.baseline.upgradeCosts[index])) tradeoffs.push(t('laterPrices'));
  text('tradeoff', tradeoffs.join(' '));
  const differences = configs.baseline.upgradeCosts.map((before, index) => {
    const after = configs.revised.upgradeCosts[index];
    const delta = after - before;
    const row = document.createElement('div');
    row.className = 'config-row';
    const level = document.createElement('span');
    level.textContent = language === 'zh' ? `升至 ${number(index + 1)} 级` : `Upgrade to level ${number(index + 1)}`;
    const change = document.createElement('span');
    change.textContent = `${number(before)} → ${number(after)}`;
    const difference = document.createElement('span');
    difference.className = delta < 0 ? 'lower' : delta > 0 ? 'higher' : '';
    difference.textContent = `${delta > 0 ? '+' : ''}${number(delta)}`;
    row.append(level, change, difference);
    return row;
  });
  byId('config-differences').replaceChildren(...differences);
  text('budget-note', `${t('budgetLabel')}: ${number(comparison.beforeTotalUpgradeCost)} → ${number(comparison.afterTotalUpgradeCost)}${comparison.sameTotalUpgradeCost ? ` · ${t('unchanged')}` : ''}`);
  byId('config-source').href = `./examples/lantern-expedition/${mode}.json`;
  const sameAssumptions = JSON.stringify(result.before.assumptions) === JSON.stringify(result.after.assumptions);
  const groups = sameAssumptions
    ? [{ label: t('commonAssumptions'), items: result.before.assumptions }]
    : [{ label: t('before'), items: result.before.assumptions }, { label: t('after'), items: result.after.assumptions }];
  byId('assumption-list').replaceChildren(...groups.map(group => {
    const item = document.createElement('li');
    const label = document.createElement('strong');
    label.textContent = group.label;
    const list = document.createElement('ul');
    list.replaceChildren(...group.items.map(assumption => {
      const entry = document.createElement('li');
      entry.textContent = assumption;
      return entry;
    }));
    item.append(label, list);
    return item;
  }));
  byId('assumption-list').setAttribute('aria-label', t('sourceAssumptions'));
}

function pauseAutoplay(announcePause = false) {
  clearTimeout(autoTimer);
  running = false;
  if (announcePause) {
    messageKey = 'paused';
    lastEvent = null;
    announce(t('paused'));
  }
  renderGame();
}

function resetExpedition(announceReset = true) {
  if (!ready) return;
  clearTimeout(autoTimer);
  running = false;
  state = game.createState(currentConfig());
  lastEvent = null;
  messageKey = 'ready';
  renderGame();
  if (announceReset) announce(t('ready'));
}

function takeAction(action, automatic = false) {
  if (!ready || state.completed) return false;
  const result = game.step(currentConfig(), state, action);
  if (!result.ok) {
    messageKey = 'notAvailable';
    lastEvent = null;
    renderGame();
    announce(t('notAvailable'));
    return false;
  }
  state = result.state;
  lastEvent = result.event;
  scene.showAction(action);
  renderGame();
  if (state.completed) {
    pauseAutoplay();
    announce(`${t('finished')} ${time(state.elapsedSeconds)}`);
  } else if (!automatic) {
    announce(moveDescription(lastEvent));
  }
  return true;
}

function autoplayTick() {
  if (!running) return;
  const action = game.chooseAction(currentConfig(), state, policy);
  if (!action || !takeAction(action, true)) {
    pauseAutoplay();
    return;
  }
  if (running) autoTimer = setTimeout(autoplayTick, 620);
}

function startAutoplay() {
  if (!ready) return;
  if (state.completed) resetExpedition(false);
  running = true;
  renderGame();
  announce(t('autoplayStarted'));
  autoTimer = setTimeout(autoplayTick, 420);
}

document.querySelectorAll('[data-action]').forEach(button => {
  button.addEventListener('click', () => {
    pauseAutoplay();
    takeAction(button.dataset.action);
  });
});
document.querySelectorAll('[data-mode]').forEach(button => {
  button.addEventListener('click', () => {
    if (!ready || mode === button.dataset.mode) return;
    mode = button.dataset.mode;
    resetExpedition(false);
    renderComparison();
    updateUrl();
    announce(`${t(mode === 'baseline' ? 'originalRules' : 'revisedRules')}. ${t('ready')}`);
  });
});
byId('reset-button').addEventListener('click', () => resetExpedition());
byId('autoplay-button').addEventListener('click', () => running ? pauseAutoplay(true) : startAutoplay());
byId('policy-select').value = policy;
byId('policy-select').addEventListener('change', event => {
  pauseAutoplay();
  policy = event.target.value;
  renderComparison();
  updateUrl();
  announce(t(policy === 'upgrade-first' ? 'upgradePolicy' : 'explorePolicy'));
});
byId('language-select').addEventListener('change', event => {
  language = event.target.value;
  renderLanguage();
  renderGame();
  renderComparison();
  updateUrl();
});

renderLanguage();

try {
  const entries = await Promise.all(['baseline', 'revised'].map(async name => {
    const response = await fetch(new URL(`../examples/lantern-expedition/${name}.json`, import.meta.url));
    if (!response.ok) throw new Error(`Config unavailable: ${response.status}`);
    const config = await response.json();
    game.validateConfig(config);
    return [name, config];
  }));
  configs = Object.fromEntries(entries);
  comparison = game.compareConfigs(configs.baseline, configs.revised);
  ready = true;
  resetExpedition(false);
  renderComparison();
  // Read-only snapshots for reproducible browser checks; no alternate game path.
  Object.defineProperty(window, '__gameDesignDemo', {
    value: Object.freeze({
      getState: () => structuredClone(state),
      getConfig: () => structuredClone(currentConfig()),
      getComparison: () => structuredClone(comparison),
      getPolicy: () => policy,
      isPlaying: () => running,
    }),
    configurable: false,
  });
  if (params.get('autoplay') === '1') startAutoplay();
} catch (error) {
  messageKey = 'unavailable';
  text('move-message', t('unavailable'));
  text('exploration-label', t('unavailable'));
  text('comparison-metrics', t('unavailable'));
  announce(t('unavailable'));
  console.error('Lantern Expedition initialization failed:', error);
}
