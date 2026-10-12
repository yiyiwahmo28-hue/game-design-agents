# Demo and verification

The README GIFs show the actual **Lantern Expedition** browser interface,
captured while operating its controls and edited into a short replay. They
are not recordings of a live AI model or a fabricated multi-agent chat.

- [English GIF](assets/demo-en.gif) · [English still](assets/demo-en.png)
- [中文 GIF](assets/demo-zh-CN.gif) · [中文静态图](assets/demo-zh-CN.png)
- [Playable demo](https://yiyiwahmo28-hue.github.io/game-design-agents/)
- [Authored change brief](example.md) · [Computed evidence](evidence/simulation.md)

## Reproduce the interaction

1. Run `npm start` in a complete clone, then open `http://127.0.0.1:4173`.
2. In the original version, gather four times and buy the first upgrade.
   The game clock includes four gathering actions and the upgrade action.
3. Switch to the revised version, which starts a fresh expedition. Gather
   twice and buy the first upgrade.
4. Use the automatic play control to watch a named policy run through the
   same engine, or make your own gathering, upgrading, and exploration choices.
5. Inspect the comparison for both policies. Switch the interface language
   to Chinese and repeat. The language changes presentation, not game rules.

The displayed seconds are **modeled game time**, accumulated per accepted
action. They are not wall-clock time spent clicking or the speed of an agent.
Automatic playback compresses those game seconds for viewing.

## What is verified

The engine tests exercise behavior and state invariants. `npm run verify`
checks that committed simulation evidence still matches the current model
and inputs. Browser checks inspect the actual interface, interactions, version
switches, language switch, and narrow layout. The release evidence records the
[checks actually run and their limits](verification.md).

Neither automated policies nor an agent inspecting the screen count as a human
playtest. The release does not claim that the revised loop is more enjoyable,
that all engines are supported out of the box, or that a multi-agent workflow
has been benchmarked against a single assistant.
