# Independent delivery review — Rain Harbor

Reviewed on 2026-10-13 by a delegated reviewing assistant separate from the core and interface authors. This is an agent's source review, program execution, and browser observation. It is not a human playtest. The reviewer did not change the implementation or publish the site.

The checks below found no gameplay defect in the exercised baseline or one-undo revision. The one presentation defect found during review was fixed and independently rechecked. Final local package and browser checks passed; no finding remains open within this review's scope. Deployment verification is a separate release check.

## Basis and environment

The acceptance sources are the [original brief](brief.md), [baseline design](design.md), and [actual follow-up request](change-request.md). The change request was issued as an explicitly labeled fictional design exercise after a baseline run; it is not presented as feedback from a real player.

Independent execution used Node.js **v24.15.0 on Windows**. Browser checks used an isolated, fresh-profile **Edge headless 148.0.3967.70** instance at **1360 × 1000** and a **390 × 844 mobile viewport**. Controls were operated with browser input events, their rendered feedback was read, and captured screenshots were visually inspected. The Browser plugin failed to start with Windows error 1385; the isolated browser was used as the recorded fallback. A mobile viewport is not a physical-phone compatibility test.

## New-user entry

The existing `node --test tests/new-run.test.mjs` suite passed **7/7**, with no skipped tests. In a separate scratch directory outside the checkout, the reviewer also used the real CLI to create Chinese and English workspaces from a UTF-8 brief containing a BOM, CRLF line endings, Chinese text, quotes, dollar signs, and Markdown fences.

- The brief was preserved exactly. The generated Skill, manifest, and checking-command references resolved; the Skill's four direct relative references existed.
- A fresh scaffold returned `INCOMPLETE`, identifying unrecorded execution mode and the five missing deliverables.
- Reusing an existing destination was refused, and the original brief and instructions remained unchanged.
- Five nonempty fixture files passed only the explicitly labeled file-completeness check. They were not treated as an executed game or a quality assessment. Windows trailing-dot path aliases did not bypass the distinct-file check in this environment.
- The English and Chinese guides correctly distinguish preparation, assistant execution, launch instructions, a real later revision, and file completeness. No model call is claimed by the starter.

No entry defect was found in this scope. This is not an adversarial filesystem-race audit or a guarantee about every assistant's resulting game.

## Independent engine checks

The reviewer implemented a separate rule oracle from the written contract in an isolated scratch script. The executed logic is now retained in [scripts/review-harbor.mjs](../../../scripts/review-harbor.mjs), with repository-relative inputs and stdout output instead of local scratch paths. It enumerated reachable positions and tried every refuel, prepare, rescue, and unknown action. For the revision it also tried undo, retained the last successful action, and included history and allowance in the visited-state identity. Rescue-id arrays were normalized only for deduplication. The expected transitions were compared with the real exported engine, including unchanged inputs and unchanged rejected states.

Reproduce these independent checks from the repository root; no dependency installation is needed. A failed assertion exits with a nonzero status, and the command writes no files:

```sh
node scripts/review-harbor.mjs
```

| Check | Independently observed result |
| --- | --- |
| Baseline reachable positions | 217 canonical states; 441 accepted and 1,078 rejected transitions matched the oracle |
| Revised positions including undo histories | 659 canonical states; 1,653 accepted and 3,619 rejected transitions matched the oracle |
| Undo availability and restoration | 441 accepted undos, including 176 from terminal states |
| Failed-action history | Every rejected transition preserved the complete state, including the restore target and allowance |
| Allowance cannot be regained | The restored state had zero allowance; immediate and later second undos were refused |
| Early all-rescued ending | A separate one-boat fixture ended after rescue and successfully restored the previous state with its allowance spent |
| Passenger maximum | 18 in both the baseline graph and the revised graph including undo |

The independently enumerated maximum is specific to these deterministic inputs and the passenger-count objective. It is not a difficulty target, a preference score, or evidence of player comprehension.

The original configuration bytes still hashed to `82b06346079f007add3a19b41b5c1f64983f38d191be0d6bce708f7b4fa3644e`, matching the retained [baseline observation](baseline-observation.json). The turn limit, initial fuel, both refuel amounts, prepare cost, and entire boat list were deeply equal across versions. The baseline has no enabled undo; the revision enables one.

The three declared policies used the same ordinary action sequence in both versions. Every corresponding economic state matched after accounting for the version identifier and the added undo metadata:

| Declared policy, without undo | Original people rescued | Revised people rescued |
| --- | ---: | ---: |
| Rescue first | 12 | 12 |
| Prepare first | 18 | 18 |
| Model optimum | 18 | 18 |

The engine source when the public audit script was rerun hashed to `7ec0a56bf9538ff109e4ba6ad9a59360a4e4b3482397b1498c3ec31f4783016a` (SHA-256). The public script reproduced the same state and transition counts above.

## Independently operated browser scenarios

The reviewer operated the baseline and revised versions, rather than accepting another agent's run summary as execution evidence.

| Scenario | Observed result |
| --- | --- |
| Baseline prepare → refuel | Fuel changed 4 → 2 → 7; preparation and remaining turns matched |
| Baseline reset | Restored four fuel, seven turns, zero people, and unprepared status |
| Baseline final rescue | The seventh rescue action counted before closure; the displayed result was 12 people and zero turns |
| Revised prepare, refuel, and rescue undo | Each restored four fuel, seven turns, zero people, and unprepared status from a fresh run; allowance stayed zero |
| Another action after undo | The action worked but did not replenish undo |
| Revised final-turn rescue undo | Closed state at 12 people, zero fuel, turn 7 restored to open state at six people, six fuel, turn 6 |
| Different final choice after undo | Preparing then closed the harbor at six people; undo remained unavailable |
| Version switching | Each switch began a new run; only the revised version received one allowance |
| Mobile viewport | Rescue and undo could be operated; displayed values and boat markers updated; document and viewport widths were both 390 pixels |

To reproduce the terminal scenario, choose **Rescue Skiff → Refuel → Rescue Dinghy → Refuel → Refuel → Refuel → Rescue Trawler**. In the revised version, then choose **Undo**. The preview before clicking showed the restored fuel, people, remaining turns, preparation, and open-harbor state. The observed values and boat markers matched that preview afterward.

## Finding and follow-up

**Low-priority presentation defect:** the revised initial/reset instruction said that every accepted action advanced the storm, although successful undo restores the previous turn. This could teach an incorrect rule even though the control's restoration preview and execution were correct.

The finding was sent to the coordinator and interface author. The interface author changed the instruction to name refuel, prepare, and rescue as the storm-advancing actions and to describe undo separately. The reviewer independently loaded both languages and both versions, performed a refuel and reset on each, and confirmed that the initial and reset instructions were correct. The revised English text reads, “Refuel, prepare, and rescue advance the storm. Undo restores the previous state.” The revised Chinese text reads, “补给、准备和救援推进风暴；撤销恢复上一步。” **Resolved and rechecked.**

During the earlier browser passes, the still-being-authored evidence and implementation/revision/review records produced local 404 responses. These were observed integration gaps, not ignored console errors. After the records were delivered, the final four-page pass recorded **zero resource or runtime console errors**. The five workflow records loaded in both languages, and all ten verification row names and statuses matched the actual loaded [evidence JSON](evidence.json). **Resolved and rechecked.**

## Final local package checks

| Independently executed check | Result |
| --- | --- |
| `npm test` | 42 tests passed, zero failures and skips |
| `node scripts/review-harbor.mjs` | Exit 0; the retained independent oracle reproduced 217 baseline and 659 revised states |
| `npm run verify` | Exit 0; both retained evidence sets matched the current inputs and shared engines |
| English/Chinese × original/revised browser pass | Correct initial/reset instructions; 10 evidence rows per page matched the JSON; zero console errors |

The final implementation, revision, and generated evidence narratives explicitly separate delegated work, core self-checks, independent review, deterministic strategy modeling, browser observation, and unperformed human playtesting. No additional gameplay scenarios were added while preparing the public audit script.

## Limits and next evidence

- No human participant was tested. Understanding the preparation tradeoff, noticing the undo allowance, perceived pressure, and enjoyment remain unverified.
- Browser operation covered the stated local environment and viewport sizes. It does not establish support across every browser, physical device, keyboard/screen-reader workflow, or a deployed origin.
- Undo reduces the permanence of one mistake but adds a control and a restore preview to understand. Matching economic parameters does not establish that this is a better experience.
- The review must be read alongside the final generated verification and publication checks. A set of present files is not a substitute for these behavior observations.

## 中文摘要

这是独立受委派助手的执行审查，不是真人试玩。入口7项测试通过，另外实际创建了中英文工作区并验证原文、引用、拒绝覆盖和完整性提示。独立规则模型检查了首版217个状态，以及包含撤销历史的改稿版659个状态；拒绝操作不污染历史，额度不可恢复，终局可以撤销，原版配置字节及全部经济参数保持。

浏览器中实际完成了三种动作撤销、关港恢复、额度用完后继续操作、版本切换和390像素手机视口操作。发现一处“所有成功操作推进风暴”的旧提示与撤销规则冲突，作者已修复，独立复查确认中英文、原版与改稿版的初始和重置提示均正确。最终4种页面组合没有资源或运行错误，10条验证结果逐项对应实际JSON；完整42项测试和证据一致性检查通过。公开的独立审查脚本可复现上述统计。没有证明玩家理解了取舍或认为游戏更好玩。
