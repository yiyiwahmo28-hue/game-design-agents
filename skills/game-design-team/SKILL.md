---
name: game-design-team
description: Coordinate game system design, economy modeling, prototyping, and evidence review when creating or revising a playable mechanic.
metadata:
  version: "0.3.0"
---

# Game Design Team

Turn a game brief or an existing mechanic into a playable, reviewable change. Preserve the user's intended experience and authorized scope. Use the roles needed for the task; a small balance change does not require a studio of agents or a document for every role.

This skill is self-contained. All required guidance is in this folder. It works as instructions in assistants that support Skills; it does not install a runtime, register custom agents, or require a particular game engine.

## Establish the task

Read the brief and relevant existing artifacts. Reuse the context the user has already provided. Identify:

- The intended player action and experience hypothesis.
- The current rules and their authoritative sources.
- The change requested, allowed files or actions, and completion criteria.
- Confirmed decisions, temporary assumptions, and unresolved questions.

Keep a short baseline with source or revision references. Numerical values, version constraints, target platforms, and publishing permissions are task inputs. Do not import them from another game's example.

When details are missing, make a reversible assumption only if the user's scope permits it and it does not decide a material preference for them. Label the assumption and the observation that would confirm or reject it. For a consequential unresolved preference, show a concrete counterexample or scenario and grounded options; leave dependent work open while continuing independent work. Do not invent an engine API or configuration schema to fill a gap.

Authorization to draft or modify within a stated scope remains valid throughout the task. Routine analysis, edits, and checks in that scope do not need approval at every handoff. Ask when the decision or action exceeds that scope or would resolve a material preference the user has not chosen.

## Select the execution mode

Read [references/roles.md](references/roles.md) when allocating work.

- If the host exposes callable subagents, use its actual delegation tools and available capabilities. Pass the task baseline, relevant role instructions, permitted outputs, and acceptance conditions to each delegate. Parallelize only work with independent inputs and disjoint write ownership.
- If callable subagents are unavailable, perform the necessary roles sequentially in the same conversation. State that this is one assistant applying several perspectives. Do not invent agent messages or claim that a self-review is an independent review.
- Optional host-specific role files may exist in a complete repository. Their presence alone does not prove the host has loaded them. Do not assume a particular tool, model, or native custom-agent registration.

The coordinator owns integration and open decisions. Specialists own their assigned artifacts, not every file suggested by their job title. Route a defect by the actual execution path: a table, implementation, simulator, or presentation may be responsible regardless of who reported it.

## Deliver a new game brief

For a new playable mechanic or an end-to-end delivery, read [references/delivery.md](references/delivery.md). Carry the brief through decisions, authoritative configuration, actual implementation, execution, and review. Deliver the relevant design explanation, parameters, playable build, verification record, and factual run log; reuse existing equivalents instead of imposing a new folder layout on every task.

A repository starter may provide a brief, empty output directories, and a delivery manifest. These are preparation, not generated work or proof that agents ran. Fill the real artifacts, record actual execution mode, and provide working launch instructions. A file-completeness check only detects absent deliverables.

When a revision is requested, retain a reproducible baseline, trace the affected consumers, apply the authorized change, and verify both the intended difference and preserved constraints. Do not invent a second user request or playtest feedback to make the workflow appear complete.

## Make and propagate the change

Choose the smallest useful loop:

1. **Design:** make triggers, conditions, state transitions, parameters, and observable outcomes explicit. Preserve unanswered questions instead of disguising them as requirements.
2. **Model:** identify the relevant pacing, choice, or feedback hypothesis. Read [references/experience-review.md](references/experience-review.md) for criteria and limits. Use existing models or a justified lightweight model; do not require simulation for an editorial change.
3. **Prototype:** implement the agreed behavior through the real configuration and execution path. Discover existing interfaces before editing. Add a new contract only when the task needs one, and record the decision.
4. **Review:** inspect the resulting artifacts and evidence. Exercise the changed behavior, not just the wording of the specification. Resolve clear defects within scope; distinguish design alternatives from defects.

When a rule changes, identify affected specifications, parameter sources, simulator inputs, runtime behavior, presentation, and acceptance cases. Update those that actually exist and matter to the change. Record omitted or unverified dependencies. Keep unrelated work intact; do not regenerate or rewrite a whole project to make a narrow change easier.

When the request concerns early waiting, unlock order or bringing a choice forward under an economic constraint, read [references/pacing-redesign.md](references/pacing-redesign.md). Separate income, spending and balance; identify the blocking gate, compare alternatives from the same state, and report the costs of an earlier decision.

For ongoing work, use the short handoff in [references/handoff.md](references/handoff.md). That file also contains an optional brief template. A handoff needs only the baseline, decision rationale, artifacts, and acceptance evidence or remaining gaps. Reuse existing documents instead of duplicating every rule in several reports.

## Judge the result

Keep these claims separate:

- **Specified:** the rule has been agreed or an assumption has been recorded.
- **Checked:** an artifact or calculation satisfies a named check.
- **Executed:** the relevant implementation or prototype was run in a stated environment.
- **Observed:** a person or an inspecting agent saw the behavior and retained evidence.
- **Experience supported:** playtest observations support a stated hypothesis for a stated audience and situation.

A parse check does not demonstrate runtime behavior. A model result does not demonstrate that people understand the choice. A working prototype does not establish that the game is fun. Name missing evidence without treating the entire task as blocked when useful authorized work remains.

Return the actual change, the reason for it, the artifacts to inspect, the checks completed, and the unresolved decisions or validation gaps. Compare candidate designs against the intended experience; do not impose fixed reward rates, session lengths, or difficulty curves as universal quality standards.

## Original example

**Lantern Expedition** is an illustrative original brief: the player gathers a resource, spends it on upgrades that improve gathering efficiency, or spends that same resource on exploration toward a goal. Use it to examine the timing and consequences of investing in efficiency versus advancing immediately. Its parameter values, detailed configuration, and implementation APIs must come from the current task or inspected project. This installed skill contains no demo application or executable commands.

The method is inspired by the author's work on game systems and cross-role delivery. These public instructions and examples are newly written; they contain no employer documents or project configurations.
