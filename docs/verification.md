# Release verification — v0.3.0

This record describes checks actually executed for Signal Camp and the updated
repository. Historical records remain available for [v0.2](verification-v0.2.md)
and [v0.1](verification-v0.1.md). Local execution used Node.js v24.15.0 on
Windows and fresh isolated Edge instances. GitHub's workflow runs Node.js 22.

## Behavior and reproducible evidence

The coordinator executed `npm test`: **57 passed, zero failures and skips**.
That includes 15 new camp behavior tests alongside the existing games and
first-run tools. No test count is a claim about successful generation of that
many different games.

`npm run simulate` regenerated all three reports, and `npm run verify` accepted
their current contents. Signal Camp's **12 named assertions** cover frozen
baseline bytes, equal economic/mission parameters, per-turn income, early
construction, exact deadlines, goal-dependent opening, exhaustive outcomes,
remaining waits, dominated alternatives, conservation, final turns and
nonrepeatable rewards. The core author also exercised stale-output rejection
in an isolated copy; the production evidence was not edited by that test.

`npm run audit` ran both independent rule oracles. The new camp oracle was
written from the frozen rules before inspecting the runtime implementation.
It then compared every legal history, all available previews and rejected
actions with the actual engine:

| Independent camp check | Original | Revised |
| --- | ---: | ---: |
| Legal history prefixes | 23 | 299 |
| Distinct economic states | 15 | 51 |
| Accepted transitions | 22 | 298 |
| Rejected transitions | 139 | 1,795 |
| Full six-turn histories | 12 | 174 |
| Gross income in every full history | 6 | 6 |

The reachable outcome frontier changes from `(2 people, 1 route)` to
`(6,1)` or `(2,3)`. Neither revised route dominates the other; each meets a
different disclosed objective. A first-turn delay cannot reach either hard
objective. People and routes are outcomes, not spendable supply production.
Read the [independent review](runs/signal-camp/review.md) for full scope.

The original camp configuration still has the recorded SHA-256
`1311086215dd2e785a22786d366842453e630139c9cd1fb163163d2afdfb80ec`.
The [frozen control commit](https://github.com/yiyiwahmo28-hue/game-design-agents/commit/c832596)
includes the executed baseline and shared source. The authorized modular
branch was already present; the original brief requested both versions.

## Actual browser observations

The Browser plugin was attempted and failed with Windows error 1385. Testing
used fresh isolated Edge headless 148.0.3967.70 rather than a personal profile.
The coordinator operated the real controls at desktop size and a 390px mobile
viewport. The [nine-check browser record](runs/signal-camp/browser-verification.json)
includes:

- Original first-turn restrictions and both affordable revised modules.
- Complete rescue and mapping routes, with income/conservation checked after
  every corresponding turn and correct terminal control disabling.
- Changing the objective without changing the played result.
- Language switching, design/evidence views, arrow-key navigation and actual
  strategy playback.
- Mobile manual operation and no horizontal overflow.

The final coordinator pass recorded zero console errors. A separate reviewer
also operated both routes, the original opening, the turn-three late window,
independent panels, reset/replay and mobile controls. Its final English and
Chinese recheck matched all 12 evidence checks and stored outcomes to the
browser's actual engine. These checks are recorded separately in
[independent browser observations](runs/signal-camp/independent-browser-review.json).

The interface author's checks measured all three desktop views at the same
demo size and exercised both languages. Key captured frames were visually
inspected before publication. A mobile viewport is not a physical-device
compatibility study.

## Reusable guidance and demonstration

The portable Skill adds a focused [pacing-redesign reference](../skills/game-design-team/references/pacing-redesign.md).
It distinguishes production, spending and balance, then traces access gates,
opportunity costs and the burden introduced by earlier choices. Its examples
are not universal economy thresholds. The official Skill creator validator
accepted the updated Skill; this is structural validation, not proof of
generalization to unfamiliar projects.

The bilingual homepage GIFs are actual browser captures of Signal Camp,
operated through the same controls available to visitors. Each contains 13
captured frames and 32 seconds of edited playback. They show both objectives,
middle waiting, final ledgers, reasoning and verification. [Capture details](demo.md)
and [state snapshots](assets/demo-capture.json) distinguish the demonstration
from live generation and human observation.

## Scope and remaining questions

The original deliberately constrained case isolates a bundle-purchase gate.
The revision still waits twice, uses another construction action and makes
an incorrect opening consequential sooner. Each hard objective has a unique
successful opening in this small model. The evidence does not prove deep
strategy, enjoyment, understanding, retention or multi-agent superiority.

The [human playtest plan](runs/signal-camp/playtest-plan.md) is explicitly
unexecuted. Generating another game still needs a tool-enabled assistant; the
website contains no live AI backend. The optional native Claude Code adapters
have not been executed in that host.

The [GitHub checks](https://github.com/yiyiwahmo28-hue/game-design-agents/actions/workflows/ci.yml)
and Pages deployment provide separate publication evidence. Release notes
record the deployed revision and the post-deployment browser check.
