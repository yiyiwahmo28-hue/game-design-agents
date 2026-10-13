# Signal Camp: the same resources, an earlier consequential choice

[Play both versions](https://yiyiwahmo28-hue.github.io/game-design-agents/)
· [中文试玩](https://yiyiwahmo28-hue.github.io/game-design-agents/?lang=zh)

The request is a design constraint: **keep total production unchanged while
turning early waiting into a meaningful choice**. This original fictional case
isolates that problem. It is not evidence from a commercial project or a claim
that players have already preferred the revision.

## The diagnosis

The original sells a beacon and survey tools as a six-supply bundle. With three
starting supplies and one delivery after each turn, the player can only wait
for the first three turns. Construction first becomes possible on turn four.
By then, the transport boat and the shallow-route survey window have closed.

The blocker is the **all-or-nothing purchase gate**. Its simple construction
menu defers all usable functionality until the whole package is affordable.
Calling turn four a meaningful choice would overstate the original: it offers
one construction option, and swapping the two late missions has the same final
outcome.

## What stays fixed

| Quantity | Both versions |
| --- | --- |
| Comparison horizon | Six game turns; no early session termination |
| Starting stock | 3 supplies |
| Production | +1 after every accepted turn; 6 produced in total |
| Available budget including starting stock | 9 supplies |
| Both facilities | 6 supplies in total |
| Each of two one-time missions | 1 supply |
| Mission rules and known early window | Unchanged |

At each turn: **starting stock + cumulative production = cumulative spending +
remaining supplies**. People evacuated and routes mapped are separate mission
outcomes. Neither can be spent or converted into supplies.

## The design decision

Offer each functional module for three supplies, retaining the bundle. A
module immediately makes its own mission available. The first allocation
therefore decides which mission can use the early window on turn two.

| Alternative considered | Why it was not selected |
| --- | --- |
| Grant extra supplies | Violates the requested production constraint |
| Move future deliveries earlier | Could preserve the total, but changes cash flow and obscures which design change created the opportunity |
| Discount the complete bundle | Could preserve production, but also removes resource cost; it does not isolate access order |
| Allow a partial payment with no functional benefit | Adds an input before the wait, without creating a different reachable consequence |
| Sell usable modules separately | Preserves prices and arrival schedule while changing the order of functional access |

This is a task-specific choice. Discounts, front-loaded income or a simpler
single path could be appropriate under a different brief.

## Two objectives, two different first allocations

The objective is disclosed before the player starts. One assignment calls for
evacuating six people and leaving at least one route; the other calls for
mapping three routes and evacuating at least two people. There is no hidden
weighted score that silently changes which result counts as better.

| Complete modeled route | First two turns | People | Routes | Produced / spent / left |
| --- | --- | ---: | ---: | --- |
| Original bundle | Wait → wait | 2 | 1 | 6 / 8 / 1 |
| Revised rescue first | Build beacon → signal | 6 | 1 | 6 / 8 / 1 |
| Revised survey first | Build tools → survey | 2 | 3 | 6 / 8 / 1 |

The rescue-first route gives up two mapped routes relative to survey-first;
survey-first gives up four evacuations. Which route meets the assignment
reverses with the objective. The [generated evidence](evidence.md) enumerates
the model's attainable outcomes, including delayed actions, and retains full
traces rather than only the favorable examples above.

## What the change costs

The two revised complete routes still contain two waits, now in the middle.
They require two construction actions instead of one. The player must
understand the assignment and the early window sooner; a first-turn delay or
wrong initial module can forfeit that assignment. These are meaningful costs
for onboarding and error recovery, not details to hide behind a better score.

The retained bundle is a simple comparison route, but is dominated under both
declared objectives. Its existence does not make it a third non-dominated
choice. Whether it should remain visible in a finished game needs a separate
onboarding decision.

## Inspect and reproduce the complete work

- [Actual request and scoped assumptions](brief.md)
- [Full rules and design explanation](design.md)
- [Original configuration](../../../examples/signal-camp/baseline.json) and [revised configuration](../../../examples/signal-camp/revised.json)
- [First baseline execution and fingerprints](baseline-observation.json)
- [Revision and its affected artifacts](revision.md)
- [Generated checks and outcome witnesses](evidence.md), [raw evidence](evidence.json)
- [Independent review, findings and rechecks](review.md)
- [Factual delegation and execution record](run.json)
- [Proposed human playtest, not yet executed](playtest-plan.md)
- [Reusable pacing-redesign guidance](../../../skills/game-design-team/references/pacing-redesign.md)

From this repository with Node.js 22+: `npm test`, `npm run audit`, and
`npm run verify`. `npm run simulate` regenerates the evidence. `npm start`
serves the actual playable comparison at `http://127.0.0.1:4173/`.

The systems/economy/core delegate authored the rules and implementation. A
separate delegate implemented the interface; another independently challenged
the claims, implemented a rule oracle and inspected behavior. The coordinator
selected the design, integrated the case and recorded the actual interactions.
The log distinguishes these assignments from self-checks. This is not a
controlled multi-agent-versus-single-assistant experiment.

The recorded baseline was executed before the revised configuration was
written. The redesign request was already present in the user's task; no
later user message or player feedback was manufactured for the narrative.
The frozen source and baseline record are retained in commit
[`c832596`](https://github.com/yiyiwahmo28-hue/game-design-agents/commit/c832596).
That shared engine already included the authorized modular branch; the commit
preserves the executed control, not a claim that the revision was unforeseen.

## What has and has not been established

The retained checks support the model's income equality, opportunity timing,
distinct reachable outcomes and state-dependent objective satisfaction. Read
the [release verification](../../verification.md) for actually completed
tests and browser observations. The homepage runs those rules locally; it is
not a live AI generation service.

The open human question is whether players can explain the choice and prefer
the new sequence. The model does not establish comprehension, enjoyment,
retention or production efficiency. Game turns are not measured human minutes.
For each disclosed objective, the successful opening is unique in this model.
The case demonstrates goal-dependent allocation, not a deep strategy system.

## 中文导读

本例展示的是一个策划判断：问题出在“整包购买后才开放功能”，因此拆出可以立即
使用的模块，而不是默认增加奖励。两版的起始库存、逐回合到账、完整设备总价、
任务价格和早期窗口保持相同。改版让玩家第一回合分配资源，第二回合获得不同
任务成果；救援优先与勘路优先会要求不同首步。

代价也保留：仍有中段等待，多一次建设动作，更早要求理解任务，错误分配的后果
出现得更早。程序能验证这些机会和代价，真人是否理解并喜欢它仍待测试。这个
案例和指导方法独立编写，不含雇主项目资料，也没有冒充客户实绩。
