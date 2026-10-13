# A small game design collaboration loop

[中文](workflow.zh-CN.md)

This project turns a brief into agreed behavior, a model or prototype, and inspectable evidence. Its five roles cover decisions that often cross design, economy, implementation, and review. Activate only the roles that the task needs.

The design method is inspired by the author's game systems work. All public instructions and the Lantern Expedition example are newly written and contain no employer documents, configurations, or project assets.

## Use the complete repository

For a new idea, follow the [first-run guide](start-your-game.md) and run
`npm run new -- --name my-game --brief "Your game brief"`.
This prepares an isolated workspace and a complete prompt. Execute that prompt
in an assistant with file and command tools, then launch its delivered prototype.
The starter does not call a model or generate the game itself.

The [Rain Harbor execution record](runs/rain-harbor/README.md) retains an original
brief, design handoffs, first implementation, follow-up revision, independent
review, and reproducible evidence. The retained `/harbor.html` page replays those artifacts and
provides the actual playable versions. The homepage now presents the
[Signal Camp redesign](runs/signal-camp/README.md): unchanged income and prices,
earlier functional access, and explicit opportunity costs.

Describe the intended player experience, current behavior, requested change, and what the assistant may edit or run. Existing authorization remains valid within that scope. A balance adjustment need not trigger a new approval at every role boundary.

Ask an assistant to use the [game-design-team skill](../skills/game-design-team/SKILL.md). The assistant first checks its actual delegation capabilities. When real subagents are available, it can allocate independent analysis or nonoverlapping edits. Otherwise it applies the roles sequentially and states that the review is a self-review.

Lantern Expedition is the original illustrative example: gathering produces a resource; upgrading spends it to improve gathering efficiency; exploring spends the same resource to advance toward the goal. Inspect the repository's current rules, configuration, and simulator interfaces before changing the example. This workflow does not define their detailed schema or API.

From the complete repository, inspect `package.json` and use the provided entry points:

```sh
npm test
npm run simulate
npm start
```

These commands belong to the demo repository. They are unavailable when only the skill folder has been installed. A command's output supports only the behavior it actually checked; starting the application is not the same as observing or playtesting it.

## Use only the portable skill

Install the complete `skills/game-design-team/` directory, including its references, into a Skills location supported by your assistant. Follow that host's discovery instructions, then request `game-design-team` by name or use its supported invocation syntax.

The skill needs no top-level repository file, package, executable, engine, or MCP server. It can operate on your own game's brief and available artifacts. It provides role guidance, not a subagent runtime.

The skill's `agents/openai.yaml` is skill UI metadata. It does not register five native Codex custom agents. Native Codex custom-agent integration is not included or claimed.

## Optional Claude Code adapter

The complete repository includes five project role definitions in `.claude/agents/`. They use the required `name` and `description` frontmatter, leaving model and tool selection to the host. The prompts retain scope, decision, and evidence boundaries.

Launch Claude Code from this repository and ask it to delegate a suitable task to one of those role names. A host must actually discover and invoke the definitions for this to be a subagent run. If a new agents directory was created during a session, follow the host's reload instructions.

The file structure and frontmatter have been checked against the [official Claude Code subagent documentation](https://code.claude.com/docs/en/sub-agents). The adapter has not been executed in a Claude Code host. These files do not supply a runtime, choose a fixed model, or add external permissions.

## Role boundaries

- **design-lead:** owns scope, experience hypotheses, tradeoffs, and integration.
- **systems-designer:** owns behavior, parameter references, and acceptance scenarios.
- **economy-designer:** owns resource modeling, progression assumptions, and consequence comparisons.
- **prototype-developer:** owns implementation through real interfaces and execution evidence.
- **playtest-reviewer:** owns artifact and observation review, with explicit evidence limits.

Responsibilities route by the real execution path. A reported configuration problem may require code, and a runtime defect may require a rule decision. The coordinator passes relevant instructions and artifacts to each delegate and assigns write ownership; a role title is not permission to modify everything in its domain.

## Handoff and completion

Use the [minimal handoff](../skills/game-design-team/references/handoff.md): baseline, decision reason, artifacts, acceptance evidence, and remaining gaps. Reuse existing context. Do not reproduce every rule in several documents.

When a rule changes, review its relevant specification, parameter, model, runtime, presentation, and acceptance consumers. Record what was synchronized and what remains unverified. If a material experience preference is unresolved, show a concrete consequence and options instead of choosing it silently.

Use the [experience review criteria](../skills/game-design-team/references/experience-review.md) to examine pacing, meaningful choices, and feedback under the task's actual goals. Parameter values and version conventions are task inputs. They are not definitions of good experience.

Finish with inspectable results and precise claims: specified, checked, executed, observed, or supported by a human playtest. A model can expose a tradeoff; it cannot establish player enjoyment. Record missing runtime or playtest evidence and the next useful step.
