# Working on Game Design Agents

For game design, tuning, or a rule change, read
`skills/game-design-team/SKILL.md` and the references relevant to the task.
Keep the user's intended game, choices, language, and authorized scope.

The browser and simulation share their case's engine: `src/game.mjs` for
Lantern Expedition and `src/harbor.mjs` for Rain Harbor. Change rules through
the relevant engine, not a parallel implementation in the UI. Example
parameters are task-specific, not universal game design standards.

After a behavior or configuration change, run `npm test` and `npm run simulate`.
Inspect the before/after tradeoffs, then run `npm run verify`. For visual changes,
also operate the browser demo and inspect the rendered result. Report any
unavailable checks separately. Do not equate a simulation with a human playtest.

All public examples must be independently authored. Do not import employer
documents, private project identifiers, credentials, or commercial game data.
Publishing and external messages require the user's authorization.

For a new brief, `npm run new -- --name my-game --brief "..."` prepares an
empty delivery workspace and a prompt for a tool-enabled assistant. It does
not call a model. Follow `docs/start-your-game.md`, retain actual handoffs and
checks, and do not label a scaffold, replay, self-review, or simulated player
as a completed independent agent run or human playtest.
