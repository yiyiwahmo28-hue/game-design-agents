import { renderHarborScene } from './harbor-scene.mjs';

const repository = 'https://github.com/yiyiwahmo28-hue/game-design-agents/blob/main/';
const steps = ['brief', 'design', 'prototype', 'change', 'verify'];
const params = new URLSearchParams(location.search);
let language = params.get('lang') === 'zh' ? 'zh' : 'en';
let currentStep = steps.includes(params.get('step')) ? params.get('step') : 'brief';
let version = params.get('mode') === 'revised' ? 'revised' : 'baseline';
let engine = null;
let configs = {};
let state = null;
let evidence = null;
let run = null;
let playing = false;
let timer = null;
let policy = 'prepare-first';
let gameMessage = '';
let gameError = false;
const documents = new Map();
const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const texts = {
  en: {
    skip:'Skip to the workflow demo', language:'Language', eyebrow:'Your AI game design team',
    headline:'From one game brief to a playable prototype.\nChange the rules. Verify the result.',
    intro:'See a real completed workflow: rules, handoffs, a browser game, and a checked change. Run the team in your own assistant.',
    tryGame:'Play the prototype ↗', yourBrief:'Start with your own brief ↗', scenario:'Rain Harbor',
    scenarioNote:'An original, fictional brief · a real execution record', loadingRecord:'Loading execution record',
    briefTab:'The brief', designTab:'Design & handoff', prototypeTab:'Playable prototype', changeTab:'Change the brief', verifyTab:'Verify & deliver',
    completed:'Actual record · completed', pending:'Record not yet available', loading:'Loading the recorded workflow…',
    recordNote:'Completed work, not a live AI simulation. This page does not call a model.',
    startEyebrow:'Your brief is next', startTitle:'Bring one mechanic. Start a small loop.',
    startCopy:'Create a workspace, then give its prompt to your assistant. The prompt points to the Skill in this checkout; the command does not call a model.',
    startGuide:'Follow the start guide ↗', startCommand:'Run in a local repository checkout', copyCommand:'Copy command', copyPrompt:'Copy an assistant prompt',
    lanternLink:'Also play Lantern Expedition ↗', footerNote:'Actual artifacts and executable rules. Human playtesting is still a separate step.', workflowGuide:'Read the workflow ↗',
    recordedSummary:'Recorded summaries', actualRecord:'Real execution record', readBrief:'Open original brief ↗', readDesign:'Open design ↗', readImplementation:'Open implementation record ↗',
    readRevision:'Open revision ↗', readChange:'Open change request ↗', readEvidence:'Open evidence JSON ↗', readReview:'Open review ↗', readRun:'Open execution record ↗',
    briefTitle:'A choice the player can see.', briefSummary:'Rescue stranded boats before the storm closes the harbor. Prepare first, or help people immediately?',
    briefList:['One shared fuel resource.', 'Different boats, visible costs and passengers.', 'Impossible actions must not consume a turn.'],
    briefQuote:'“Make a small browser game about rescuing boats before a storm closes a harbor.”', briefQuoteLabel:'The original request · excerpt',
    requirementTitles:['Visible decisions','A short, repeatable loop','Observable boundaries'],
    requirementCopy:['Show cost and outcome before clicking.','A fixed turn budget, a deterministic world.','Explain rejected actions; show the final rescue result.'],
    designTitle:'Rules become a shared contract.', designSummary:'The design, editable parameters, browser, and checks refer to the same game. The execution record shows which responsibilities were combined.',
    designList:['A compact design, with explicit tradeoffs.', 'One executable rules module.', 'Actual handoffs, with files you can inspect.'],
    designFootnote:'These are coordinator summaries of actual work, not verbatim chats or five independently running agents.',
    prototypeTitle:'Play the delivered mechanic.', prototypeSummary:'Use the same executable rules as the verification. Every available action shows its fuel effect, passenger outcome, and turn cost.',
    prototypeList:['Try preparing before rescuing.', 'Compare attempts from the same starting state.', 'Rejected actions preserve the game state.'],
    sharedEngine:'Shared rules · src/harbor.mjs', before:'Original', after:'Revised', fuel:'Fuel', turns:'Turns left', rescued:'People rescued', preparation:'Preparation',
    yes:'Ready', no:'Not yet', refuel:'Refuel', prepare:'Prepare', rescue:'Rescue', undo:'Undo last action',
    fuelUnit:'fuel', peopleUnit:'people', turnUnit:'turn', prepareOutcome:'Next refuel', refuelOutcome:'Gain',
    reset:'Start over', watch:'Watch a strategy', pause:'Pause', ready:'Refuel, prepare, and rescue each advance the storm.',
    readyRevised:'Refuel, prepare, and rescue advance the storm. Undo restores the previous state.',
    undoAllowance:'Undo allowance', remaining:'left', undoLimit:'undo per run', restoration:'Restores fuel, people and boats, preparation, turns, and ending state.',
    undoPreserved:'The allowance stays spent. Original fuel values, boat costs, passengers, and turn budget are unchanged.',
    openHarbor:'Harbor open', quotaSpent:'Undo allowance spent', undoPerformed:'Undid', undoDelta:'Restore to', allChecks:'Show all checks',
    finished:'Harbor closed', allRescued:'All boats rescued', rescuedBoat:'Rescued', unavailable:'Unavailable', engineUnavailable:'The game engine is not available. Open the source files to inspect this step.',
    prepareFirst:'Prepare first', rescueFirst:'Rescue first', optimal:'Model optimum', policyLabel:'Strategy',
    strategyNote:'Deterministic strategy playback; not an AI or a human playtest.',
    reasons:{'harbor-closed':'The harbor is closed.','already-prepared':'Preparation is already complete.','already-rescued':'This boat has already been rescued.','insufficient-fuel':'Not enough fuel.','nothing-to-undo':'There is no successful action to undo.','undo-disabled':'Undo is disabled in this version.','undo-spent':'The undo allowance has been spent.'},
    changeTitle:'Change a rule. Trace its effects.', changeSummary:'Keep the original version. Follow the request through the design, shared engine, interface, and regression checks.',
    changeList:['The request is separate from the accepted revision.', 'Preserve unrelated rules.', 'Recheck affected boundaries and failure cases.'],
    changePending:'The actual change record is not available yet.', requestLabel:'Follow-up request · summary', changesLabel:'Updated artifacts',
    verifyTitle:'Deliver evidence you can inspect.', verifySummary:'Checks come from the evidence file; browser observations are linked in the review. A working mechanic still needs human playtesting to support the experience hypothesis.',
    verifyList:['Named checks and retained outputs.', 'Runtime behavior, not just written rules.', 'Limits are kept alongside the results.'],
    evidencePending:'The evidence file is not available yet.', passed:'Passed', failed:'Failed', recorded:'Recorded', notRun:'Not run',
    evidenceLabel:'Evidence loaded from evidence.json', evidenceLimit:'A deterministic model and browser checks do not establish that players understand the choice or enjoy the game.',
    copied:'Copied', copyFailed:'Copy unavailable. Select the text below.', previous:'Previous step', next:'Next step',
  },
  zh: {
    skip:'跳转到工作流演示', language:'语言', eyebrow:'你的 AI 游戏设计团队',
    headline:'从一句玩法需求，到可玩的原型。\n改需求后，同步验证。',
    intro:'看一次真实完成的流程：明确规则、交接文件、试玩原型，再验证改动。团队在你自己的助手中运行。',
    tryGame:'试玩原型 ↗', yourBrief:'用自己的需求开始 ↗', scenario:'雨港救援', scenarioNote:'原创虚构需求 · 真实执行记录', loadingRecord:'正在载入执行记录',
    briefTab:'需求', designTab:'设计与交接', prototypeTab:'可玩原型', changeTab:'修改需求', verifyTab:'验证交付',
    completed:'真实执行记录 · 已完成', pending:'记录尚未载入', loading:'正在载入真实工作流记录…',
    recordNote:'展示已完成的真实工作，不模拟实时 AI。本页不调用模型。',
    startEyebrow:'接下来，试你的需求', startTitle:'带来一个玩法，从一个小闭环开始。',
    startCopy:'先创建工作区，再把生成的提示交给助手。提示会指向仓库内的 Skill；启动命令不会调用模型。',
    startGuide:'查看开始指南 ↗', startCommand:'在本地仓库副本中运行', copyCommand:'复制命令', copyPrompt:'复制助手提示',
    lanternLink:'也可试玩灯塔远征 ↗', footerNote:'真实产物与可执行规则。玩家体验仍需单独进行人工试玩。', workflowGuide:'查看工作流说明 ↗',
    recordedSummary:'已记录的工作摘要', actualRecord:'真实执行记录', readBrief:'打开原始需求 ↗', readDesign:'打开设计文档 ↗', readImplementation:'打开实现记录 ↗',
    readRevision:'打开改稿记录 ↗', readChange:'打开修改需求 ↗', readEvidence:'打开验证证据 JSON ↗', readReview:'打开审查记录 ↗', readRun:'打开执行记录 ↗',
    briefTitle:'让玩家看见自己的选择。', briefSummary:'在暴风雨封港前，救出滞留船只。先准备救援艇，还是立即救人？',
    briefList:['共享一种燃油资源。','船只的燃油成本、乘客人数不同。','不可执行的动作不能消耗回合。'],
    briefQuote:'“做一个小型浏览器游戏，在暴风雨封港前救出滞留的船只。”', briefQuoteLabel:'原始需求 · 节选译文',
    requirementTitles:['选择可见','短小、可重复的流程','结果与边界可观察'], requirementCopy:['点击前展示成本和结果。','固定回合预算，确定性的世界。','解释失败原因，并展示最终救援结果。'],
    designTitle:'把规则变成共用的契约。', designSummary:'设计、可编辑参数、浏览器与检查采用同一套规则。执行记录保留了真实分工，以及哪些职责由同一个代理承担。',
    designList:['精简设计，写明取舍。','一个可执行的规则模块。','真实交接，能打开对应文件。'], designFootnote:'这里是协调者对真实工作的摘要，不是聊天逐字稿，也没有虚构五个独立运行的代理。',
    prototypeTitle:'亲手玩一轮交付的玩法。', prototypeSummary:'试玩与验证使用同一个规则模块。每个可执行动作都提前展示燃油变化、获救人数与回合成本。',
    prototypeList:['试试先准备，再救人。','从相同初始状态比较不同尝试。','失败动作保持游戏状态不变。'],
    sharedEngine:'共用规则 · src/harbor.mjs', before:'原始版本', after:'修改版本', fuel:'燃油', turns:'剩余回合', rescued:'获救人数', preparation:'准备状态',
    yes:'已就绪', no:'未准备', refuel:'补给燃油', prepare:'准备救援艇', rescue:'救援', undo:'撤销上一步', fuelUnit:'燃油', peopleUnit:'人', turnUnit:'回合', prepareOutcome:'下次补给', refuelOutcome:'获得',
    reset:'重新开始', watch:'播放策略', pause:'暂停', ready:'补给、准备和救援会推进暴风雨。', readyRevised:'补给、准备和救援推进风暴；撤销恢复上一步。', finished:'港口关闭', allRescued:'全部船只已救援', rescuedBoat:'已救援', unavailable:'不可执行',
    undoAllowance:'撤销额度', remaining:'次剩余', undoLimit:'次撤销 / 局', restoration:'恢复燃油、获救人数和船只、准备、回合与终局状态。',
    undoPreserved:'撤销额度保持已用。原燃油参数、船只成本、乘客人数和回合预算不变。',
    openHarbor:'港口开放', quotaSpent:'撤销额度已用完', undoPerformed:'已撤销', undoDelta:'恢复为', allChecks:'查看全部检查项',
    engineUnavailable:'游戏引擎尚未载入。可以打开源文件查看此步骤。', prepareFirst:'先准备', rescueFirst:'先救人', optimal:'模型最优', policyLabel:'策略', strategyNote:'确定性策略回放；不是 AI 决策或人工试玩。',
    reasons:{'harbor-closed':'港口已关闭。','already-prepared':'已经完成准备。','already-rescued':'这艘船已经获救。','insufficient-fuel':'燃油不足。','nothing-to-undo':'还没有可撤销的成功操作。','undo-disabled':'原始版本未启用撤销。','undo-spent':'本局撤销额度已用完。'},
    changeTitle:'改一条规则，同步相关内容。', changeSummary:'保留原始版本。跟随真实修改需求，查看设计、共享引擎、界面和回归检查如何同步。',
    changeList:['把修改需求与确认后的改稿分开。','保留与修改无关的规则。','重新检查受影响的边界和失败场景。'],
    changePending:'真实改稿记录尚未载入。', requestLabel:'后续修改需求 · 摘要', changesLabel:'同步更新的产物',
    verifyTitle:'交付能打开查看的验证证据。', verifySummary:'检查项读取自证据文件，浏览器观察保留在审查记录。玩法能够运行，仍不能替代对玩家理解和体验的人工试玩。',
    verifyList:['明确检查项，保留实际输出。','检查运行行为，而不只看文档。','结果与尚未验证的部分一起交付。'], evidencePending:'验证证据文件尚未载入。',
    passed:'通过', failed:'失败', recorded:'已记录', notRun:'未执行', evidenceLabel:'内容读取自 evidence.json', evidenceLimit:'确定性模型与浏览器检查不能证明玩家理解了取舍，也不能证明游戏好玩。',
    copied:'已复制', copyFailed:'无法自动复制，请选择下方文字。', previous:'上一步', next:'下一步',
  },
};
const t = key => texts[language][key] ?? key;
const sourceLink = (path, label) => `<a href="${escapeHtml(repository + path)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
const getConfig = () => configs[version] || configs.baseline;
const readyMessage = () => t((getConfig()?.undoLimit ?? 0) > 0 ? 'readyRevised' : 'ready');
const recordPath = file => `docs/runs/rain-harbor/${file}`;
const boatName = boat => language === 'zh' ? ({dinghy:'小艇',skiff:'轻舟',trawler:'拖网船',ferry:'渡船'}[boat.id] || boat.name) : boat.name;
const roleName = role => language === 'zh' ? ({
  'Coordinator':'协调者',
  'Systems / economy / core delegate':'系统 / 数值 / 核心实现助手',
  'Browser interface delegate':'浏览器界面助手',
  'Core and interface delegates':'核心与界面助手',
  'Independent reviewer':'独立审查助手',
}[role] || role) : role;

function updateUrl() {
  const url = new URL(location.href);
  url.searchParams.set('lang', language);
  url.searchParams.set('step', currentStep);
  if (version === 'revised') url.searchParams.set('mode', 'revised');
  else url.searchParams.delete('mode');
  history.replaceState(null, '', url);
}

function announce(message) { $('#announcement').textContent = message; }

function completionFor(step) {
  if (step === 'brief') return documents.has('brief.md') && Boolean(run);
  if (step === 'design') return documents.has('design.md') && Boolean(configs.baseline);
  if (step === 'prototype') return documents.has('implementation.md') && Boolean(engine);
  if (step === 'change') return documents.has('revision.md') && Boolean(configs.revised);
  return Boolean(evidence?.revised) && Array.isArray(evidence?.checks) && evidence.checks.length > 0
    && evidence.checks.every(check => check.status === 'passed') && documents.has('review.md');
}

function renderLanguage() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.title = language === 'zh' ? 'Game Design Agents · 从需求到可玩原型' : 'Game Design Agents · From brief to playable';
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.dataset.i18n;
    if (key === 'headline') element.innerHTML = t(key).split('\n').map(escapeHtml).join('<br>');
    else element.textContent = t(key);
  });
  $('#language-select').value = language;
  $('#step-nav').setAttribute('aria-label', language === 'zh' ? '工作流步骤' : 'Workflow steps');
  $('#previous-step').setAttribute('aria-label', t('previous'));
  $('#next-step').setAttribute('aria-label', t('next'));
  const startGuide = repository + `docs/start-your-game${language === 'zh' ? '.zh-CN' : ''}.md`;
  $('#start-top').href = startGuide;
  $('#start-guide').href = startGuide;
  $('#workflow-docs').href = repository + `docs/workflow${language === 'zh' ? '.zh-CN' : ''}.md`;
  $('#lantern-link').href = `./lantern.html${language === 'zh' ? '?lang=zh' : ''}`;
  $('#try-button').href = `?lang=${language}&step=prototype#workflow-demo`;
  $('#start-command').textContent = language === 'zh'
    ? 'npm run new -- --name my-game --brief "做一个有准备取舍的小型救援游戏" --lang zh'
    : 'npm run new -- --name my-game --brief "Make a small rescue game with a preparation choice" --lang en';
  $('#record-badge').textContent = run ? t('actualRecord') : t('loadingRecord');
  document.querySelectorAll('[data-record-status]').forEach(element => {
    element.textContent = completionFor(element.closest('[data-step]').dataset.step) ? t('completed') : t('pending');
  });
  renderStage();
}

function stageShell(content) {
  const number = steps.indexOf(currentStep) + 1;
  const links = {
    brief:[['brief.md','readBrief'],['run.json','readRun']],
    design:[['design.md','readDesign'],['run.json','readRun']],
    prototype:[['implementation.md','readImplementation']],
    change:[['change-request.md','readChange'],['revision.md','readRevision']],
    verify:[['evidence.json','readEvidence'],['review.md','readReview']],
  }[currentStep];
  return `<div class="stage ${currentStep === 'prototype' ? 'prototype-stage' : ''}">
    <aside class="stage-context"><span class="stage-counter">0${number} / 05 · ${escapeHtml(t('recordedSummary'))}</span>
      <h3>${escapeHtml(t(`${currentStep}Title`))}</h3><p class="stage-summary">${escapeHtml(t(`${currentStep}Summary`))}</p>
      <ul class="context-list">${t(`${currentStep}List`).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      <div class="artifact-links">${links.map(([file, key]) => sourceLink(recordPath(file), t(key))).join('')}</div>
    </aside><div class="stage-main">${content}</div></div>`;
}

function briefContent() {
  return `<div class="quote-card"><span class="small-label">${escapeHtml(t('briefQuoteLabel'))}</span><blockquote>${escapeHtml(t('briefQuote'))}</blockquote></div>
    <div class="requirements">${t('requirementTitles').map((title,index) => `<div class="requirement"><span aria-hidden="true">${['↗','◷','↳'][index]}</span><strong>${escapeHtml(title)}</strong><p>${escapeHtml(t('requirementCopy')[index])}</p></div>`).join('')}</div>
    <div class="scene-preview">${renderHarborScene({boats:configs.baseline?.boats || [], language})}</div>`;
}

function designContent() {
  const handoffs = run?.handoffs || [];
  if (!handoffs.length) return `<p class="loading-panel">${escapeHtml(t('pending'))}</p>`;
  return `<div class="handoff-path">${handoffs.map((handoff,index) => {
    const summary = language === 'zh' ? handoff.summaryZh || handoff.summary : handoff.summary;
    const path = handoff.artifacts?.[0];
    const from = language === 'zh' ? handoff.fromZh || roleName(handoff.from) : handoff.from;
    const to = language === 'zh' ? handoff.toZh || roleName(handoff.to) : handoff.to;
    return `<div class="handoff-item"><span class="number">0${index + 1}</span><div><strong>${escapeHtml(from)} → ${escapeHtml(to)}</strong><p>${escapeHtml(summary)}</p></div>${path ? sourceLink(path, path.split('/').at(-1) + ' ↗') : ''}</div>`;
  }).join('')}</div><p class="record-note">${escapeHtml(t('designFootnote'))}</p>`;
}

function prototypeContent() {
  if (!engine || !getConfig() || !state) return `<p class="loading-panel error-panel">${escapeHtml(t('engineUnavailable'))}</p>`;
  return `<div class="game-header"><span>${escapeHtml(t('sharedEngine'))}</span><div class="version-select" aria-label="${escapeHtml(language === 'zh' ? '规则版本' : 'Rule version')}"><button type="button" data-version="baseline" aria-pressed="${version === 'baseline'}">${escapeHtml(t('before'))}</button><button type="button" data-version="revised" aria-pressed="${version === 'revised'}" ${!configs.revised ? 'disabled' : ''}>${escapeHtml(t('after'))}</button></div></div>
    <div id="harbor-scene" class="game-scene"></div>
    <div class="game-stats"><div class="game-stat"><span>${escapeHtml(t('fuel'))}</span><strong id="fuel-value">—</strong></div><div class="game-stat"><span>${escapeHtml(t('turns'))}</span><strong id="turns-value">—</strong></div><div class="game-stat"><span>${escapeHtml(t('rescued'))}</span><strong id="rescued-value">—</strong></div><div class="game-stat"><span>${escapeHtml(t('preparation'))}</span><strong id="prepared-value">—</strong></div></div>
    <div id="game-actions" class="game-actions"></div><div id="rescue-actions" class="rescue-grid"></div><div id="undo-actions" class="undo-row"></div>
    <div class="storm-track" role="progressbar" aria-label="${escapeHtml(language === 'zh' ? '暴风雨进度' : 'Storm progress')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="storm-progress"><span id="storm-fill"></span></div>
    <div class="game-controls"><button type="button" id="autoplay-button">▶ ${escapeHtml(t('watch'))}</button><label><span class="sr-only">${escapeHtml(t('policyLabel'))}</span><select id="policy-select" class="language-select"><option value="prepare-first">${escapeHtml(t('prepareFirst'))}</option><option value="rescue-first">${escapeHtml(t('rescueFirst'))}</option><option value="optimal">${escapeHtml(t('optimal'))}</option></select></label><button type="button" id="reset-button">↺ ${escapeHtml(t('reset'))}</button></div>
    <p id="game-message" class="game-message"></p><p class="record-note">${escapeHtml(t('strategyNote'))}</p>`;
}

function changeContent() {
  if (!documents.has('revision.md') || !configs.revised) return `<p class="loading-panel">${escapeHtml(t('changePending'))}</p>`;
  const event = (run?.events || []).find(item => item.type === 'revision-requested');
  const summary = event ? (language === 'zh' ? event.summaryZh || event.summary : event.summary) : t('changeSummary');
  return `<div class="change-request"><span class="small-label">${escapeHtml(t('requestLabel'))}</span><p>${escapeHtml(summary)}</p></div>
    <div class="rule-compare"><div class="rule-version"><span class="small-label">${escapeHtml(t('before'))}</span><strong>${configs.baseline.undoLimit ?? 0} ${escapeHtml(t('undoLimit'))}</strong><p>${escapeHtml(language === 'zh' ? '保留改动前的可玩版本。' : 'The original playable version is preserved.')}</p>${sourceLink('examples/rain-harbor/baseline.json', 'baseline.json ↗')}</div><div class="rule-version after"><span class="small-label">${escapeHtml(t('after'))}</span><strong>${configs.revised.undoLimit ?? 0} ${escapeHtml(t('undoLimit'))}</strong><p>${escapeHtml(t('restoration'))}</p>${sourceLink('examples/rain-harbor/revised.json', 'revised.json ↗')}</div></div>
    <span class="small-label">${escapeHtml(t('changesLabel'))}</span><div class="dependency-list"><span>revision.md</span><span>revised.json</span><span>harbor.mjs</span><span>workflow.mjs</span><span>evidence.json</span></div><p class="record-note">${escapeHtml(t('undoPreserved'))}</p>`;
}

function evidenceRows() {
  if (!evidence) return [];
  const rows = Array.isArray(evidence.checks) ? evidence.checks : [];
  return rows.map(row => ({
    name:language === 'zh' ? row.nameZh || row.name || row.label || row.id : row.name || row.label || row.id,
    detail:language === 'zh'
      ? row.descriptionZh || row.command || row.source || row.id || ''
      : row.command || row.source || row.description || row.id || '',
    status:row.status || (row.passed === true ? 'passed' : row.passed === false ? 'failed' : 'recorded'),
  }));
}

function verifyContent() {
  if (!evidence) return `<p class="loading-panel">${escapeHtml(t('evidencePending'))}</p>`;
  const rows = evidenceRows();
  const passed = rows.filter(row => ['passed','pass'].includes(row.status)).length;
  const summary = rows.length ? `${passed} / ${rows.length} ${t('passed')}` : t('recorded');
  const rowHtml = row => `<div class="evidence-item"><div><strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.detail)}</small></div><span class="evidence-status">${escapeHtml(['passed','pass'].includes(row.status) ? t('passed') : ['failed','fail'].includes(row.status) ? t('failed') : row.status === 'not-run' ? t('notRun') : t('recorded'))}</span></div>`;
  return `<div class="evidence-summary"><span class="check" aria-hidden="true">${rows.some(row => ['failed','fail'].includes(row.status)) ? '!' : rows.length && passed === rows.length ? '✓' : '↗'}</span><div><strong>${escapeHtml(summary)}</strong><p>${escapeHtml(t('evidenceLabel'))}</p></div></div>
    <div class="evidence-list">${rows.slice(0,6).map(rowHtml).join('')}</div>${rows.length > 6 ? `<details class="extra-checks"><summary>${escapeHtml(t('allChecks'))} (${rows.length})</summary><div class="evidence-list">${rows.slice(6).map(rowHtml).join('')}</div></details>` : ''}<p class="evidence-limit">${escapeHtml(t('evidenceLimit'))}</p>`;
}

function renderStage() {
  const renderers = {brief:briefContent, design:designContent, prototype:prototypeContent, change:changeContent, verify:verifyContent};
  $('#workflow-stage').innerHTML = stageShell(renderers[currentStep]());
  $('#workflow-stage').setAttribute('aria-labelledby', `tab-${currentStep}`);
  document.querySelectorAll('[data-step]').forEach(button => {
    const active = button.dataset.step === currentStep;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  $('#previous-step').disabled = currentStep === steps[0];
  $('#next-step').disabled = currentStep === steps.at(-1);
  if (currentStep === 'prototype' && state) { bindGameControls(); renderGame(); }
}

function renderGame() {
  if (currentStep !== 'prototype' || !state || !engine) return;
  const focusedAction = document.activeElement?.dataset?.action;
  const config = getConfig();
  const actions = engine.getActions(config, state);
  const percent = Math.round(state.turn / config.turnLimit * 100);
  $('#harbor-scene').innerHTML = renderHarborScene({boats:config.boats.map(boat => ({...boat,nameZh:boatName(boat)})),rescuedIds:state.rescuedIds,prepared:state.prepared,stormProgress:percent/100,language});
  $('#fuel-value').textContent = state.fuel;
  $('#turns-value').textContent = Math.max(0, config.turnLimit - state.turn);
  $('#rescued-value').textContent = state.rescuedPeople;
  $('#prepared-value').textContent = t(state.prepared ? 'yes' : 'no');
  $('#storm-fill').style.width = `${percent}%`;
  $('#storm-progress').setAttribute('aria-valuenow', String(percent));
  $('#game-actions').innerHTML = actions.filter(action => ['prepare','refuel'].includes(action.type)).map(action => {
    const effect = action.type === 'prepare' ? `${t('prepareOutcome')} +${action.nextRefuelAmount} ${t('fuelUnit')}` : `${t('refuelOutcome')} +${action.gain} ${t('fuelUnit')}`;
    const reason = action.reasonCode ? t('reasons')[action.reasonCode] || action.reason : '';
    return `<button type="button" class="game-action" data-action="${escapeHtml(action.id)}" ${!action.available || playing ? 'disabled' : ''} title="${escapeHtml(reason || '')}"><span class="icon" aria-hidden="true">${action.type === 'prepare' ? '↑' : action.type === 'undo' ? '↶' : '+'}</span><strong>${escapeHtml(t(action.type))}</strong><small>${!action.available && reason ? escapeHtml(reason) : `${action.cost ? `${action.cost} ${t('fuelUnit')} · ` : ''}${escapeHtml(effect)} · ${action.turnCost} ${t('turnUnit')}`}</small></button>`;
  }).join('');
  const undo = actions.find(action => action.type === 'undo');
  if ((config.undoLimit ?? 0) > 0 && undo) {
    const reason = t('reasons')[undo.reasonCode] || undo.reason || '';
    const restored = undo.restores;
    const preview = restored ? restoreDescription(restored) : reason;
    $('#undo-actions').innerHTML = `<button type="button" class="game-action undo-button" data-action="undo" ${!undo.available || playing ? 'disabled' : ''}><span class="icon" aria-hidden="true">↶</span><strong>${escapeHtml(t('undo'))}<span class="undo-quota">${state.undoRemaining} ${escapeHtml(t('remaining'))}</span></strong><small>${escapeHtml(preview)}</small></button>`;
  } else $('#undo-actions').innerHTML = '';
  $('#rescue-actions').innerHTML = actions.filter(action => action.type === 'rescue').map(action => {
    const boat = config.boats.find(item => item.id === action.boatId);
    const rescued = state.rescuedIds.includes(action.boatId);
    const reason = action.reasonCode ? t('reasons')[action.reasonCode] || action.reason : '';
    return `<button type="button" class="rescue-button" data-action="${escapeHtml(action.id)}" ${!action.available || playing ? 'disabled' : ''} title="${escapeHtml(reason || '')}"><span><strong>${escapeHtml(boatName(boat))}</strong><small>${action.cost} ${t('fuelUnit')} → ${action.people} ${t('peopleUnit')} · ${action.turnCost} ${t('turnUnit')}</small></span><span class="boat-status">${escapeHtml(rescued ? t('rescuedBoat') : action.available ? t('rescue') + ' ↗' : reason || t('unavailable'))}</span></button>`;
  }).join('');
  $('#game-message').textContent = gameMessage || (state.ended ? `${t(state.endReason === 'all-rescued' ? 'allRescued' : 'finished')} · ${state.rescuedPeople} ${t('peopleUnit')}` : readyMessage());
  $('#game-message').classList.toggle('is-error', gameError);
  $('#autoplay-button').textContent = `${playing ? 'Ⅱ' : '▶'} ${t(playing ? 'pause' : 'watch')}`;
  $('#autoplay-button').disabled = state.ended && !playing;
  $('#policy-select').value = policy;
  if (focusedAction) {
    const replacement = [...document.querySelectorAll('[data-action]')].find(button => button.dataset.action === focusedAction && !button.disabled);
    (replacement || $('#game-actions button:not(:disabled)') || $('#reset-button')).focus({preventScroll:true});
  }
}

function restoreDescription(restored) {
  const config = getConfig();
  return `${t('undoDelta')} ${t('fuel')}: ${restored.fuel} · ${t('rescued')}: ${restored.rescuedPeople} · ${t('turns')}: ${config.turnLimit - restored.turn} · ${t('preparation')}: ${t(restored.prepared ? 'yes' : 'no')} · ${t(restored.ended ? 'finished' : 'openHarbor')}`;
}

function stopPlayback() { clearTimeout(timer); timer = null; playing = false; }

function act(actionId, automatic = false) {
  if (!engine || !state) return;
  const result = engine.step(getConfig(), state, actionId);
  if (result.ok) {
    state = result.state;
    gameError = false;
    const event = result.event;
    const boat = getConfig().boats.find(item => item.id === event.boatId);
    gameMessage = event.type === 'undo'
      ? `${t('undoPerformed')} · ${restoreDescription(event.restored)} · ${t('quotaSpent')}`
      : event.type === 'rescue' ? `${t('rescue')} ${boatName(boat)} · +${event.people} ${t('peopleUnit')}` : `${t(event.type)} · ${state.fuel} ${t('fuelUnit')}`;
    if (state.ended) { stopPlayback(); gameMessage = `${t(state.endReason === 'all-rescued' ? 'allRescued' : 'finished')} · ${state.rescuedPeople} ${t('peopleUnit')}`; }
  } else {
    gameError = true;
    gameMessage = t('reasons')[result.error.code] || result.error.message;
  }
  renderGame();
  if (!automatic || state.ended) announce(gameMessage);
}

function autoplayTick() {
  if (!playing || currentStep !== 'prototype' || state?.ended) { stopPlayback(); renderGame(); return; }
  const action = engine.chooseAction(getConfig(), state, policy);
  if (!action) { stopPlayback(); renderGame(); return; }
  act(action, true);
  if (playing) timer = setTimeout(autoplayTick, 650);
}

function resetGame() {
  stopPlayback();
  if (!engine || !getConfig()) return;
  state = engine.createState(getConfig());
  gameMessage = ''; gameError = false;
  renderGame();
}

function bindGameControls() {
  $('#policy-select').value = policy;
  $('#policy-select').addEventListener('change', event => { policy = event.target.value; stopPlayback(); renderGame(); });
  $('#reset-button').addEventListener('click', () => { resetGame(); announce(readyMessage()); });
  $('#autoplay-button').addEventListener('click', () => {
    if (playing) { stopPlayback(); renderGame(); }
    else { playing = true; renderGame(); timer = setTimeout(autoplayTick, 350); }
  });
  document.querySelectorAll('[data-version]').forEach(button => button.addEventListener('click', () => {
    stopPlayback(); version = button.dataset.version; resetGame(); updateUrl(); renderStage(); announce(t(version === 'baseline' ? 'before' : 'after'));
  }));
}

function selectStep(step, moveFocus = false) {
  if (!steps.includes(step)) return;
  stopPlayback(); currentStep = step; updateUrl(); renderStage();
  if (moveFocus) $(`#tab-${step}`).focus();
}

async function copyText(text, button) {
  let success = false;
  try { await navigator.clipboard.writeText(text); success = true; }
  catch {
    const field = document.createElement('textarea');
    field.value = text; field.setAttribute('readonly',''); field.className = 'sr-only';
    document.body.append(field); field.select();
    try { success = document.execCommand('copy'); } catch { success = false; }
    field.remove();
  }
  announce(t(success ? 'copied' : 'copyFailed'));
  if (success) { const original = button.textContent; button.textContent = t('copied'); setTimeout(() => { if (button.isConnected) button.textContent = button.dataset.i18n ? t(button.dataset.i18n) : original; }, 1400); }
}

async function loadJson(path) {
  const response = await fetch(new URL(`../${path}`, import.meta.url));
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}

async function initialize() {
  renderLanguage();
  const results = await Promise.allSettled([
    import('../src/harbor.mjs'),
    loadJson('examples/rain-harbor/baseline.json'),
    loadJson('examples/rain-harbor/revised.json'),
    loadJson(recordPath('evidence.json')),
    loadJson(recordPath('run.json')),
    ...['brief.md','design.md','implementation.md','change-request.md','revision.md','review.md'].map(async file => {
      const response = await fetch(new URL(`../${recordPath(file)}`,import.meta.url));
      if (!response.ok) throw new Error(`${file}: ${response.status}`);
      documents.set(file, await response.text());
    }),
  ]);
  if (results[0].status === 'fulfilled') engine = results[0].value;
  if (results[1].status === 'fulfilled') configs.baseline = results[1].value;
  if (results[2].status === 'fulfilled') configs.revised = results[2].value;
  if (results[3].status === 'fulfilled') evidence = results[3].value;
  if (results[4].status === 'fulfilled') run = results[4].value;
  if (!configs[version]) version = 'baseline';
  if (engine && getConfig()) { engine.validateConfig(getConfig()); state = engine.createState(getConfig()); }
  renderLanguage();
  if (params.get('autoplay') === '1' && currentStep === 'prototype' && state) { playing = true; renderGame(); timer = setTimeout(autoplayTick, 650); }
}

$('#language-select').addEventListener('change', event => { language = event.target.value; gameMessage = ''; gameError = false; updateUrl(); renderLanguage(); });
$('#step-nav').addEventListener('click', event => { const button = event.target.closest('[data-step]'); if (button) selectStep(button.dataset.step); });
$('#step-nav').addEventListener('keydown', event => {
  const button = event.target.closest('[data-step]');
  if (!button || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault();
  const index = steps.indexOf(button.dataset.step);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? steps.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + steps.length) % steps.length;
  selectStep(steps[next], true);
});
$('#previous-step').addEventListener('click', () => selectStep(steps[Math.max(0,steps.indexOf(currentStep)-1)]));
$('#next-step').addEventListener('click', () => selectStep(steps[Math.min(steps.length-1,steps.indexOf(currentStep)+1)]));
$('#try-button').addEventListener('click', event => { event.preventDefault(); selectStep('prototype'); $('#workflow-demo').scrollIntoView({behavior:'auto',block:'start'}); });
$('#workflow-stage').addEventListener('click', event => { const button = event.target.closest('[data-action]'); if (button && !button.disabled) { stopPlayback(); act(button.dataset.action); } });
$('#copy-command').addEventListener('click', event => copyText($('#start-command').textContent, event.currentTarget));
$('#copy-prompt').addEventListener('click', event => copyText(language === 'zh'
  ? '读取当前仓库 runs/my-game/START_HERE.md，并按照其中指向的 game-design-team Skill 和真实需求开始工作。先明确规则、取舍与未决问题，再实现可玩的原型。保留真实分工、执行检查与未验证部分的记录。不要把模型结果说成人工试玩。'
  : 'Read runs/my-game/START_HERE.md in this checkout. Follow its game-design-team Skill instructions and actual brief. Make rules, tradeoffs, and unresolved decisions explicit, then implement the playable prototype. Retain actual delegation, executed checks, and unverified limitations. Do not present model results as a human playtest.', event.currentTarget));
window.addEventListener('pagehide', stopPlayback);
window.__gameDesignWorkflow = Object.freeze({
  getState:() => state ? structuredClone(state) : null,
  getConfig:() => getConfig() ? structuredClone(getConfig()) : null,
  getStep:() => currentStep,
  getEvidence:() => evidence ? structuredClone(evidence) : null,
  getRun:() => run ? structuredClone(run) : null,
  isPlaying:() => playing,
});
initialize().catch(error => {
  stopPlayback(); $('#workflow-stage').innerHTML = `<p class="loading-panel error-panel">${escapeHtml(error.message)}</p>`;
});
