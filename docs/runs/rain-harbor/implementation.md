# From the new brief to the first playable build

This coordinator record summarizes the actual delegated implementation and
observations retained for Rain Harbor. It is not a simulated agent dialogue.

## Inputs, ownership, and decisions

The core delegate read the repository's `game-design-team` Skill and its role,
handoff, and experience-review references, then received the [new brief](brief.md).
That delegate combined systems design, economy analysis, and core implementation.
It delivered the [baseline rule contract](design.md), editable inputs, and the
shared browser/Node engine. Its own checks are self-review.

The interface delegate received the actual configuration, state and action API
before integrating the browser. The coordinator retained the first version,
ran its policies, and operated the browser before issuing the revision.
An independent reviewer later checked the rules using a separate oracle and
actual browser operations. [Actual assignments and handoffs](run.json).

## The actual execution path

| Artifact | Responsibility |
| --- | --- |
| `examples/rain-harbor/baseline.json` | Original turn budget, fuel parameters and boats |
| `src/harbor.mjs` | Validation, state transitions, previews, policies and bounded model analysis |
| `demo/workflow.mjs` | Loads the configuration and engine; renders their previews and actual results |
| `demo/harbor-scene.mjs` | Shows remaining/rescued boats and preparation from the actual game state |
| `scripts/harbor-evidence.mjs` | Replays declared policies and checks; generates retained evidence |
| `scripts/review-harbor.mjs` | Independent written-rule oracle, separate from the engine's implementation |

There is no second balance calculation in the interface. `getActions` describes
the cost, outcome, turn cost and eligibility; `step` performs the transition.
Unavailable actions return an unchanged state with a reason. The UI reads and
displays the same fields used by the rules.

## First execution, before the follow-up request

The coordinator ran the baseline through the real module:

- An unaffordable ferry rescue was refused without changing state.
- Prepare then refuel produced turn 2 with 7 fuel.
- Rescue-first saved 12 people; prepare-first and model optimum saved 18.
- The best result with preparation prohibited was 16; search visited 217
  canonical forward states. These results do not describe human players.

The core source and configuration were saved in commit
[`bf68a67`](https://github.com/yiyiwahmo28-hue/game-design-agents/commit/bf68a676fdcff36884da1522e00e6492748dd6d2).
[Observed inputs, fingerprints and traces](baseline-observation.json) were
retained with the [original design](design.md).

The first browser was then actually operated: prepare → refuel → rescue trawler
produced turn 3, 1 fuel, 6 people rescued, and prepared status. The unaffordable
ferry control was disabled. [First browser observation](first-browser.json).
The rest of the final revision/review documents did not yet exist at this
checkpoint; it was a first playable build, not the final publication check.

## Revision and integrated review

Only after that execution did the coordinator issue [one undo per run](change-request.md).
The [revision record](revision.md) describes the preserved baseline, new
allowance and restore target, terminal undo, user feedback, and evidence.
The independent review found an outdated instruction about all successful
actions advancing the storm; it was sent back to the interface author.
[The review](review.md) retains the finding and its follow-up.

From a complete clone, run:

```sh
npm test
npm run audit
npm run verify
npm start
```

Then open `http://127.0.0.1:4173/?step=prototype` and switch between original
and revised rules. The [final release verification](../../verification.md)
records which checks were actually run and the final browser observations.

## Boundaries

The input is an original fictional exercise. The work used real delegation,
with some responsibilities combined; it did not execute all five optional
Claude Code agent definitions. The browser has no model backend. New games
require a tool-enabled assistant to perform the workflow. Neither source
review, deterministic policies nor browser inspection establishes enjoyment
or human understanding.

## 中文摘要

先由受委派助手依据原创需求产出规则、配置和共享核心，另一个助手接入可玩界面；
协调者实际运行策略并点击首版后，保存了可复现基线，再发出一次撤销的新要求。
界面与验证调用同一个规则模块。独立审查另外实现了书面规则模型，并实际操作浏览器；
这与核心作者的自检分开记录。完整修改、发现与最终检查见对应原始记录。
