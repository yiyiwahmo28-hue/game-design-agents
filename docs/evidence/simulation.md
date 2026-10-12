# Lantern Expedition: deterministic simulation evidence

Generated from the committed inputs using the same engine as the browser demo.
This records model execution under explicit strategies; it does not measure human-player experience.

## Inputs and rules

- Engine: `src/game.mjs`.
- Before: `examples/lantern-expedition/baseline.json`.
- After: `examples/lantern-expedition/revised.json`.
- Upgrade prices: [12, 24, 36] → [6, 27, 39].
- Sum of all listed upgrade prices: 72 → 72. Equal: true.
- Gather yield: 3 + level × 3 before; 3 + level × 3 after.
- Seconds per action before: gather 10, upgrade 8, explore 12.
- Seconds per action after: gather 10, upgrade 8, explore 12.
- Exploration cost / goal: 8 / 8 before; 8 / 8 after.
- Initial resources: zero in both versions. No gifts or random events.

## Computed results

| Policy | Version | First upgrade | Completion | Turns | Actual upgrade spend | Stop reason |
| --- | --- | --- | --- | --- | --- | --- |
| upgrade-first | Before | 48 s | 300 s | 29 | 72 | completed |
| upgrade-first | After | 28 s | 290 s | 28 | 72 | completed |
| explore-first | Before | not reached | 316 s | 30 | 0 | completed |
| explore-first | After | 28 s | 234 s | 22 | 6 | completed |

Deltas are after minus before; a negative time delta means earlier.

- upgrade-first: first-upgrade delta -20 s; completion delta -10 s.
- explore-first: first-upgrade delta not comparable; completion delta -82 s.

## Policy assumptions

### upgrade-first

The before and after runs share these assumptions.

- Starts with zero resources and level 0; no gifts, random outcomes or parallel actions.
- Gather adds 3 + level × 3 resources.
- Each exploration spends 8 resources and advances exactly one step; 8 steps complete the expedition.
- Actions consume their configured seconds; the first upgrade time includes gathering and the upgrade action itself.
- Upgrade-first buys every lantern level before exploring; it gathers whenever the next upgrade is unaffordable.
- Stops on completion, an unavailable strategy action, or 500 accepted actions. This is a declared strategy, not a human-player prediction.

### explore-first

The before and after runs share these assumptions.

- Starts with zero resources and level 0; no gifts, random outcomes or parallel actions.
- Gather adds 3 + level × 3 resources.
- Each exploration spends 8 resources and advances exactly one step; 8 steps complete the expedition.
- Actions consume their configured seconds; the first upgrade time includes gathering and the upgrade action itself.
- Explore-first explores whenever affordable; otherwise it buys an affordable upgrade, otherwise it gathers. It can finish without buying every upgrade.
- Stops on completion, an unavailable strategy action, or 500 accepted actions. This is a declared strategy, not a human-player prediction.

## Reproduce and check

- `node scripts/simulate.mjs` prints the computed JSON to standard output.
- `node scripts/simulate.mjs --write` regenerates only this Markdown and `docs/evidence/simulation.json`.
- `node scripts/simulate.mjs --check` exits nonzero if either committed evidence file is missing or differs from the current computation.
- The JSON contains input configurations, every accepted action and all state snapshots.

## Limits

- These are deterministic results for two declared policies, not player research.
- The sum of all listed upgrade prices is not the amount every strategy spends.
- An earlier first upgrade can change the time to finish; completion time is reported separately.
- No outcome is asserted for untested player choices or future configurations.
