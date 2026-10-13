# Your brief → a playable prototype → a verified change

[简体中文](start-your-game.zh-CN.md)

Bring your own game idea. The starter prepares a workspace and a precise prompt; your tool-enabled AI assistant performs the design and implementation. The starter does not call a model. You use the model access already configured in your assistant, and its normal usage costs apply.

You need **Node.js 22 or newer**, Git, and an assistant that can read files, edit code, and run commands, such as Codex or Claude Code. Browser tools are useful for checking the prototype visually. Real subagent tools are optional: the Skill explicitly supports one assistant applying the roles sequentially.

## 1. Prepare your request

```sh
git clone https://github.com/yiyiwahmo28-hue/game-design-agents.git
cd game-design-agents
npm run new -- --name my-game --brief "Build a small browser game about gathering supplies, improving a camp, and exploring. Let the player decide between investing for later and making progress now. Use a static HTML/CSS/JavaScript prototype with no build step."
```

No `npm install` is needed for the starter or the repository's static server. This creates `runs/my-game/`:

```text
brief.md             Your exact request, preserved unchanged
START_HERE.md        Full prompt, including the request and concrete file paths
delivery.json        Expected outputs; initially incomplete
design/              Empty until the assistant creates the design
config/              Empty until it creates the authoritative parameters
prototype/           Empty until it implements the game
evidence/            Empty until it records actual checks and execution
```

For a longer request, save a UTF-8 file and use:

```sh
npm run new -- --name my-game-long --brief-file ./my-brief.md
```

Choose a new name each time. The starter refuses to overwrite an existing directory, even if it is empty. `runs/` is ignored by Git: a local run is not automatically published.

## 2. Let your assistant build the first version

Open this checkout in your assistant. Copy the full prompt printed by the starter, also stored in `runs/my-game/START_HERE.md`, into the conversation. It points to the repository's Skill directly; a separate global Skill installation is unnecessary for this workflow.

The assistant should deliver:

- Design choices, rules, experience hypotheses, and labeled assumptions.
- A configuration file actually consumed by a playable implementation.
- Actual launch instructions and a record of executed behavior checks.
- A factual run log: real delegation or disclosed sequential roles, decisions, defects, and fixes.
- An updated `delivery.json` pointing to the real output files.

The assistant may need a consequential design decision from you. Routine implementation and checks within the request should continue without an approval at every role handoff. If browser tools are unavailable, it must say that browser interaction was not checked.

## 3. Open the result

For the static browser prototype requested above, with the default `prototype/index.html` location, run:

```sh
npm start
```

Open [your local prototype](http://127.0.0.1:4173/runs/my-game/prototype/index.html). The server must remain running. The repository homepage is the published example; your own game is at this separate URL. If the assistant selected a different artifact path or required runtime, follow its actual launch instructions and check why it departed from your static-prototype request.

Play the main loop. Try a successful action, an unavailable action, and the goal or reset condition. Check whether the labels, costs, and effects match the design. A running game still needs human judgment about clarity and enjoyment.

## 4. Request a real change

Once the first version exists, give the assistant a concrete change in the same conversation, for example:

> The first meaningful choice arrives too late. Bring it earlier while keeping the full upgrade path's total price unchanged. Preserve a reproducible baseline before changing it. Explain which rules and files are affected; update the design, configuration, playable behavior, and checks together. Show the before/after results and the tradeoff. Do not treat simulated seconds as human playtest evidence.

Use a constraint that actually applies to your game. This example is not a universal progression target. The assistant should preserve the baseline, record this real request, implement the revision, and compare it under stated assumptions. An earlier choice may have costs elsewhere; ask to see those costs rather than only a green pass label.

## 5. Check that the package is inspectable

```sh
npm run new -- --check ./runs/my-game
```

This checks that the manifest names an execution mode and that the five required artifact files are present and non-empty. The initial empty workspace intentionally fails. A pass proves **file completeness only**: inspect the verification report for actual test commands, browser observations, failures, and unverified hypotheses. Read the run log to see what the assistant really did.

The default manifest expects `design/design.md`, `config/game.json`, `prototype/index.html`, `evidence/verification.md`, and `evidence/run-log.md`. The assistant may update their relative paths to match the implementation. Paths must stay inside the run directory; each required artifact must have its own file. Use `executionMode` of `delegated`, `sequential`, or `mixed` to describe the actual run.

## Other locations and limits

`--lang zh` creates Chinese instructions. `--output ./my-workspace` selects an exact new destination relative to your current directory; an absolute path is also accepted. Existing directories, `..` traversal segments, and symbolic-link ancestors are rejected. With a destination outside this checkout, open it and the referenced Skill in your assistant and use the delivered prototype's launch instructions; the repository's static server only serves files inside the checkout.

The command reads only the brief you provide and the delivery files you explicitly check. It does not read `.env`, access a network, install tools, or invoke agents. A new brief is not guaranteed to produce a good game: quality depends on the request, design decisions, assistant capabilities, and real validation. This workflow is intended for small, inspectable mechanics; production art, multiplayer infrastructure, engine integration, and human playtests need their own scope and evidence.
