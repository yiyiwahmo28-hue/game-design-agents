# Rain Harbor — one-undo rule delta

Source: [the follow-up request](change-request.md), issued after the coordinator ran the baseline engine and browser. The [baseline design](design.md), baseline configuration bytes and all economic parameters remain unchanged. This is authored revision input, not invented human playtest feedback.

## Confirmed change

Only `examples/rain-harbor/revised.json` enables `undoLimit: 1`. The original configuration has no allowance. Resetting or switching versions creates a fresh state for the selected version.

- A successful ordinary action replaces the one restore target with the full prior position: fuel and its ledger, rescued people and boat ids, preparation, turn and ending flags.
- Refused actions preserve both the previous successful action and the allowance.
- Undo restores that position without paying fuel or advancing the storm. It may run after either storm closure or rescuing all boats.
- Undo permanently sets the run's allowance to zero. The allowance is not part of the restore snapshot. Undo clears the target and cannot itself be undone.
- Later successful actions after spending the allowance do not create a new undo target. A second undo is refused without mutation.
- Before the first success, undo is refused without mutation. Original-version undo is also refused.

## State and interface propagation

The shared `src/harbor.mjs` state adds `undoRemaining`, `undoUsed` and `history`. History is a single `{action, before}` object; `before` contains only the basic game position, with no history or quota. The engine validates that replaying that action from `before` produces the current position.

`getActions` exposes an `undo` action with availability, refusal reason and `restores` preview. `step` returns an undo event with `undoneAction` and `restored`. The browser should read those values, permit available undo after closure, and display that the allowance stays spent. It must not derive quota from turn count or implement a second restore rule.

## Costs and modeling limits

Memory is bounded to one basic snapshot. The extra control and restored ending require browser verification. Undo introduces a reversible manual transition, so the existing forward-only optimizer explicitly excludes undo and its histories. In a fixed fully known deterministic world, rollback discards an action and its benefit; it cannot improve the ideal-information passenger maximum. It can help a human recover from a mistake, which has not been observed here.

The declared policies deliberately never use undo. Their forward outcomes and action sequences must match the saved baseline observation. This checks that the addition did not silently retune the economy; it does not benchmark multi-agent performance or player preference.

## Verification plan and evidence

Execute preparation, unprepared and prepared refuel, rescue, final-turn and early-completion undo. Compare every restored basic field, then confirm zero quota. Refuse a second undo immediately and after a new action. Exercise failed actions before undo. Check the original config hash and all economic fields. Reproduce every original policy's numerical result and action sequence.

The generator [evidence.md](evidence.md) records actual scene-level assertions, input hashes, policy traces and limitations. Its check list is produced by executing the engine, not copied from test counts. The core delegate combines systems, economy and implementation duties; its review remains self-review. Independent browser inspection belongs to the coordinator and UI task.

## 中文摘要

本增量只给修改版每局一次撤销：恢复全部游戏位置，额度永远保持已用，撤销本身不能再撤销；失败操作不覆盖历史，终局也能撤销。原版设计、配置字节和经济参数保留。快照不含额度或嵌套历史；优化器明确只搜索不主动撤销的正向策略，不冒称覆盖全部历史，也不证明真人更喜欢该功能。
