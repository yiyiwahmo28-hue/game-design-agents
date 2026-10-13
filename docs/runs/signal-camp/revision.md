# Signal Camp — the actual revision

Source: the user's request to create a complete comparison where total resource production stays unchanged and early waiting becomes a meaningful choice. Both control and revision were requested together. This document records an authorized design experiment, not invented feedback from players.

## One rule changed

| Before | After |
|---|---|
| The beacon and survey tools are available only as a 6-supply bundle. | The same modules can also be bought separately at 3 each. |
| One construction action opens both uses. | Two construction actions are needed if modules are bought separately. |
| First three turns have only wait available. | Turn 1 can commit to either module. |

The `mode` field changes from `bundled` to `modular`. Version identifiers and display titles change with it. Every other parameter is preserved: six-turn horizon, starting balance, after-action income, prices, mission effects, early windows and goal requirements. [The evidence generator](../../../scripts/camp-evidence.mjs) compares these parameters and every matching turn's cumulative income.

## Complete before/after traces

These routes run through the shared engine. The detailed snapshots and events are in [evidence.json](evidence.json).

| Turn | Original | Beacon first | Survey tools first |
|---:|---|---|---|
| 1 | Wait | Build beacon | Build survey tools |
| 2 | Wait | Signal: 6 people | Survey: 3 routes |
| 3 | Wait | Wait | Wait |
| 4 | Build both modules | Wait | Wait |
| 5 | Signal: 2 people | Build survey tools | Build beacon |
| 6 | Survey: 1 route | Survey: 1 route | Signal: 2 people |

All three routes start with 3 supplies, receive 6 during the same six turns, spend 8 and finish with 1. Their cumulative income at matching boundaries is `[0,1,2,3,4,5,6]`. The better early outcome does not come from an extra reward, an earlier resource delivery, a cheaper total build or a shorter comparison window.

The original can reverse its last two missions and still ends with 2 people / 1 route. Its turn-4 build is the first construction opportunity, not a choice between competing high outcomes.

## Evidence that the branch matters

- Rescue brief: at least 6 people and 1 route. Only the beacon-first opening can reach it.
- Route brief: at least 3 routes and 2 people. Only the survey-tools-first opening can reach it.
- Searching all legal futures yields two non-dominated revised outcomes: `(6 people, 1 route)` and `(2 people, 3 routes)`.
- No legal sequence obtains `(6 people, 3 routes)`. The competing module consumes the only opening construction action needed to execute its mission by turn 2.
- Waiting first cannot reach either hard goal. The retained bundle produces the original `(2,1)` and is not advertised as a third equally effective route.

These are results of the deterministic engine and exhaustive model search. They are not usage statistics, simulated-human preferences or evidence of improved retention.

## Costs retained in the presentation

**Waiting moves; it does not disappear.** The selected modular routes wait at turns 3 and 4. The opening now establishes a plan and visible result before that wait, but whether people experience this as better pacing remains a playtest question.

**Construction takes one more action.** Two purchases replace one bundled purchase. Both prices still sum to 6, but action economy is intentionally different. Hiding this would make “same economy” too broad a claim: the preserved economy here is supply income and prices, not every aspect of action timing.

**The commitment can be wrong for the task.** Choosing survey tools for the rescue brief permanently misses the four-person early advantage; choosing the beacon for the route brief permanently misses two early routes. The prototype should show those consequences before the purchase rather than surprise the player with an undisclosed deadline.

**The baseline is constructed for this experiment.** It is not proof that most existing games suffer from this exact gate. The result supports the method of diagnosing and testing an opening gate; it is not a universal balancing prescription.

## Reproduce

```sh
node --test tests/camp.test.mjs
node scripts/camp-evidence.mjs --write
node scripts/camp-evidence.mjs --check
node scripts/review-camp.mjs
```

The first command exercises behavior. The next two regenerate and compare the committed evidence. The final command is the separate reviewer's contract-based oracle; it does not turn author tests into an independent review. Browser observations and any later human playtest have their own records.

## 中文修改说明

原版和改版来自用户同一次需求，先执行并冻结对照，再写改版配置；没有伪造“后来玩家反馈要求再改一次”。实际改动只有开放单独建设：整包6仍在，两个模块各3，任务各1、每回合到账1、总共6回合都不变。

原版等3回合后才开始建设；改版第一回合就能决定优先完成哪件事。两条路线的终局分别为6人/1路线和2人/3路线；目标变化时，首选模块随之反转。三条完整路线的补给都为初始3、毛收入6、花8、余1。

但分步建设多占一次行动，仍有两次中段等待，而且早期判断错误会错过当前任务窗口。页面需要同时展现这些代价。自动测试与穷举只证明规则和此模型下的取舍成立，尚未证明真人觉得节奏更好。
