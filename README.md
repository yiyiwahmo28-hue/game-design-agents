<div align="center">

<img src="docs/assets/logo.svg" width="72" height="72" alt="Game Design Agents" />

# Game Design Agents

**Give your AI a game brief. Get a playable prototype. Change the rules and verify the result.**

A design-to-delivery workflow for tool-enabled AI assistants, with an original case you can inspect and play.

[![Version](https://img.shields.io/badge/version-0.2.0-176b61?style=flat-square)](package.json) [![Checks](https://github.com/yiyiwahmo28-hue/game-design-agents/actions/workflows/ci.yml/badge.svg)](https://github.com/yiyiwahmo28-hue/game-design-agents/actions/workflows/ci.yml) [![MIT](https://img.shields.io/badge/license-MIT-176b61?style=flat-square)](LICENSE)

[**Explore the real run & play**](https://yiyiwahmo28-hue.github.io/game-design-agents/) · [Start your game](#start-your-game) · [中文](README.zh-CN.md)

</div>

> “Make a game about rescuing boats before a storm. Preparing the boat and rescuing people now should both be meaningful choices.”

<img src="docs/assets/demo-en.gif" width="1100" alt="Real delivery replay: brief, design handoff, playable prototype, follow-up rule change, and verification" />

*Actual browser captures of the completed execution record and working prototype, edited for length. The page replays retained artifacts; it does not call a model or simulate agents thinking. [Capture details](docs/demo.md) · [Full case](docs/runs/rain-harbor/README.md).*

## The problem

Your assistant writes a design, another prompt produces a prototype, and a later rule change leaves the document, configuration, and game disagreeing. You have to discover the gaps yourself.

This Skill carries a brief through design decisions, implementation, and checks. A change request includes its affected artifacts and the evidence needed to accept it.

| You provide | You can inspect |
| --- | --- |
| A new gameplay brief | Design choices, rule specification, editable inputs, and a working prototype |
| A change request | Its impact, updated behavior, preserved constraints, and before/after checks |
| A result to review | Actual runs and findings, with missing evidence stated explicitly |

## Start your game

Requires Node.js 22+ and an AI coding assistant that can read files, edit them, and run commands. No dependencies to install for the included tools.

```sh
git clone https://github.com/yiyiwahmo28-hue/game-design-agents.git
cd game-design-agents
npm run new -- --name my-game --brief "A rescue game with fuel, stranded boats, and a storm deadline."
```

**Paste the printed prompt into your assistant with this repository open.** It points to the Skill and your new workspace. The command prepares files; your assistant performs the design and implementation using its own model and tools. Follow the generated `START_HERE.md` to inspect the delivery, run it, and request a change.

[Step-by-step guide and expected outputs →](docs/start-your-game.md)

<details>
<summary>Use the Skill in an existing project</summary>

```sh
npx skills add yiyiwahmo28-hue/game-design-agents --skill game-design-team
```

Ask your assistant to use `game-design-team` with your brief or change request. The standalone Skill is self-contained; it does not include this repository's demo or CLI.

</details>

<details>
<summary>Run the published examples locally</summary>

```sh
npm start
```

Open `http://127.0.0.1:4173` for the Rain Harbor execution replay and playable prototype. The earlier [Lantern Expedition](https://yiyiwahmo28-hue.github.io/game-design-agents/lantern.html) remains available at `/lantern.html`.

`npm test` runs behavior and tool tests. `npm run simulate` regenerates evidence for both cases; `npm run verify` checks it against the current inputs and engine.

</details>

## A real brief → prototype → revision

**Rain Harbor** started from a [new fictional brief](docs/runs/rain-harbor/brief.md). The coordinator delegated system/economy design and core implementation, assigned the browser interface separately, and followed the first implementation with a new change request and independent review.

The [complete case](docs/runs/rain-harbor/README.md) retains the design, actual handoff summaries, executable inputs, revision request, results, and limits. Responsibilities were combined where useful; the execution mode is recorded.

The homepage makes the work inspectable and lets you play the result. The game and verification import the same rules module. Deterministic checks can be reproduced locally; generating a new game still requires your assistant and will vary by host and model.

## How the team works

| Responsibility | Owns |
| --- | --- |
| Design lead | Player goal, scope, choices, and integration |
| Systems designer | Rules, boundaries, and acceptance scenarios |
| Economy designer | Resource tradeoffs, assumptions, and scenario results |
| Prototype developer | Running behavior through real code and configuration |
| Playtest reviewer | Findings supported by artifacts and observations |

Use the roles the task needs. Where the host supports callable subagents, delegate real work with explicit ownership. Otherwise, apply the roles sequentially and disclose self-review. [Workflow and compatibility →](docs/workflow.md)

## What the evidence supports

- A completed original case and a follow-up change, with retained implementation and verification artifacts.
- Deterministic game behavior and reproducible scenario results.
- An installable Skill and a workspace starter for your own briefs.

The browser has no model backend. Tests do not establish player enjoyment, human comprehension, or multi-agent superiority. No controlled quality benchmark is claimed. Optional `.claude/agents/` definitions have not been exercised end to end in Claude Code. A generated workspace's completeness check confirms files exist; inspect and run them before accepting the work.

## Contribute

Try your own brief and report a concrete failure: the input, expected behavior, actual artifacts, and host used. New reproducible cases and repairs are welcome.

[Contribution guide](CONTRIBUTING.md) · [Open an issue](https://github.com/yiyiwahmo28-hue/game-design-agents/issues) · [Verification](docs/verification.md)

The method draws on game systems design and cross-role delivery. Public examples and instructions are independently authored and contain no employer documents or internal game data. [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) inspired the studio direction; this project is independent and unaffiliated. For general requirements writing, see [Write Clear Spec](https://github.com/yiyiwahmo28-hue/write-clear-spec).

## License

[MIT](LICENSE). `private: true` prevents accidental npm publication; the repository is open source.
