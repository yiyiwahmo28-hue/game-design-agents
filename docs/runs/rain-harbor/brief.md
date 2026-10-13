# Rain Harbor / 雨港救援 — original task brief

This fictional brief was authored for the public v0.2 execution exercise on
2026-10-13. It is not a customer request, an employer project, or a claimed
human playtest. The following work is performed by actual delegated assistants
using the repository's `game-design-team` Skill.

## Request

Create a small browser game about rescuing boats before a storm closes a harbor.
The player should face a visible choice between preparing the rescue boat and
saving people immediately. Different stranded boats should have different fuel
costs and passenger counts. Every accepted action advances the storm; impossible
actions should explain why they cannot run without spending a turn.

Keep one shared fuel resource, a short fixed turn budget, and a deterministic
world so that a player can learn by comparing attempts. Show each action's cost
and outcome before clicking. At the end, show people rescued and the remaining
boats. It must work on desktop and mobile without an account, server, or API key.

## Authorized scope and decisions

- The coordinator may select reversible design details and parameters, with the
  rationale and tradeoffs recorded. No monetization, private project data, or
  external services.
- Deliver a compact complete design document, editable configuration, a shared
  executable rules module, a playable browser prototype, and verification.
- A separate follow-up change will be sent after the first implementation has
  been run. Preserve the original version for comparison.
- Use actual delegation where available. Record which responsibilities were
  combined and distinguish independent review from self-review.

## Experience hypothesis and acceptance

Players can explain why they prepared or rescued first, using visible costs and
remaining turns. This hypothesis needs human observation; code checks alone do
not establish it.

The prototype must expose the preparation/rescue tradeoff, reject unaffordable
or repeated rescues without mutation, end at the agreed boundary, share rules
between browser and verification, and retain evidence for any reported result.
