# Signal Camp: homepage demo and actual recording

The homepage opens a playable before/after comparison. Both panels run the
same rules module, `src/camp.mjs`, with separate original/revised inputs. The
design view explains the purchase gate and the accepted costs. The verification
view computes outcomes and checks them against the retained evidence.

- [English GIF](assets/demo-en.gif) · [English still](assets/demo-en.png)
- [中文 GIF](assets/demo-zh-CN.gif) · [中文静态图](assets/demo-zh-CN.png)
- [Actual captured states and timings](assets/demo-capture.json)
- [Complete case and rationale](runs/signal-camp/README.md)

## The recorded sequence

Each language's recording contains 13 browser frames and 32 seconds of edited
playback. It was recorded by operating real controls, not by inserting state
values into the page:

1. Show the common initial stock and the original's waiting-only opening.
2. Advance both panels: original waits; revision builds the beacon.
3. Advance both again: original still waits; revision signals and evacuates six.
4. Continue through the actual middle waits and remaining construction/missions.
5. At turn six, compare the original's `2 people / 1 route` with revised
   `6 / 1`. Both ledgers show income 6, spent 8, balance 1, with initial stock 3.
6. Open the design explanation: functional partial purchase, unchanged total
   price, disclosed deadline and one extra construction action.
7. Change the assignment to routes. The existing rescue outcome is preserved
   and no longer meets that objective; the comparison does not rewrite it.
8. Reset and actually play the survey-first route. It reaches three routes on
   turn two and completes with `2 people / 3 routes` and the same supply ledger.
9. Open the computed outcome matrix and the accepted costs.

The PNG screenshots retain browser pixels; GIF encoding changes palette and
playback timing only. No game results, captions, agent dialogue or progress
indicators were composited. Captured frames are a selected walkthrough, not an
unedited video or a measurement of generation time.

## Repeat it

Run `npm start`, open `http://127.0.0.1:4173/?lang=zh`, and use the two panels.
Original: **wait → wait → wait → bundle → signal → survey**.
Revised rescue: **beacon → signal → wait → wait → tools → survey**.
Revised routes: **tools → survey → wait → wait → beacon → signal**.

Each successful action ends with the same supply delivery. The income that
arrives after an action cannot pay for that action in advance. An unavailable
action must leave the full state unchanged.

Changing the objective re-evaluates the current outcome and preserves progress.
Reset starts fresh. The from-start strategy button performs actual sequential
engine actions for the selected objective; it does not represent an AI agent
making decisions. Changing language preserves the game.

## What is demonstrated

The original waits for a complete purchase; the revision makes a functional
allocation possible earlier without changing supplies or listed prices. The
right opening depends on the disclosed assignment. This is a deliberately
small planning case; each assignment has one successful opening.

The revision still waits in the middle, requires another construction action,
and demands earlier understanding. No human playtest was conducted, so the
recording does not establish player preference, comprehension or retention.
The [release verification](verification.md) describes actual program and
browser checks, including their scope.

## Previous examples

[Rain Harbor](https://yiyiwahmo28-hue.github.io/game-design-agents/harbor.html)
remains playable with its [v0.2 recording documentation](demo-v0.2.md).
[Lantern Expedition](https://yiyiwahmo28-hue.github.io/game-design-agents/lantern.html)
also remains available. Their game engines and configurations are unchanged.
