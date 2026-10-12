<div align="center">

<img src="docs/assets/logo.svg" width="76" height="76" alt="Game Design Agents logo" />

<h1>Game Design Agents</h1>

**Your AI game design team. From an idea to a playable system.**

Design the rules. Tune the numbers. Play the result. Keep them in sync when things change.

[![Version](https://img.shields.io/badge/version-0.1.0-176b61?style=flat-square)](package.json) [![Checks](https://github.com/yiyiwahmo28-hue/game-design-agents/actions/workflows/ci.yml/badge.svg)](https://github.com/yiyiwahmo28-hue/game-design-agents/actions/workflows/ci.yml) [![MIT](https://img.shields.io/badge/license-MIT-176b61?style=flat-square)](LICENSE)

[**Play the demo**](https://yiyiwahmo28-hue.github.io/game-design-agents/) · [Quickstart](#quickstart) · [How it works](docs/workflow.md) · [简体中文](README.zh-CN.md)

</div>

## See a design change become playable

> “The first upgrade takes too long. Bring it forward without reducing the cost of the full upgrade path.”

<div align="center">
<img src="docs/assets/demo-en.gif" width="1000" alt="The playable Lantern Expedition demo switching between original and revised rules, gathering resources, upgrading and comparing simulated outcomes" />
</div>

*Browser captures of the original example, edited into a short replay. This is a working deterministic game, not a live AI session. [Evidence and reproduction](docs/demo.md) · [Static preview](docs/assets/demo-en.png).*

Try both versions, make your own choices, and compare the results under two explicit play policies. The browser and simulator use the **same game engine**. The [checked-in report](docs/evidence/simulation.md) shows the assumptions, numbers, and tradeoffs.

## Why use it?

An AI can write a design document, a balance table, and a prototype that quietly disagree. A new rule can fix the opening minutes while changing the rest of the game.

Game Design Agents gives your assistant a workflow for making those decisions and following them through. It is for solo developers and small teams who want a design partner while building or changing a game.

| Your request | What the team works through |
| --- | --- |
| “Turn this mechanic into a playable loop.” | Experience goal → rules → parameters → prototype → observable acceptance |
| “This progression feels slow.” | Player-behavior assumptions → options → calculations → playable comparison |
| “Change this reward rule.” | Confirmed decision → affected artifacts → implementation → regression evidence |

The example is small enough to inspect. The workflow can be applied to your own project; integrations with your engine and data pipeline must be implemented and verified there.

## Quickstart

**Play now:** [open the browser demo](https://yiyiwahmo28-hue.github.io/game-design-agents/). No account or API key.

**Give your assistant the team** with the [Skills CLI](https://github.com/vercel-labs/skills):

```sh
npx skills add yiyiwahmo28-hue/game-design-agents --skill game-design-team
```

Then ask:

```text
Use $game-design-team to design a small exploration game.
I want gathering, upgrading, and exploration to compete for the same resource.
Help me choose a first playable loop, then implement and verify it in this workspace.
```

The skill uses your assistant's existing model and tools. When the host supports delegation, the coordinator can dispatch independent work. Otherwise it performs transparent, sequential role passes. It does not run a separate agent service.

<details>
<summary>Run and modify the included example locally</summary>

Requires Node.js 22 or newer. No dependency installation is needed.

```sh
git clone https://github.com/yiyiwahmo28-hue/game-design-agents.git
cd game-design-agents
npm start
```

Open `http://127.0.0.1:4173`. Run `npm test` to test the engine, `npm run simulate` to regenerate the evidence, and `npm run verify` to detect stale reports.

This is a source repository; `private: true` in `package.json` prevents accidental npm publication and does not restrict the MIT license.

</details>

<details>
<summary>Manual installation and Claude Code roles</summary>

Copy the complete [`skills/game-design-team`](skills/game-design-team) folder into a skill directory supported by your assistant. Keep its references and metadata together. Named invocation syntax depends on the host.

For Claude Code, this repository also includes five optional [native subagent definitions](.claude/agents/). Work in the cloned repository, or copy the definitions into your project's `.claude/agents/` without overwriting your existing files. The coordinator instructions remain in the portable skill. See [setup and compatibility](docs/workflow.md).

The definitions are provided as a host adapter; Claude Code execution has not been end-to-end tested in this release.

</details>

## Five roles, concrete handoffs

| Role | Delivers |
| --- | --- |
| Design lead | The experience goal, constraints, decisions, and accepted tradeoffs |
| Systems designer | Rules, state transitions, edge cases, and acceptance scenarios |
| Economy designer | Editable parameters, formulas or simulations, and tuning consequences |
| Prototype developer | A playable implementation of the agreed rules |
| Playtest reviewer | Expected versus observed behavior, reproduction steps, and remaining questions |

Each handoff names the baseline, decisions, artifacts, and evidence. The coordinator integrates shared changes; dependent tasks wait for their inputs. See the [workflow](docs/workflow.md) and [role instructions](skills/game-design-team/references/roles.md).

## What ships in v0.1

- A portable **game-design-team Skill**, plus optional Claude Code role files.
- **Lantern Expedition**, an independently authored, playable browser example.
- Two rule configurations, one shared engine, and reproducible before/after simulations.
- Automated behavior checks, bilingual documentation, and a visual walkthrough.

The browser example has no model backend. Simulations measure outcomes under stated play policies; they do not establish that a game is fun. This release makes no measured claim that multiple agents outperform a single assistant.

## Learn and contribute

- [Workflow and setup](docs/workflow.md)
- [Experience review: goals, choices, feedback, and pacing](skills/game-design-team/references/experience-review.md)
- [Original change brief and design decisions](docs/example.md)
- [Simulation evidence](docs/evidence/simulation.md) · [Visual evidence](docs/demo.md)
- [An actual isolated Skill exercise](docs/evidence/skill-forward-test.md)
- [Contributing](CONTRIBUTING.md) · [Report a problem](https://github.com/yiyiwahmo28-hue/game-design-agents/issues)

Created from a game systems designer's working methods. All examples and instructions here are independently written for public use; no employer documents or private game data are included. [Write Clear Spec](https://github.com/yiyiwahmo28-hue/write-clear-spec) is a companion for general requirements work.

[Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) inspired the exploration of a studio-shaped workflow. This project is independently implemented and is not affiliated with that project, Anthropic, or OpenAI.

## License

[MIT](LICENSE).
