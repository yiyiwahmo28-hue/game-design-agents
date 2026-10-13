# Release verification — v0.2.0

This record describes checks actually performed on Windows with Node.js
v24.15.0 and isolated Microsoft Edge browser instances. It is separate from the
[historical v0.1.0 verification](verification-v0.1.md).

## New-brief delivery and independent review

The [Rain Harbor case](runs/rain-harbor/README.md) retains its original brief,
design, real delegation summaries, first engine and browser observations,
follow-up request, revision, and independent review.

An independent reviewer implemented a separate transition oracle from the
written rules. The baseline covered **217 reachable states, 441 accepted
transitions, and 1,078 rejected transitions**. The revised model covered
**659 states including history and allowance, 1,653 accepted transitions,
3,619 rejected transitions, and 441 valid undos**, including 176 from ended
states. An additional one-boat fixture checked undo after early completion.

The reviewer checked the original configuration's SHA-256, equality of all
economic parameters, and the policy outcomes with no undo: 12 / 18 / 18 people
in both versions. Those are declared policies and an ideal-information
optimization; they are not measured player outcomes. Read the
[independent review](runs/rain-harbor/review.md) for scope and findings.

The independent oracle is public: run `npm run audit` to reproduce that same
state comparison and counts. It is also included in CI.

A real presentation defect was found during revision review: the revised
interface still said every accepted action advances the storm. The interface
was corrected to distinguish refuel / prepare / rescue from undo.

## Reproducible checks

`npm test` passed **42 tests**, with zero failures and skips. It exercises both shared engines, undo and state invariants, the
first-run starter, and evidence tooling. `npm run verify` recomputes both cases'
reports and rejects missing or stale output. The Rain Harbor report contains
**10 passing named assertions** and the actual traces behind them.

The starter was independently run in new isolated English and Chinese
workspaces. UTF-8 text, multiline content, BOM and CRLF input were preserved;
prompt references resolved; overwrite attempts were refused. An empty
workspace correctly failed its completeness check. A passing completeness
check establishes the declared files exist, not that an assistant ran or that
the game is good.

The official Skill creator validator accepted the updated Skill. The prior
release's installer exercise is retained in its historical record; no new
Claude Code native-adapter execution is claimed.

## Browser observations

The first prototype was operated before the follow-up request. Final browser
checks cover:

- The original preparation and rescue behavior through actual controls.
- Rescue, preparation and refuel undo; the allowance remains spent.
- Undo after storm closure, reopening the prior turn, then continued play.
- Reset and version switching, with a fresh allowance only for a fresh run.
- English / Chinese display, arrow-key workflow navigation, and a 390px layout.
- Actual retained brief, design handoffs, revision and evidence in the five steps.

The [browser record](runs/rain-harbor/browser-verification.json) lists the final
coordinator checks. Browser inspections are performed by assistants; no human
playtest has been conducted.

## Demonstration provenance

The README GIFs contain real browser captures of the completed workflow viewer
and actual gameplay. Playback is edited for length. The recorded viewer makes
the retained collaboration inspectable; it does not portray agents currently
running. [Capture details and state snapshots](demo-v0.2.md).

Each language's GIF contains 12 captured frames at 1240 × 932 pixels, with
28.75 seconds of edited playback. The English file is 679,990 bytes and the
Chinese file is 690,249 bytes. Key frames were visually inspected, and both
GitHub-rendered README previews loaded their local logo and GIF successfully.
The [release review image](https://raw.githubusercontent.com/yiyiwahmo28-hue/game-design-agents/v0.2.0/docs/assets/release-review.png) summarizes the impact,
executed checks, remaining limits, and review focus.

The [GitHub verification workflow](https://github.com/yiyiwahmo28-hue/game-design-agents/actions/workflows/ci.yml)
runs the actual test suite and report checks on Node.js 22. The README badge
reports its live state.

## Limits

No controlled comparison against a single assistant, human comprehension or
enjoyment study, retention study, or untested game-engine integration is
claimed. The browser demo needs no model backend; generating another game
requires a tool-enabled assistant. The published case is an original fictional
exercise, with no employer documents or customer data.
