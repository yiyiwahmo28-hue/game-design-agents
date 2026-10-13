# Follow-up request: one chance to undo

Issued by the coordinating assistant after the first engine and browser
prototype had actually been run, as the revision exercise authorized for this
original public case. This is a new fictional design request, not invented
feedback from a human playtest.

> Give the player one chance per run to undo their last successful action.
> Restore the fuel, rescued people and boats, preparation, remaining turns,
> and ending state. Let the player undo the final action after harbor closure
> as well. The allowance must stay spent after undoing; it must not be possible
> to gain fuel, save extra people, or regain the allowance by undoing itself.

## Preserved constraints

Keep the original playable version. Do not change its configuration or any
fuel values, preparation effects, boat costs, passenger counts, or turn limit.
Only the revised version receives one undo allowance. Resetting or switching
versions starts a fresh run.

An invalid or refused action does not replace the last successful action.
Undo itself spends no fuel or storm turn and cannot be undone. Before any
successful action, or once the allowance has been spent, refuse undo without
mutating any state.

## Acceptance

- Reproduce and restore a rescue, a preparation and a refuel, including their
  ledgers and visible effects.
- Undo the final-turn rescue and reopen the previous valid state.
- Refuse a second undo, both immediately and after another accepted action.
- Refused actions must not alter undo history or allowance.
- Run the same declared strategies in both versions without using undo;
  their numerical outcomes should remain unchanged.
- Synchronize the rule document, revised config, actual engine, browser
  preview/feedback, and verification. Report design costs and evidence limits.

## 中文原意

每局给一次撤销机会，恢复上一步成功操作前的燃油、获救对象与人数、准备状态、
回合和终局状态；关港后也可撤销最后一步。撤销额度不能跟着恢复，不能撤销撤销，
失败操作不能覆盖历史。保留原版及所有经济参数，改稿版单独开启功能。
