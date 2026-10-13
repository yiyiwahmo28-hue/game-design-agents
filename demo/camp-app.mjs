import { createState, getActions, step, chooseAction, simulate, analyze, evaluateGoal, validateConfig } from '../src/camp.mjs';
import { renderCampScene } from './camp-scene.mjs';

const repository = 'https://github.com/yiyiwahmo28-hue/game-design-agents/blob/main/';
const casePath = 'docs/runs/signal-camp/';
const query = new URLSearchParams(location.search);
let language = query.get('lang') === 'zh' ? 'zh' : 'en';
let view = ['play', 'design', 'verify'].includes(query.get('view')) ? query.get('view') : 'play';
let goalId = query.get('goal') === 'route-priority' ? 'route-priority' : 'rescue-priority';
let configs = {};
let states = {};
let analysis = {};
let runs = {};
let recordedEvidence = null;
let playing = false;
let timer = null;
let events = {};
const versions = ['baseline', 'revised'];
const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const bilingual = (en, zh) => language === 'zh' ? zh : en;
const label = item => item[language === 'zh' ? 'nameZh' : 'name'];
const texts = {
  en: {
    skip: 'Skip to the playable comparison', language: 'Language', eyebrow: 'Game design, carried through to play',
    headline: 'Same resources.\nMake the early choices matter.', intro: 'A playable before-and-after case. Turn early waiting into a real tradeoff, keep the resource budget, and check what the change costs.',
    tryGame: 'Play both versions ↓', yourBrief: 'Start with your own brief ↗', loading: 'Loading the playable comparison…',
    startEyebrow: 'Your brief is next', startTitle: 'Bring the decision you want players to make.', startCopy: 'Prepare a workspace, then give its prompt to your AI coding assistant. Carry the rules, playable prototype, and verification through together.',
    startGuide: 'Follow the start guide ↗', startCommand: 'Run in a local repository checkout', copyCommand: 'Copy command', copied: 'Copied', copyFailed: 'Select and copy the command below',
    starterNote: 'This command prepares files. Your assistant performs the design and implementation.', harborLink: 'Rain Harbor: brief to prototype ↗', lanternLink: 'Lantern Expedition ↗',
    footerNote: 'Original public cases. Executable rules. Clear limits to the evidence.', caseDocs: 'Read the complete case ↗',
  },
  zh: {
    skip: '跳到可玩对照', language: '语言', eyebrow: '把策划判断，做到可玩的结果里',
    headline: '同样的资源，\n让玩家更早做出值得权衡的选择。', intro: '亲手比较修改前后：把前期等待变成有代价的选择，保持补给产出不变，再检查得到了什么、牺牲了什么。',
    tryGame: '试玩两个版本 ↓', yourBrief: '用你的需求开始 ↗', loading: '正在读取可玩案例…',
    startEyebrow: '下一个，换成你的需求', startTitle: '从“希望玩家做什么选择”开始。', startCopy: '准备一个工作目录，把提示交给 AI 编程助手。让规则、可玩原型和修改验证一起完成。',
    startGuide: '查看完整上手指南 ↗', startCommand: '在本地仓库目录中运行', copyCommand: '复制命令', copied: '已复制', copyFailed: '请选中下方命令复制',
    starterNote: '命令负责准备文件，设计和实现由你的 AI 助手执行。', harborLink: '雨港救援：需求到原型 ↗', lanternLink: '灯火远征 ↗',
    footerNote: '原创公开案例，可执行的规则，明确的验证范围。', caseDocs: '阅读完整案例 ↗',
  },
};
const t = key => texts[language][key];
const goal = () => configs.revised.goals.find(item => item.id === goalId);
const policy = () => goalId === 'route-priority' ? 'survey-first' : 'signal-first';
const incomeBudget = config => config.turnLimit * config.incomePerTurn;
const resultText = state => bilingual(`${state.people} people · ${state.routes} routes`, `${state.people} 人 · ${state.routes} 条路线`);
const actionShort = id => ({
  wait: bilingual('Wait', '等待'), 'build:bundle': bilingual('Build all', '整包建设'),
  'build:beacon': bilingual('Beacon', '建设信标'), 'build:survey-kit': bilingual('Survey kit', '建设工具'),
  signal: bilingual('Signal', '发信号'), survey: bilingual('Survey', '勘路线'),
})[id];

function updateUrl() {
  const url = new URL(location.href);
  url.searchParams.set('lang', language); url.searchParams.set('view', view); url.searchParams.set('goal', goalId);
  history.replaceState(null, '', url);
}
function renderStatic() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.title = bilingual('Game Design Agents · Make the choice matter', 'Game Design Agents · 让选择产生后果');
  document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
  $('#page-title').innerHTML = t('headline').split('\n').map(escapeHtml).join('<br>');
  $('#language-select').value = language;
  for (const id of ['top-start-guide', 'start-guide']) $(`#${id}`).href = `${repository}docs/start-your-game${language === 'zh' ? '.zh-CN' : ''}.md`;
  $('#case-docs').href = `${repository}${casePath}README.md`;
  $('#harbor-link').href = `./harbor.html?lang=${language}`; $('#lantern-link').href = `./lantern.html?lang=${language}`;
  $('#start-command').textContent = bilingual(
    'npm run new -- --name my-game --brief "Keep supply income fixed; make the first decision matter" --lang en',
    'npm run new -- --name my-game --brief "保持补给总产出不变，让前期等待变成有意义的选择" --lang zh',
  );
}
function renderGoalControls() {
  return `<div class="goal-control"><span class="control-label">${bilingual('Your assignment', '本局任务')}</span><div class="segmented" aria-label="${bilingual('Choose the scenario', '选择任务情境')}">${configs.revised.goals.map(item => `<button type="button" data-goal="${item.id}" aria-pressed="${item.id === goalId}">${item.id === 'rescue-priority' ? bilingual('Rescue first', '救援优先') : bilingual('Routes first', '路线优先')}</button>`).join('')}</div></div>`;
}
function renderDemo() {
  const active = document.activeElement;
  const focusKey = active?.closest('#camp-demo') ? {
    id: active.id, view: active.dataset.view, goal: active.dataset.goal,
    version: active.dataset.version, action: active.dataset.action,
  } : null;
  const total = incomeBudget(configs.revised);
  $('#camp-demo').innerHTML = `<div class="demo-heading"><div class="demo-title"><span class="case-mark" aria-hidden="true">⌁</span><div><h2 id="case-title">${bilingual('Signal Camp', '信标营地')}</h2><p class="demo-kicker">${bilingual('An original game design case · play the change', '原创策划案例 · 亲手试玩修改前后')}</p></div></div><span class="budget-badge"><i></i>${bilingual(`Both versions: +${total} supplies`, `两个版本：均产出 ${total} 补给`)}</span></div>
  <nav class="demo-nav" role="tablist" aria-label="${bilingual('Case views', '案例视图')}">${['play','design','verify'].map((id, index) => `<button type="button" class="demo-tab" id="tab-${id}" role="tab" data-view="${id}" aria-selected="${view === id}" aria-controls="camp-panel" tabindex="${view === id ? 0 : -1}"><span class="tab-no">0${index + 1}</span>${({play:bilingual('Play the difference','亲手对比'),design:bilingual('Why this change','为什么这样改'),verify:bilingual('Check the tradeoff','验证差异')})[id]}</button>`).join('')}</nav>
  <div id="camp-panel" class="demo-body" role="tabpanel" aria-labelledby="tab-${view}" tabindex="0">${view === 'play' ? renderPlay() : view === 'design' ? renderDesign() : renderVerify()}</div>
  <div class="demo-bottom"><p>${bilingual('Playable rules and deterministic checks. Player understanding still needs a human playtest.', '这里可以试玩并复核规则；玩家是否理解这些取舍，仍需真人试玩。')}</p><a href="${repository}${casePath}README.md">${bilingual('Full case & evidence ↗', '完整案例与证据 ↗')}</a></div>`;
  if (focusKey) {
    let next = focusKey.id ? document.getElementById(focusKey.id)
      : focusKey.goal ? $(`[data-goal="${focusKey.goal}"]`)
        : focusKey.action ? $(`[data-version="${focusKey.version}"][data-action="${focusKey.action}"]`) : null;
    if (next?.disabled && focusKey.version) next = $(`[data-version="${focusKey.version}"][data-action]:not(:disabled)`);
    next?.focus({preventScroll:true});
  }
}
function renderPlay() {
  const baseFirst = runs.baseline['signal-first'].summary.firstBuildTurn;
  const revisedFirst = runs.revised['signal-first'].summary.firstBuildTurn;
  return `<div class="play-toolbar">${renderGoalControls()}<div class="play-tools"><button class="text-button" type="button" id="reset-games">${bilingual('Reset both', '重新开始')}</button><button class="button primary" type="button" id="play-policy">${playing ? bilingual('Pause playback', '暂停演示') : bilingual('Replay this goal from start', '从头演示本局目标')}</button></div></div>
  <p class="goal-description">${escapeHtml(goal()[language === 'zh' ? 'descriptionZh' : 'description'])}<span>${bilingual(`Early window closes after turn ${configs.revised.missions.signal.earlyThroughTurn}.`, `早期窗口在第 ${configs.revised.missions.signal.earlyThroughTurn} 回合结束后关闭。`)}</span></p>
  <div class="comparison-grid">${versions.map(renderGame).join('')}</div>
  <div class="compare-insight"><div class="insight-item"><span>${bilingual('Original: waiting for the bundle', '原版：等到整包可买')}</span><strong>${bilingual(`${baseFirst - 1} forced waits → build on turn ${baseFirst}`, `前 ${baseFirst - 1} 回合只能等 → 第 ${baseFirst} 回合建设`)}</strong></div><div class="insight-item"><span>${bilingual('Revised: choose what comes first', '改版：决定先保住哪一项')}</span><strong>${bilingual(`Choose a module on turn ${revisedFirst}`, `第 ${revisedFirst} 回合选择先建哪个模块`)}</strong></div><div class="insight-item"><span>${bilingual('Preserved supply delivery', '保持不变的补给时序')}</span><strong>${bilingual(`Start ${configs.revised.initialSupplies} · +${configs.revised.incomePerTurn} each turn · ${configs.revised.turnLimit} turns`, `初始 ${configs.revised.initialSupplies} · 每回合 +${configs.revised.incomePerTurn} · 共 ${configs.revised.turnLimit} 回合`)}</strong></div></div>`;
}
function renderGame(version) {
  const state = states[version]; const config = configs[version];
  const goalState = evaluateGoal(config, state, goalId);
  const actions = getActions(config, state);
  const actionIds = version === 'baseline' ? ['build:bundle','signal','survey','wait'] : ['build:beacon','build:survey-kit','signal','survey','wait'];
  const windowOpen = !state.ended && state.turn < config.missions.signal.earlyThroughTurn;
  const phase = state.ended ? bilingual('Session complete', '本局结束') : bilingual(`Next: turn ${state.turn + 1} of ${config.turnLimit}`, `即将进入第 ${state.turn + 1} / ${config.turnLimit} 回合`);
  return `<article class="game-card ${version}" aria-label="${version === 'baseline' ? bilingual('Original version', '原版') : bilingual('Revised version', '改版')}"><div class="card-heading"><div class="version-title">${version === 'baseline' ? bilingual('Before', '修改前') : bilingual('After', '修改后')}<span class="version-label">${version === 'baseline' ? bilingual('One locked bundle', '只能整包建设') : bilingual('Choose your first module', '可以分步建设')}</span></div><span class="version-chip">${version === 'baseline' ? bilingual(`All-in: ${config.bundleCost}`, `整包 ${config.bundleCost} 补给`) : bilingual(`${config.moduleCosts.beacon} + ${config.moduleCosts['survey-kit']} = ${config.bundleCost} supplies`, `${config.moduleCosts.beacon} + ${config.moduleCosts['survey-kit']} = ${config.bundleCost} 补给`)}</span></div>
  <div class="camp-scene">${renderCampScene(state, config)}<span class="scene-stage"><span class="dot"></span>${phase}</span><span class="scene-goal">${state.ended ? (goalState.met ? bilingual('Assignment met', '达成本局任务') : bilingual('Assignment missed', '未达成本局任务')) : windowOpen ? bilingual('Boat & low tide available', '接驳船未走 · 潮水未涨') : bilingual('Boat left · tide rose', '接驳船已走 · 潮水已涨')}</span></div>
  <div class="card-content"><div class="stats-row"><div class="stat"><span>${bilingual('Supplies left', '剩余补给')}</span><strong>${state.supplies}</strong></div><div class="stat"><span>${bilingual('Evacuated', '接走人数')}</span><strong>${state.people} <small>/ ${goalState.requirements.people}</small></strong></div><div class="stat"><span>${bilingual('Routes marked', '已标记路线')}</span><strong>${state.routes} <small>/ ${goalState.requirements.routes}</small></strong></div><div class="stat"><span>${bilingual('Turns spent', '已用回合')}</span><strong>${state.turn} <small>/ ${config.turnLimit}</small></strong></div></div>
  <div class="time-track" style="grid-template-columns:repeat(${config.turnLimit},1fr)" aria-hidden="true">${Array.from({length:config.turnLimit},(_,index)=>`<span class="time-tick ${index < state.turn ? 'done' : ''} ${index < config.missions.signal.earlyThroughTurn ? 'early' : ''}"></span>`).join('')}</div>
  <div class="action-grid">${actionIds.map(id => renderAction(version, actions.find(action => action.id === id))).join('')}</div>
  ${version === 'revised' ? `<button type="button" class="bundle-control" data-version="revised" data-action="build:bundle" ${!actions.find(action => action.id === 'build:bundle').available || playing ? 'disabled' : ''}>${bilingual('Keep the original bundle as a comparison', '也可购买原版整包（保留对照）')} · ${config.bundleCost}</button>` : '<div class="bundle-placeholder" aria-hidden="true"></div>'}
  <p class="event-message" id="message-${version}" aria-live="polite">${renderMessage(version)}</p>
  <div class="income-line"><span>${bilingual('Supplies ledger', '补给账本')}</span><span>${bilingual('Earned', '到账')} <strong>${state.grossIncome}</strong> · ${bilingual('Spent', '支出')} <strong>${state.spent}</strong> · ${bilingual('Left', '余额')} <strong>${state.supplies}</strong></span></div></div></article>`;
}
function renderAction(version, action) {
  const state = states[version]; const config = configs[version];
  const isWait = action.id === 'wait';
  const isBundle = action.id === 'build:bundle';
  let name = label(action);
  if (action.id === 'build:beacon') name = bilingual('Build beacon', '建设信标');
  if (action.id === 'build:survey-kit') name = bilingual('Build survey kit', '建设勘测工具');
  let detail;
  if (isWait) detail = bilingual(`+${action.income} supplies · costs 1 turn`, `到账 +${action.income} 补给 · 消耗 1 回合`);
  else if (action.type === 'mission') {
    const mission = config.missions[action.id];
    const unit = action.preview.metric === 'people' ? bilingual('people','人') : bilingual('routes','条路线');
    detail = bilingual(`Turn ≤${mission.earlyThroughTurn}: ${mission.earlyValue} ${unit} · later: ${mission.lateValue}`, `第 ${mission.earlyThroughTurn} 回合内：${mission.earlyValue} ${unit} · 之后：${mission.lateValue}`);
    if (state.missions.some(item => item.id === action.id)) detail = bilingual('Mission complete · once per session', '任务已完成 · 每局一次');
    else if (action.available) detail = bilingual(`This turn: +${action.preview.missionValue} ${unit} · ${action.preview.early ? 'early window' : 'late arrival'}`, `本回合可获得 ${action.preview.missionValue} ${unit} · ${action.preview.early ? '赶上早期窗口' : '已经错过早期窗口'}`);
    else if (action.reasonCode === 'module-required') detail = bilingual(`Needs ${action.id === 'signal' ? 'beacon' : 'survey kit'} · early ${mission.earlyValue} ${unit} / late ${mission.lateValue}`, `需${action.id === 'signal' ? '信标' : '勘测工具'} · 早期 ${mission.earlyValue} ${unit} / 晚期 ${mission.lateValue}`);
    else if (action.reasonCode === 'insufficient-supplies') detail = bilingual(`Needs ${action.cost}; available ${state.supplies}`, `需要 ${action.cost} 补给，当前 ${state.supplies}`);
  } else if (state.modules.includes(action.moduleId) || (isBundle && state.modules.length)) detail = bilingual('Already built', '已经建成');
  else if (isBundle) detail = bilingual('Beacon + survey kit · one build action', '信标 + 勘测工具 · 一次建设');
  else detail = action.id === 'build:beacon' ? bilingual('Unlocks the rescue signal', '解锁发信号，接走滞留者') : bilingual('Unlocks route mapping', '解锁勘测，为后续队伍标路');
  if (!action.available && action.reasonCode === 'insufficient-supplies' && action.type === 'build') detail = bilingual(`Needs ${action.cost}; available ${state.supplies} before delivery`, `需要 ${action.cost} 补给；到账前只有 ${state.supplies}`);
  const tooltip = action.available ? detail : (language === 'zh' ? action.reasonZh : action.reason);
  const disabled = !action.available || playing;
  return `<button type="button" class="action-button ${isWait ? 'wait-action' : ''} ${isBundle ? 'wide' : ''}" data-version="${version}" data-action="${action.id}" ${disabled ? 'disabled' : ''} title="${escapeHtml(tooltip)}"><strong>${escapeHtml(name)}${!isWait ? `<span class="cost">−${action.cost}</span>` : ''}</strong><small>${escapeHtml(detail)}</small></button>`;
}
function renderMessage(version) {
  const state = states[version]; const config = configs[version];
  if (state.ended) {
    const result = evaluateGoal(config, state, goalId);
    return `<span class="message-highlight">${result.met ? bilingual('Assignment met.', '本局任务达成。') : bilingual('Assignment missed.', '本局任务未达成。')}</span> ${bilingual(`Same ${state.grossIncome} earned supplies; ${resultText(state)}.`, `同样到账 ${state.grossIncome} 补给，得到 ${resultText(state)}。`)}`;
  }
  const event = events[version];
  if (!event) return version === 'baseline'
    ? bilingual('Only waiting is affordable. The whole bundle must be paid for before building.', '当前只能等待。攒够整包费用后，才能开始建设。')
    : bilingual('Both modules are affordable. Choose which early opportunity to preserve.', '两个模块都买得起。先保住救援窗口，还是勘路窗口？');
  if (event.action === 'wait') return bilingual(`Turn ${event.turn}: waited; +${event.income} supplies arrived. Every legal action gets this same delivery.`, `第 ${event.turn} 回合：等待，到账 ${event.income} 补给。其他有效行动也会同样到账。`);
  if (event.metric) return bilingual(`Turn ${event.turn}: ${actionShort(event.action)} → ${event.missionValue} ${event.metric}. ${event.early ? 'The other early window now closes.' : 'The early window has passed.'}`, `第 ${event.turn} 回合：${actionShort(event.action)}，获得 ${event.missionValue} ${event.metric === 'people' ? '人' : '条路线'}。${event.early ? '另一项早期窗口随之关闭。' : '这次已错过早期窗口。'}`);
  return bilingual(`Turn ${event.turn}: ${actionShort(event.action)} built. Next, act before its opportunity passes.`, `第 ${event.turn} 回合：${actionShort(event.action)}完成。下一步，及时执行对应任务。`);
}
function renderDesign() {
  const config = configs.revised; const originalRun = runs.baseline[policy()]; const revisedRun = runs.revised[policy()];
  return `<div class="design-view"><div class="design-heading"><div><p class="section-label">${bilingual('The design judgment', '这次真正改变的策划判断')}</p><h3>${bilingual('Move the commitment earlier.\nKeep the consequence.','把投入决策提前，\n把取舍留下。').split('\n').map(escapeHtml).join('<br>')}</h3><p>${bilingual('The problem was the purchase threshold: players could afford neither function until the early opportunities had gone. More supplies would hide that problem.', '问题出在购买门槛：等到两项功能一起买得起时，早期机会已经过去。直接多发补给，会绕开这个问题。')}</p></div><div class="constraint-note"><strong>${bilingual('The supply constraint stays fixed', '补给约束完全保留')}</strong>${bilingual(`Start with ${config.initialSupplies}. Every valid action ends with +${config.incomePerTurn}; all sessions last ${config.turnLimit} turns. Both builds together still cost ${config.bundleCost}. People and routes are outcomes, not supply income.`, `初始 ${config.initialSupplies} 补给，每个有效行动结束到账 ${config.incomePerTurn}，统一运行 ${config.turnLimit} 回合。两项建设总价仍为 ${config.bundleCost}。人数与路线是任务成果，不是补给产出。`)}</div></div>
  <div class="design-cards"><article class="design-card"><span class="design-number">01</span><h4>${bilingual('Split the purchase, not the total price', '拆分购买，不降低总价')}</h4><p>${bilingual(`Replace one ${config.bundleCost}-supply purchase with ${config.moduleCosts.beacon} + ${config.moduleCosts['survey-kit']}. Each part has a usable function immediately. Full construction needs one extra action.`, `把 ${config.bundleCost} 补给的整包拆成 ${config.moduleCosts.beacon} + ${config.moduleCosts['survey-kit']}；每个模块都能立刻启用自己的功能。代价是完整建设多占一次行动。`)}</p></article><article class="design-card"><span class="design-number">02</span><h4>${bilingual('Make the first choice depend on the goal', '让第一步取决于本局目标')}</h4><p>${bilingual(`An early signal saves ${config.missions.signal.earlyValue} people. An early survey marks ${config.missions.survey.earlyValue} routes. A different assignment changes which opening is useful.`, `及时发信号可接走 ${config.missions.signal.earlyValue} 人，及时勘测可标记 ${config.missions.survey.earlyValue} 条路线。任务情境改变，值得优先投入的模块也随之改变。`)}</p></article><article class="design-card"><span class="design-number">03</span><h4>${bilingual('Explain the window before the click', '点击前说清机会窗口')}</h4><p>${bilingual(`The transport boat leaves and the tide rises after turn ${config.missions.signal.earlyThroughTurn}. You can preserve one early opportunity, not both. Later action still helps, but gives less.`, `第 ${config.missions.signal.earlyThroughTurn} 回合后接驳船离开、潮水上涨。只能保住一项早期机会。另一项后续仍可完成，但成果减少。`)}</p></article></div>
  <div class="choice-timeline"><div class="timeline-row"><span class="timeline-label">${bilingual('Before','修改前')}</span><div class="timeline-cells">${renderTimeline(originalRun)}</div></div><div class="timeline-row"><span class="timeline-label">${bilingual('After','修改后')}</span><div class="timeline-cells">${renderTimeline(revisedRun)}</div></div><p class="timeline-note">${bilingual('One executed policy for the selected goal. The revised version still waits in the middle; the early decision now changes the outcome.', '这是当前目标下一条实际执行路线。改版仍需在中段等待；改变的是开局就能作出影响结果的决策。')}</p></div></div>`;
}
function renderTimeline(run) {
  return run.trace.map(event => `<span class="timeline-cell ${event.action.startsWith('build:') ? 'choice' : event.early ? 'cost' : ''}">${bilingual('T','第 ')}${event.turn}${language === 'zh' ? ' 回合' : ''}<strong>${actionShort(event.action)}</strong></span>`).join('');
}
function renderVerify() {
  const config = configs.revised;
  const options = [
    {name:bilingual('Original bundle','原版整包'),run:runs.baseline[policy()],version:'baseline',note:bilingual('Same result under either goal','两种目标下结果相同')},
    {name:bilingual('Beacon first','改版：信标先行'),run:runs.revised['signal-first'],version:'revised',note:bilingual('Protect the rescue window','保住救援窗口')},
    {name:bilingual('Survey kit first','改版：工具先行'),run:runs.revised['survey-first'],version:'revised',note:bilingual('Protect the low-tide window','保住勘路窗口')},
  ];
  const matching = options.find(item => evaluateGoal(configs[item.version],item.run.finalState,goalId).met);
  const totalStates = analysis.baseline.reachableStates + analysis.revised.reachableStates;
  return `<div class="verify-view"><div class="verify-heading"><div><p class="section-label">${bilingual('Reproduced by the shared rules engine','共享规则引擎实际复算')}</p><h3>${bilingual('Same income.\nA different best opening.','同样的补给，\n不同目标下，第一步不同。').split('\n').map(escapeHtml).join('<br>')}</h3><p>${bilingual('Change the assignment below. The outcomes stay put; which route meets the goal changes.', '切换下面的任务情境。数值结果不会改变，但能达成任务的路线会改变。')}</p></div><div class="verified-seal"><strong>${totalStates}</strong><span>${bilingual('reachable states checked','个可达状态已枚举')}</span><small>${recordedEvidence.checks.filter(check => check.status === 'passed').length} / ${recordedEvidence.checks.length} ${bilingual('checks passed','项检查通过')}</small></div></div>
  <div class="verify-goal">${renderGoalControls()}<p>${escapeHtml(goal()[language === 'zh' ? 'descriptionZh' : 'description'])}</p></div>
  <table class="results-table"><thead><tr><th>${bilingual('Played route','实际执行路线')}</th><th>${bilingual('People','接走人数')}</th><th>${bilingual('Routes','标记路线')}</th><th>${bilingual('Earned / spent / left','到账 / 支出 / 余额')}</th><th class="fit-column">${bilingual('Assignment','本局任务')}</th></tr></thead><tbody>${options.map(item => {
    const state = item.run.finalState; const met = evaluateGoal(configs[item.version],state,goalId).met;
    return `<tr class="${met ? 'winner' : ''}"><td>${item.name}<small>${item.note}</small></td><td><strong>${state.people}</strong></td><td><strong>${state.routes}</strong></td><td>${state.grossIncome} / ${state.spent} / ${state.supplies}</td><td class="fit-column">${met ? `<span class="goal-fit">${bilingual('Meets goal','达成任务')}</span>` : bilingual('Does not meet goal','未达成任务')}</td></tr>`;
  }).join('')}</tbody></table>
  <div class="tradeoff-panel"><div class="tradeoff-item"><strong>${bilingual('The opening matters to this assignment','这一步为什么值得权衡')}</strong><p>${bilingual(`${matching.name} meets this assignment. The other modular opening loses the early opportunity it did not prepare for. No legal route gets both early rewards.`, `${matching.name}能达成本局任务。另一条模块路线会失去未准备的早期机会；所有合法路线中，没有一条能同时拿到两项早期成果。`)}</p></div><div class="tradeoff-item amber"><strong>${bilingual('What we accept in exchange','为这个改变接受什么代价')}</strong><p>${bilingual('One more build action. Two mid-session waits on these completed routes. More information to understand before the first click; a wrong opening cannot recover the early window.', '这些完整路线多一次建设操作，中段仍需等待两回合。玩家在第一步要理解更多信息；选错开局后，早期窗口无法追回。')}</p></div></div>
  <p class="verification-note">${bilingual(`Both full routes: initial ${config.initialSupplies} + income ${incomeBudget(config)} − spending ${runs.revised['signal-first'].summary.spent} = ${runs.revised['signal-first'].summary.balance} left. The search covers this fixed deterministic case; it does not establish enjoyment or player comprehension.`, `两条完整路线均为：初始 ${config.initialSupplies} + 到账 ${incomeBudget(config)} − 支出 ${runs.revised['signal-first'].summary.spent} = 余额 ${runs.revised['signal-first'].summary.balance}。枚举仅覆盖此固定确定性案例，不代表已经验证乐趣或玩家理解。`)} <a href="${repository}${casePath}evidence.md">${bilingual('Inspect reproducible evidence ↗','查看可复现证据 ↗')}</a></p></div>`;
}
function stopPlayback() { playing = false; if (timer !== null) clearTimeout(timer); timer = null; }
function resetGames() { states = Object.fromEntries(versions.map(version => [version,createState(configs[version])])); events = {}; }
function applyAction(version, actionId) {
  const result = step(configs[version], states[version], actionId);
  if (!result.ok) { $('#announcement').textContent = language === 'zh' ? result.error.messageZh : result.error.message; return; }
  states[version] = result.state; events[version] = result.event;
}
function playTick() {
  if (!playing) return;
  for (const version of versions) if (!states[version].ended) applyAction(version, chooseAction(configs[version],states[version],policy()));
  if (versions.every(version => states[version].ended)) stopPlayback();
  renderDemo();
  if (playing) timer = setTimeout(playTick, 1150);
}
function startPlayback() { stopPlayback(); resetGames(); playing = true; renderDemo(); timer = setTimeout(playTick, 650); }
function setView(nextView, focus = false) { stopPlayback(); view = nextView; renderDemo(); updateUrl(); if (focus) $(`#tab-${view}`).focus(); }
$('#camp-demo').addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button || button.disabled) return;
  if (button.dataset.view) { setView(button.dataset.view); return; }
  if (button.dataset.goal) { stopPlayback(); goalId = button.dataset.goal; renderDemo(); updateUrl(); return; }
  if (button.id === 'reset-games') { stopPlayback(); resetGames(); renderDemo(); return; }
  if (button.id === 'play-policy') { if (playing) { stopPlayback(); renderDemo(); } else startPlayback(); return; }
  if (button.dataset.action) { applyAction(button.dataset.version,button.dataset.action); renderDemo(); }
});
$('#camp-demo').addEventListener('keydown', event => {
  if (!event.target.matches('[data-view]') || !['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
  event.preventDefault(); const views = ['play','design','verify']; const index = views.indexOf(view);
  const target = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
  setView(views[target],true);
});
$('#language-select').addEventListener('change', event => { language = event.target.value; renderStatic(); renderDemo(); updateUrl(); });
$('#copy-command').addEventListener('click', async event => {
  const button = event.currentTarget;
  try { await navigator.clipboard.writeText($('#start-command').textContent); button.textContent = t('copied'); }
  catch { $('#announcement').textContent = t('copyFailed'); $('#start-command').focus(); }
});
window.addEventListener('pagehide', stopPlayback);
window.__campDemo = Object.freeze({
  getState: version => version ? structuredClone(states[version] ?? null) : structuredClone(states),
  getConfig: version => version ? structuredClone(configs[version] ?? null) : structuredClone(configs),
  getGoal: () => goalId, getView: () => view,
  getEvidence: () => structuredClone({analysis,runs,recorded:recordedEvidence}),
  isPlaying: () => playing,
});
async function initialize() {
  renderStatic();
  configs = Object.fromEntries(await Promise.all(versions.map(async version => {
    const response = await fetch(`./examples/signal-camp/${version}.json`);
    if (!response.ok) throw new Error(`Unable to load ${version} configuration.`);
    const config = await response.json(); validateConfig(config); return [version,config];
  })));
  for (const version of versions) {
    analysis[version] = analyze(configs[version]);
    runs[version] = Object.fromEntries(['signal-first','survey-first','bundle-first'].map(name=>[name,simulate(configs[version],{policy:name})]));
  }
  const evidenceResponse = await fetch(`./${casePath}evidence.json`);
  if (!evidenceResponse.ok) throw new Error('Unable to load the recorded case evidence.');
  recordedEvidence = await evidenceResponse.json();
  for (const version of versions) {
    if (JSON.stringify(recordedEvidence[version].config) !== JSON.stringify(configs[version])) throw new Error('The case evidence does not match its configuration.');
    for (const name of ['signal-first','survey-first','bundle-first']) {
      if (JSON.stringify(recordedEvidence[version].traces[name].finalState) !== JSON.stringify(runs[version][name].finalState)) throw new Error('The recorded outcome does not match the playable engine.');
    }
  }
  resetGames(); renderDemo(); updateUrl();
}
initialize().catch(error => { stopPlayback(); $('#camp-demo').innerHTML = `<p class="loading-panel error-panel">${escapeHtml(error.message)}</p>`; });
