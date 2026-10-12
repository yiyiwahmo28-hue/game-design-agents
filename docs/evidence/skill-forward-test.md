# An isolated Skill exercise

An independent assistant used the actual `game-design-team` Skill and its
references in an isolated copy during preparation of v0.1.0. This was an
execution exercise, not a comparison against an unassisted model.

## Request

“Use game-design-team to change the revised Lantern Expedition exploration
cost to 10. Leave the original version unchanged. Preserve both versions'
upgrade prices, gathering yields, action durations, and exploration goal.
Update the results, check the change, and explain the effect on both policies.”

## Observed result

| Policy | Revised before this request | Revised after this request | Original, unchanged |
| --- | ---: | ---: | ---: |
| Upgrade-first completion | 290 s | 300 s | 300 s |
| Explore-first completion | 234 s | 264 s | 316 s |

The assistant verified that the baseline file was byte-for-byte unchanged
and that only `exploreCost` changed in the revised configuration. It ran
actual transitions: 8 or 9 resources could not pay the new cost and did not
spend time; 10 resources paid it and advanced one exploration step.

The exercise exposed a real defect in the companion Markdown report: policy
assumptions displayed only the original configuration. The assistant repaired
this in its isolated copy. The release was separately fixed to show both
sets of assumptions when they differ, with a regression check. The public
playable example still uses exploration cost **8 in both versions**.

## Evidence limits

The assistant applied role perspectives sequentially and disclosed self-review.
It executed the model, command-line tools, and tests; it did not run the browser
or conduct a human playtest. The exercise does not establish multi-agent
superiority or player enjoyment.

The [complete original Chinese response](skill-forward-test.zh-CN.md) records
the actual commands, the 15-test baseline, the three stale expected outcomes,
and the final 16-test isolated result. File names such as `before-snapshot.json`
in that response refer to temporary evaluation artifacts, not files shipped
in this release. Test counts describe that exercise's snapshots.
