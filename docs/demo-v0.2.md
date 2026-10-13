# The homepage demo and GIFs

The v0.2 homepage follows a completed **Rain Harbor** delivery through five
steps: brief, design and handoffs, playable prototype, a follow-up request,
and verification. The work was actually performed by delegated assistants;
its [retained case](runs/rain-harbor/README.md) explains who did what.

The page is a recorded workflow viewer with a working game. It does **not**
call a model, stream an agent conversation, or show simulated “thinking.”
Opening a step displays the retained work and links to its source.

- [English GIF](https://raw.githubusercontent.com/yiyiwahmo28-hue/game-design-agents/v0.2.0/docs/assets/demo-en.gif) · [English still](https://raw.githubusercontent.com/yiyiwahmo28-hue/game-design-agents/v0.2.0/docs/assets/demo-en.png)
- [中文 GIF](https://raw.githubusercontent.com/yiyiwahmo28-hue/game-design-agents/v0.2.0/docs/assets/demo-zh-CN.gif) · [中文静态图](https://raw.githubusercontent.com/yiyiwahmo28-hue/game-design-agents/v0.2.0/docs/assets/demo-zh-CN.png)
- [Interactive workflow](https://yiyiwahmo28-hue.github.io/game-design-agents/harbor.html)
- [Capture sequence and actual game states](https://raw.githubusercontent.com/yiyiwahmo28-hue/game-design-agents/v0.2.0/docs/assets/demo-capture.json)

## What was recorded

Both GIFs were captured from the real local browser page while operating its
controls. The following sequence uses the same game rules as the public page:

1. Open the original fictional brief.
2. Show the actual responsibility handoffs and artifact links.
3. Open the original playable build. Prepare, refuel twice, then rescue the
   ferry. The game reports ten people saved.
4. Open the follow-up request: one undo per run, while preserving the original
   version and economic parameters.
5. Switch to the revised playable version, which starts fresh. Rescue the skiff:
   fuel becomes zero, four people are saved, and one turn is used.
6. Click undo. Fuel returns to four, rescued people to zero, and all seven
   turns are available again. The allowance stays spent.
7. Open the actual generated verification results and source links.

The screenshots retain browser pixels. Replay durations are edited for
legibility; no agent messages, gameplay outcomes, progress bars, or result
labels are composited into the captures. This is a replay of completed work,
not a measurement of agent execution speed.

## Repeat the interaction

Run `npm start`, then open `http://127.0.0.1:4173/harbor.html?step=brief`. Follow the steps
above using the page controls. Add `lang=zh` to use Chinese. Tabs also support
arrow-key navigation. Changing versions starts a fresh run; changing language
does not change the game state.

All action costs, previews, and state changes come from `src/harbor.mjs`.
The generated evidence executes that same module. The independent oracle in
`scripts/review-harbor.mjs` implements the written rules separately for
comparison.

To inspect terminal undo, play all seven turns in the revised version,
then undo the final action. The prior turn is reopened, with the allowance
spent. See the [independent review](runs/rain-harbor/review.md) for a specific
action sequence and observed values.

## What the evidence means

`npm test` exercises behavior and tools. `npm run audit` compares the game
against the independent rule oracle. `npm run verify` checks that stored
evidence matches the current model and inputs. The [release record](verification-v0.2.md)
covers actual browser operation and the checks performed.

Recorded model strategies and an assistant observing the screen are not human
playtests. They do not prove that players understand the preparation tradeoff,
prefer undo, or find the game enjoyable. Those questions remain open.

## Earlier example

[Lantern Expedition](https://yiyiwahmo28-hue.github.io/game-design-agents/lantern.html)
remains playable at `/lantern.html`. Its [original case](example.md),
[simulation evidence](evidence/simulation.md), and
[v0.1 verification](verification-v0.1.md) remain available. The homepage GIFs
now demonstrate the complete Rain Harbor workflow.
