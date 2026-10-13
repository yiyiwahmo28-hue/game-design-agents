# Rain Harbor: a new brief, a playable prototype, and a revision

[Play and inspect the recorded workflow](https://yiyiwahmo28-hue.github.io/game-design-agents/?step=brief)
· [中文界面](https://yiyiwahmo28-hue.github.io/game-design-agents/?lang=zh&step=brief)

This is an original fictional brief executed during preparation of v0.2.0.
Actual delegated assistants produced the design and implementation; the
coordinator ran the first version before issuing a follow-up request.
It is a retained execution case, not a customer testimonial or a controlled
comparison of agent systems.

## 1. The input and design

The [original brief](brief.md) asks for a short rescue game with fuel, different
stranded boats, and a storm deadline. Preparing the rescue boat and saving people
immediately must expose a visible tradeoff.

The [complete baseline design](design.md) records confirmed requirements,
reversible decisions, an alternative considered, rules, parameters, boundaries,
and the experience hypothesis. Its selected world has seven turns, four initial
fuel, and four boats. Preparation costs fuel and time but improves later refuels.

## 2. What actually collaborated

- The coordinator authored the public brief, allocated ownership, integrated
  artifacts, and operated the browser.
- One delegate combined systems design, economy analysis, and core implementation.
  Its own checks are self-review.
- A separate delegate implemented the browser interface against the core API.
- Another delegate created the reusable first-run tools and guidance.
- An independent reviewer inspected the first-run tools and the completed case.

These are actual assignments. Five role descriptions do not imply five separate
agents were always active. The [run record](run.json) contains factual coordinator
summaries and artifact references, not reconstructed chat transcripts.
The optional Claude Code native role adapters were not used in this run.

## 3. The first playable delivery

[Implementation record](implementation.md) · [Original configuration](../../../examples/rain-harbor/baseline.json)
· [Shared engine](../../../src/harbor.mjs)

The core's initial implementation is retained in commit
[`bf68a67`](https://github.com/yiyiwahmo28-hue/game-design-agents/commit/bf68a676fdcff36884da1522e00e6492748dd6d2).
The [baseline observation](baseline-observation.json) retains its configuration
and engine fingerprints, real policy traces, and finite-state analysis.

Before the follow-up request, the coordinator also operated the first browser
prototype. Prepare → refuel reached turn 2 with 7 fuel; rescuing the trawler then
reached turn 3 with 1 fuel and 6 people rescued. The [first browser record](first-browser.json)
retains the actual observed state. An unaffordable ferry rescue was disabled.

The named rescue-first policy saved **12 people**; prepare-first saved **18**.
Finite-state search found **18** as the passenger-count optimum, and **16** when
preparation was prohibited. Comparing the two named policies alone would
overstate preparation's contribution. These results concern this model and its
declared objective, not typical player behavior.

## 4. A new requirement after the first run

The coordinator then issued the [follow-up request](change-request.md): one chance
per run to undo the last successful action, including after harbor closure.
Restore the game state, keep the allowance spent, and preserve the original
version and every economic parameter.

The [revision record](revision.md) follows that request through configuration,
rules, history handling, interface feedback, and verification. The original
[baseline design](design.md) remains a description of the first version;
read the revision alongside it for the changed rules.

This is an authorized fictional revision exercise. No player feedback or
human playtest was invented to motivate it.

## 5. Inspect and reproduce the evidence

From the repository root with Node.js 22+:

```sh
npm test
npm run audit
npm run verify
npm start
```

Open `http://127.0.0.1:4173/?step=prototype`. Switch between original and revised
rules; each switch starts a fresh run. Try a rescue, undo in the revised version,
and check the fuel, rescued count, remaining turns, and used allowance.

The [generated evidence](evidence.md) and [JSON traces](evidence.json) are produced
by `scripts/harbor-evidence.mjs`. The browser imports the same rules module.
`npm run simulate` regenerates evidence; `npm run verify` fails on missing or
stale evidence. Read the [independent review](review.md) and [release verification](../../verification.md)
for the actual checks, findings, repairs, and browser observations.

## Try the workflow with a fresh delivery

```sh
npm run new -- --name harbor-replay --brief-file docs/runs/rain-harbor/brief.md
```

Paste its printed prompt into a tool-enabled assistant with this repository
open. Inspect and run the first output, then give it the change request above.
The command creates an empty workspace; it does not replay an LLM session or
generate the game. New outputs may differ from the retained case. For a different
game, supply your own brief using the [first-run guide](../../start-your-game.md).

## What remains unproven

There is no human playtest, retention evidence, or controlled single-assistant
comparison. Search and regression checks establish particular rule properties;
they do not certify fun or understanding. The website is a recorded workflow
viewer with a working game, not a live model service. The GIF uses actual browser
captures of that viewer and prototype; [capture details](../../demo.md) explain
the editing and verification.

## 中文导读

这是一次真实执行的原创虚构案例：先给出需求，分派设计与实现，跑通并操作首版，
再提出“一次撤销”的新要求，最后同步修改并验证。原始需求、完整设计、实际交接、
首版结果、追加要求、改稿和审查均可查看。数值策略的12人/18人不代表真人表现；
禁止准备时的最优16人也一并保留，避免只展示有利比较。网页和 GIF 回放已发生的
工作，不模拟 AI 正在运行；自己的新需求需要在具备工具的助手中执行。
