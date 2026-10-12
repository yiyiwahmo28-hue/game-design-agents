# Lantern Expedition: bring the first upgrade forward

An original, fictional example created for this repository. The brief and
design decision below are authored case material, not a transcript of a user
session. Computed outcomes come from the executable model.

## The playable loop

Gather supplies, upgrade the lantern, and chart eight exploration routes.
All actions use the same resource. Upgrading increases later gathering yield;
exploring advances the goal immediately but spends resources that could fund
an upgrade. Starting resources are zero.

The canonical inputs are [baseline.json](../examples/lantern-expedition/baseline.json)
and [revised.json](../examples/lantern-expedition/revised.json). The browser
and simulator both call [game.mjs](../src/game.mjs). There is no separate
browser balance calculation to maintain.

## The requested change

“The first upgrade takes too long. Bring it forward without reducing the
cost of buying the full upgrade path.”

This asks for an earlier opportunity under a stated behavior, not a guarantee
about every player's pace or enjoyment. The demonstration keeps gathering
yields, action durations, exploration cost, and exploration goal unchanged.

## Options and decision

| Option | Consequence | Choice for this case |
| --- | --- | --- |
| Give starting resources | Changes both opening upgrade and exploration opportunities | Not selected |
| Increase the base gathering yield | Speeds up resource access throughout the loop | Not selected |
| Move some upgrade cost into later levels | Brings the first upgrade forward while preserving full-path cost; may still speed up completion | Selected |

The example changes upgrade costs from **12 / 24 / 36** to **6 / 27 / 39**.
Both paths cost **72** if all three upgrades are purchased. The first upgrade
raises yield earlier, so equal total upgrade cost does **not** imply equal
completion time, equal total gathered resources, or equal spending by every
policy. That consequence is an accepted tradeoff of this example.

## Reproduce the result

From the repository root, with Node.js 22 or newer:

```sh
npm test
npm run simulate
npm run verify
```

The [generated report](evidence/simulation.md) and [machine-readable evidence](evidence/simulation.json)
include both configurations, named policies, assumptions, and
results. Read the generated report for numerical outcomes rather than treating
this authored explanation as a test log.

Two policies deliberately expose different consequences:

- **Upgrade-first:** buy all upgrades before exploring. This isolates the full
  upgrade path but does not claim to be an optimal or typical player.
- **Explore-first:** explore whenever affordable; otherwise upgrade if
  affordable, otherwise gather. This can finish without all upgrades. A missing
  first-upgrade time is `null`, not zero or a failed simulation.

## Acceptance and evidence

| Claim | How it is checked |
| --- | --- |
| Full-path upgrade cost is unchanged | Sum the actual cost arrays in both configs |
| First upgrade is earlier under upgrade-first | Replay the policy through the shared engine and compare event timestamps |
| Refused actions do not spend time or resources | State-transition tests, including insufficient resources and completed games |
| The browser uses the revised rules | Operate the real controls and inspect resource, level, and time changes |
| The report matches the current source | Regenerate evidence and compare with the checked-in files |
| Players understand and prefer the change | **Not established**; requires human playtest observations |

## A focused human playtest

Ask someone unfamiliar with the rules to play both versions in alternating
order. Observe what they try before the first upgrade, whether they notice
the increased yield, and how they explain the choice to upgrade or explore.
Do not teach the intended answer. Record actions and comments before deciding
whether earlier upgrading improved the intended experience.

This small loop has no combat, save system, monetization, or retention model.
Its job is to make one design change inspectable, executable, and playable.
