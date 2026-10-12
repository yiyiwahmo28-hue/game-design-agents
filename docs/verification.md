# Release verification

Checks performed while preparing v0.1.0 on Windows with Node.js v24.15.0
and an isolated Microsoft Edge 148 browser. These are execution records,
not predictions of what tests might do.

| Check | Result |
| --- | --- |
| Engine, evidence, and CLI tests | 16 passed; includes rejection side effects, resource accounting, bounded policies, and stale-report detection |
| Generated simulation report | Matches current inputs and shared engine |
| Skill format | Official Skill creator validator passed |
| Skills CLI 1.7.2 | Discovered and copied `game-design-team` into an isolated project's Codex skill directory |
| Original first upgrade through browser controls | Four gathers, then upgrade: 48 game seconds |
| Revised first upgrade through browser controls | Two gathers, then upgrade: 28 game seconds |
| Manual revised exploration | Costs 8 supplies and advances exploration; inspected state and displayed time |
| Version switch | Creates a fresh state for the selected configuration |
| Policy switch and automatic play | Revised explore-first completes at 234 game seconds |
| Language and narrow layout | Chinese controls work; 390px viewport has no horizontal page overflow |
| Browser console | No application errors in the verified interaction |

The browser checks used actual page controls and inspected the rendered states.
The README GIFs preserve browser captures, with edited replay timing. They do
not display a live agent conversation. Modeled action seconds are distinct
from wall-clock playback time.

An [independent isolated Skill exercise](evidence/skill-forward-test.md) made a
different, scoped rule change and found a report assumption bug that was fixed
before release. That assistant disclosed sequential role passes and self-review.

The [GitHub checks workflow](https://github.com/yiyiwahmo28-hue/game-design-agents/actions/workflows/ci.yml)
runs behavior tests and report freshness on Node.js 22. Its live status is
shown in the README badge.

## Not established by these checks

- Native Claude Code execution of the optional role adapter.
- Engine integrations beyond this browser example.
- Human comprehension, enjoyment, retention, or economy balance across real players.
- A performance or quality advantage over a single assistant.
