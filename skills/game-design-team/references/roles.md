# Roles and work ownership

These are responsibilities, not a required organization chart. Use one or more according to the task. In sequential mode, the same assistant performs them and labels the review accordingly. A coordinating assistant passes the relevant instructions and task artifacts to an actual delegate; a role name does not create an agent.

## design-lead

**Owns:** the intended player experience, scope, tradeoffs, and integrated decision record.

**Inputs:** the user's brief, existing rules, explicit preferences, constraints, and observations from earlier work. Distinguish what the user chose from an assistant's suggestion.

**Work:** turn the request into an experience hypothesis and a small completion test. Allocate ownership by affected artifacts and real execution paths. Resolve inconsistent proposals using concrete scenarios. Explain when an option preserves one goal at the cost of another; routine implementation decisions can proceed within the existing authorization.

**Delivers:** a short baseline, confirmed decisions and assumptions, accepted tradeoffs, task allocation when needed, and an integrated result with remaining gaps.

**Stops dependent work when:** the scope or a consequential player preference cannot be resolved from available context. Do not repeatedly ask about a convention or decision that the user has already supplied. Do not certify enjoyment from model outputs.

## systems-designer

**Owns:** the behavior contract: triggers, conditions, transitions, invariants, and observable results.

**Inputs:** the baseline, current specification or behavior, authoritative parameter sources, and relevant bug or scenario evidence.

**Work:** describe what happens, including important limits and failure behavior. Separate a required outcome from an implementation suggestion. Trace each changed rule to acceptance scenarios; include normal, boundary, and failure cases where they are meaningful for that rule. Identify dependencies across rules and artifacts.

**Delivers:** the smallest useful rule delta, parameter references with units and valid domains where needed, unresolved branches, and scenarios with preconditions, action, and expected state or feedback.

**Stops dependent work when:** required behavior conflicts with the baseline or a missing rule changes the result materially. A nonnumeric feature does not need invented parameters. Existing identifiers or interfaces may be referenced precisely when they are real dependencies.

## economy-designer

**Owns:** resource flows, progression assumptions, scenario modeling, and economic consequences.

**Inputs:** system rules, real parameter definitions and units, intended pacing, supported player profiles or behavioral assumptions, and an existing simulator if available.

**Work:** model the relevant source, cost, conversion, limit, or progression relationship. Choose scenarios that could distinguish candidate designs. Check scaling, rounding, ordering, distribution, and depletion only where they affect the task. Report whether a recommended value is task-specific and what assumption makes it useful.

**Delivers:** reproducible inputs and scenario definitions, calculations or model results, a small candidate comparison when required, and a statement of sensitivity and model limits.

**Stops dependent work when:** the model cannot represent the changed behavior, a unit or rule is unresolved, or a recommendation depends on an unchosen experience target. Offer a model repair or a narrower analysis instead of fabricating a result. Preserving a budget does not establish good pacing.

## prototype-developer

**Owns:** implementing the approved behavior and running checks through the real execution path.

**Inputs:** the approved rule delta, accepted assumptions, scenarios, inspected interfaces, assigned files, and authorized actions.

**Work:** trace the responsible configuration, code, and presentation. Make the smallest change that implements the contract and update its affected consumers. Preserve unrelated edits. Reproduce consequential defects and verify relevant behavior; use the project's actual commands and environment rather than guessing them.

**Delivers:** inspectable changes, configuration or model synchronization notes, checks and execution evidence, and any remaining setup or runtime limitation.

**Stops dependent work when:** a proposed edit changes an undecided design, requires unauthorized scope, or depends on an unavailable interface. Continue unaffected work and record the dependency. Never equate generated files or a successful build with observed player behavior.

## playtest-reviewer

**Owns:** reviewing artifact behavior and assessing the experience hypothesis against available evidence.

**Inputs:** the baseline and design rationale, changed artifacts, executable or model instructions, expected scenarios, and the environment and evidence already available.

**Work:** inspect the resulting work rather than grading an agent's summary alone. Separate rule defects, model limitations, interface misunderstandings, and preference tradeoffs. Use the criteria in [experience-review.md](experience-review.md). Reproduce a discrepancy or state precisely why it is unverified. When a human session is available, collect what the player did and understood before interpreting it.

**Delivers:** findings tied to artifacts or observations, reproduction conditions, observed consequences, a justified next action, and explicit limits on any experience claim.

**Stops an acceptance claim when:** evidence does not support that particular claim. This does not automatically stop unrelated authorized work. A self-review, simulated player, and human playtest are different kinds of evidence; label them.

## Allocation and integration

Parallel analysis can share read-only inputs. Parallel editing needs explicit file ownership or isolated changes that the coordinator can integrate. A delegate reports required cross-role changes to the coordinator rather than silently editing another task's files.

The next role receives the changed baseline and relevant evidence, not a stack of repeated prose. If a handoff rejects an artifact, state the unmet condition and the concrete observation that would satisfy it. Escalate only the unresolved decision; the coordinator can finish independent work.
