# Signal Camp — preserve income, change when choices open

## The design problem

The requested experience is specific: **keep total resource production unchanged and turn early waiting into a consequential choice**. This original fictional comparison makes that constraint inspectable. It is not a diagnosis taken from an employer's game or a report of observed player frustration.

The baseline has a defensible reason for bundling: one purchase opens two tools, using one construction action and requiring no early specialization. Its disadvantage is the interaction of that bundle's price with the opening budget. The player has 3 supplies; the bundle costs 6; income arrives at +1 after each action. The first three turns therefore offer only waiting. By the time construction opens, both early opportunities have passed.

The diagnosis is **a gate on resource use**, not inadequate resource production. Raising income would obscure whether earlier access alone can change the opening. Adding empty buttons would obscure whether the decision changes the result. The revision must open a use for the existing budget and retain an observable opportunity cost.

## Frozen experiment

The authoritative parameters are [baseline.json](../../../examples/signal-camp/baseline.json) and [revised.json](../../../examples/signal-camp/revised.json). Both are read by the same [engine](../../../src/camp.mjs); the browser and analysis do not maintain separate rules.

| Constraint | Both versions |
|---|---|
| Session horizon | Exactly 6 accepted actions |
| Starting resource | 3 supplies |
| Delivery timing | +1 supply after every accepted action, including action 6 |
| Gross production | 6 supplies over the complete session |
| Initial + produced | 9 supplies total available |
| Whole camp | 6 supplies; one construction action |
| Each separate module | 3 supplies; one construction action |
| Each mission | 1 supply; one action; once per session |
| Early window | Action 2 is included; action 3 is late |
| Randomness | None |

Evacuated people and marked routes are **two separate outcomes**, not the supply resource. Holding supply production constant does not imply that every result must stay constant. Balance is also not production: an unfinished route can retain more supplies because it spends less.

## World, actions and timing

A small coastal camp has a beacon and survey tools. The transport boat leaves after turn 2; a timely signal evacuates 6 people. After it leaves, a local boat can take only 2. The tide covers two shallow crossings after turn 2; surveying in time marks 3 routes for later crews, while a late survey can mark only 1.

Each action first checks its prerequisites and affordability against the current supply balance. It then pays its cost and resolves its effect for **turn + 1**. Finally, the camp receives the fixed +1 delivery. Today's delivery cannot finance today's action in advance.

- **Build the whole camp:** pay 6 and acquire both modules in one action. Available in both versions only while neither module has been built.
- **Build a module:** pay 3 and acquire either the beacon or survey tools. Available only in the revised version, once per module. Once partially built, complete the other module separately; do not rebuy the bundle.
- **Send the signal:** requires the beacon; pay 1; evacuate 6 people on or before turn 2, otherwise 2. Once per session.
- **Survey:** requires survey tools; pay 1; mark 3 routes on or before turn 2, otherwise 1. Once per session.
- **Wait:** advance one turn and receive the same +1 delivery as every other accepted action. No additional reward.

Every run continues to turn 6, even if both missions finish earlier. This fixes the comparison window. Unknown, repeated, unaffordable or post-ending actions receive no income and change no state. The sixth action's effects and delivery resolve before closure.

## Goals that can overturn the apparent best route

There is no invented weighted score claiming that a route equals some number of people. Instead the player chooses one of two fictional operational briefs:

1. **Evacuate the stranded group:** reach at least 6 people and 1 marked route.
2. **Open routes for the next crew:** reach at least 3 marked routes and 2 people.

The starting state, actions, income and deadlines stay identical when the goal changes. A meaningful route must satisfy the selected brief, and the preferred first module must reverse between the two briefs. Exhaustive search must also test whether an unadvertised sequence can reach both high outcomes; checking only two hand-picked policies would be insufficient.

## Proposed change and accepted cost

Expose the two existing modules separately at 3 + 3, preserving their combined price of 6. Buying a module now takes one construction action, so completing both takes two actions rather than the bundle's one. No production, reward, window or goal parameter changes.

The design is intended to move a consequential choice to the first action. It does **not** promise to remove all waiting: the completed modular routes still wait twice in the middle. The player also has to understand the goal before committing. Picking the mismatched module uses the opening action and misses the other early window permanently.

The original bundle remains as a low-branching convenience and an explicit comparison route. For the two stated early goals it is dominated; retaining the button does not make it a third competitive strategy. A future game could create an appropriate bundle scenario, but inventing such a scenario is outside this case's evidence.

## Evidence responsibilities

The coordinator assigned systems design, numerical modeling and core implementation to one real delegate. That delegate's tests are self-checks. A separate delegate builds the browser presentation, and another independently implements the written transition contract and compares it with the runtime. The original brief already requests the before/after experiment; no later user request or human feedback is manufactured to make this look like an iterative playtest.

The baseline configuration and executed traces were retained in [baseline-observation.json](baseline-observation.json) before the revised configuration was written. The shared engine already contained the authorized modular branch at that point. This is a frozen executed control, not a claim that the change request arrived later.

Acceptance covers per-turn income, full-session ledgers, action previews, exact early/late boundaries, fixed termination, invalid-action behavior, complete reachable outcomes and goal-dependent preference. Executed results live in [evidence.md](evidence.md); the independent review is separate from the author's checks.

## What this says about design practice

The reusable skill is the sequence of decisions:

1. Find the rule that causes the experience problem: the spending gate, not merely the low visible balance.
2. Freeze the variables that would otherwise explain the result: starting resource, every delivery, horizon, prices and task effects.
3. Change one causal lever: allow partial construction before the bundled gate.
4. Show what the first choice gains **and what it gives up** under an explicit player goal.
5. Search for a counterexample that would make the second option pointless.
6. Expose the design cost alongside the benefit: more actions, more explanation and irreversible early misallocation.
7. Separate rule correctness from actual player understanding.

This is a deliberately small demonstration. An explicit goal can make the correct choice easy to explain; that is useful for learning, but it does not prove deep strategy. No human playtest has been run. Observe unfamiliar players choosing a goal, explaining the forecast before clicking, and identifying the missed opportunity afterward before claiming improved comprehension or enjoyment.

## 中文策划解读

这次案例要展示的策划判断是：**玩家手里有资源，却没有能改变结果的用途时，先检查用途开放的门槛。** 原版整包6、初始3、每回合到账1，导致前三回合只能等；它的优点是一次建设就齐备、不必提前专精。问题来自整包门槛和早期窗口叠加，而不是简单的“资源太少”。

改版保持每一回合的供给、全部价格、窗口、目标都不变，只把总价6拆成各3的模块。于是第一回合可以先建信标或工具，第二回合拿到对应的早期结果。先信标得到6人/1路线，先勘測得到2人/3路线；究竟哪条更合适由当前任务决定，而不是由一个任意加权总分决定。

不能省略代价：改版仍要在第3、4回合等待；两件模块分开建设多占一次行动；首步选错会永久错失当前任务的早期窗口。保留整包只是方便比较和降低操作分支，在这两个目标下无法成为同样有竞争力的策略。这些事实同时呈现，才能体现设计取舍，而不只是“改版数据更好”。

这套可复用方法是“定位体验成因—冻结对照变量—调整一条开放规则—验证不同目标下的选择—公开代价”。执行结果只支持此小模型；要证明真人更能理解、更喜欢，还需要实际试玩观察。
