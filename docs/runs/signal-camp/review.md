# Independent review — Signal Camp

Reviewed on **2026-10-13** by a delegated assistant separate from the systems/core and interface authors. The reviewer challenged the proposed design, wrote and ran an independent rule model, compared it with the real implementation, and operated the browser controls. This is not a human playtest.

**Result:** the exercised implementation supports the narrow claim: with the same supply income at every turn, separate functional purchases move a goal-dependent allocation to the opening. The two complete modular routes have different, non-dominated mission outcomes. No unresolved rules or interface defect was found in the scope below. Publication checks are separate from this local review.

## Contract and design challenge

The acceptance sources are the [actual brief](brief.md), [design](design.md), and [revision](revision.md). The reviewer received the proposed numbers before inspecting the implementation and independently enumerated their consequences. That preliminary model already found the original frontier `(2 people, 1 route)` and revised frontier `(6,1)` / `(2,3)`, with each hard goal requiring a different first module.

The pre-implementation challenge raised these distinctions, which were retained in the final case:

| Review concern | Resolution inspected |
| --- | --- |
| A remaining balance can hide changed production or spending | Supplies are named as the resource; gross income, spending, and balance are separate. Every corresponding turn receives the same delivery. |
| Equal final production could conceal an earlier delivery | Affordability is checked before that turn's income. No income is brought forward. |
| A nominal branch might still have one universally superior route | Both goals are explicit. Search confirms different successful first modules and no route obtaining both early rewards. |
| Retaining a bundle might be advertised as a third competitive choice | The documents explicitly identify the bundle as dominated under these two goals and retained for comparison. |
| More clicks could be mistaken for a better experience | The case discloses the extra construction action, two remaining middle waits, earlier explanation burden, and irreversible missed window. |
| A construction unlock might be mislabeled a meaningful choice | Turn four is called the original's first construction opportunity. The original's late mission order has the same final outcome. |

These were design and evidence clarifications, not gameplay bugs found after release. No fictional human feedback was introduced to create a finding-and-fix story. The initial waiting-heavy design is an intentionally constructed public example, and the user requested the control and redesign in the same task.

## Independent rule execution

The portable [review script](../../../scripts/review-camp.mjs) retains the independent model. Its expected rules use a separate state representation and the frozen contract values; they do not use the engine's transitions, previews, policies, or solver to derive expected results. Those real exports are then checked against the model.

Run from the repository root with Node.js 22 or newer:

```sh
node scripts/review-camp.mjs
```

The command reads repository inputs, writes its result to stdout, and exits nonzero on an assertion failure. The executed environment was **Node.js v24.15.0 on Windows**.

Every legal action history through turn six was exercised without deduplicating histories. At each prefix, all six action identifiers and an unknown action were attempted. Complete states, action events, previews of available actions, goal evaluations, unchanged inputs, and unchanged rejected states were checked. Terminal states were also subjected to action attempts.

| Actual independent result | Original | Revised |
| --- | ---: | ---: |
| Legal history prefixes, including the initial state | 23 | 299 |
| Distinct economic states | 15 | 51 |
| Accepted transitions matched | 22 | 298 |
| Rejected transitions preserved the state | 139 | 1,795 |
| Complete six-turn histories | 12 | 174 |
| Gross supply income in every complete history | 6 | 6 |

The 66 states displayed on the verification page are the sum of 15 original and 51 revised economic states. History counts are larger because different action orders can reach equivalent economic positions; the two counts must not be interchanged.

At every checked prefix, `initial supplies + gross income = spending + balance`, and gross income equals the number of completed turns. All full runs therefore receive six supplies. An incomplete-task route can spend less and retain more than one supply; the claim that spending is eight and balance is one applies to the three completed comparison routes, not every possible route.

| Complete route | People | Routes | Produced | Spent | Balance |
| --- | ---: | ---: | ---: | ---: | ---: |
| Original bundle | 2 | 1 | 6 | 8 | 1 |
| Revised beacon first | 6 | 1 | 6 | 8 | 1 |
| Revised survey tools first | 2 | 3 | 6 | 8 | 1 |

The engine's complete outcome set, Pareto frontier, and first-action goal reachability matched the independent enumeration. From the same revised start:

- Only building the beacon first can reach **at least six people and one route**.
- Only building the survey tools first can reach **at least two people and three routes**.
- Waiting first cannot reach either hard goal.
- No legal full history obtains both six people and three routes.

The reviewer independently replayed all three declared policies through the contract model, checking every intermediate state. The search's reported outcome witnesses were also replayed for legality and the fixed horizon. These are deterministic feasibility results, not observed player preferences.

The original configuration still hashed to `1311086215dd2e785a22786d366842453e630139c9cd1fb163163d2afdfb80ec` (SHA-256), matching the [earlier execution record](baseline-observation.json). All configuration fields other than mode, identifier, and titles matched across versions. The engine source at the executed audit hashed to `7b09af07425996c225c9abe2e621acffd292d373deaa4857555887126181ad52`.

## Browser operation and final presentation recheck

The Browser plugin was attempted but failed to start with Windows error 1385. The reviewer used a fresh, isolated **Edge headless 148.0.3967.70** instance, with a **1440 × 1060 desktop viewport** and a **390 × 844 mobile viewport**. This did not reuse a personal browser profile. Actions were performed through browser input events; game state was inspected through the page's read-only observation API, and actual screenshots were viewed.

Retained execution data is in [independent-browser-review.json](independent-browser-review.json). The reviewer completed these operations:

| Scenario | Observed result |
| --- | --- |
| Original opening | Only waiting was enabled initially; three clicks raised supplies 3 → 4 → 5 → 6 while the revised panel stayed unchanged. |
| Original complete run | Bundle → signal → survey after those waits ended at two people, one route, gross income six, spending eight, and balance one. |
| Revised rescue route | Beacon → signal produced six people on turn two; wait → wait → tools → survey ended at six people and one route. |
| Revised route assignment | Tools → survey produced three routes on turn two; wait → wait → beacon → signal ended at two people and three routes. |
| Late boundary | Beacon → wait → signal resolved the mission on turn three for two people, marked as late. |
| Goal and language controls | Changing the goal or language preserved both panels' actual state; the goal thresholds and matching result changed with the selected assignment. |
| Independent panels and ending | Operating one panel did not change the other. At the completed paired run all action controls were disabled. |
| Replay control | The real from-start replay completed both versions and produced the expected two-person versus six-person rescue comparison. |
| Mobile viewport | Tools and survey could be operated to obtain three routes at turn two; the document had no horizontal overflow. |

During interface development, the author added visible prerequisite wording for unavailable missions, without relying on hover, and connected the verification page to the recorded evidence. The reviewer then performed a fresh English and Chinese recheck. In both languages:

- The unavailable signal named its missing beacon.
- After building a beacon, the signal preview showed six people for the next, second turn. After waiting instead, it showed two people and the late-window reason.
- All **12 recorded checks** were present and passed. Every recorded final state for both versions and all three policies matched the page's actual engine results.
- Switching the verification assignment highlighted beacon first for rescue and survey tools first for routes, keeping the outcomes and `6 / 8 / 1` supply ledger unchanged.
- The design page disclosed remaining waits and the extra construction action. Arrow-key navigation moved between the workflow tabs.

Screenshots of the completed comparison, design explanation, verification table, and mobile panel were visually inspected. Both the main operation pass and the final bilingual recheck recorded **zero resource or runtime console errors**. These are local observations, not a claim of physical-phone or all-browser coverage.

After the interface author's final scene adjustment, a fresh operation of tools → survey was also checked: the original scene had no highlighted routes, and the revised scene showed exactly three, matching its turn-two state. That screenshot was inspected and the scene recheck recorded zero console errors.

## Other independently executed checks

| Command | Actual result |
| --- | --- |
| `node --test tests/camp.test.mjs` | 15 tests passed; zero failures or skips |
| `node scripts/camp-evidence.mjs --check` | 12/12 checks passed; retained evidence matched |
| `node scripts/review-camp.mjs` | Exit 0; independent state, ledger, and frontier checks above matched |

The first two commands rerun the core author's checks. They remain author-authored checks even when run by a separate reviewer; the contract oracle and browser observations are the independent evidence.

## Remaining limits

- This is a small planning example. A different objective reverses the required opening, but each individual hard objective has one successful first module. The result does not establish deep strategy or several equally competitive paths for the same objective.
- The redesigned opening permanently punishes a mismatched first allocation. Whether that pressure is appropriate, or whether recovery should be added, depends on the audience and requires observation.
- Waiting still occurs in the middle. Six game turns are not six measured minutes, and no elapsed-time reduction or retention lift was measured.
- No human participant was tested. Comprehension, preference, enjoyment, and onboarding burden remain open; the [playtest plan](playtest-plan.md) is explicitly unexecuted.
- The baseline is constructed to isolate a spending gate. The review does not claim that commercial games generally have this problem, that the numerical values are universal, or that multiple agents outperform one assistant.

## 中文结论

独立审查支持这个有限结论：保持初始补给、每回合到账、总时长和全部价格不变，单独开放可用模块后，第一步资源分配会因任务目标不同而改变。独立模型逐一检查了原版23条、改版299条合法历史前缀；全部完整路线毛产出均为6，改版成果前沿只有6人/1路线与2人/3路线，不能兼得两项早期高成果。

浏览器中实际完成两条路线、原版等待、错过窗口、切换目标和语言、自动演示及390像素视口操作；最终双语复查确认前置条件、早晚预览、12条证据与目标高亮正确，未记录浏览器错误。没有遗留的已发现规则或界面缺陷。设计代价仍在：中段等待、多一次建设、更早理解任务、错误首步不可追回。本例证明规则取舍成立，尚未证明真人觉得更好玩。
