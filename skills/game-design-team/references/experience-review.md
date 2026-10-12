# Reviewing pacing, choices, and feedback

Use an explicit model of the intended experience. Rules, parameter values, and desired session length come from the task. No value or curve below is a universal definition of a good game.

## Start with a testable hypothesis

For Lantern Expedition, a possible hypothesis is: the player can explain why they spent the shared resource on an efficiency upgrade or on exploration progress, using the costs and effects shown. The task may instead emphasize discovery, speed, cooperation, or recovery from failure. Confirm the intended emphasis from the brief.

Identify the state, available actions, costs, outcomes, information the player receives, and the important dependencies. Distinguish rules established by the task from assumptions about how people behave. Use supplied profiles or observations; invented player policies are model assumptions.

Choose the smallest comparison that can answer the question. Use an existing simulator when it represents the behavior. A short state trace or calculation may suffice. If the model omits a changed rule, repair it within scope or limit the conclusion instead of treating its output as evidence for that rule.

## Pacing

Examine the timing and ordering of relevant opportunities and constraints:

- When can the player first act, make a consequential decision, recover, or see a result?
- Are waits, depletion, upgrades, and difficulty changes serving the intended pressure or preventing the intended action?
- Which profiles or starting states reach the intended milestone, and which stall? What event or rule causes that difference?
- Does a candidate behave differently under plausible changes to availability, luck, or behavior? Record sensitivity rather than presenting a single average as all players' experience.

Useful evidence may include event traces, time or actions to a milestone, repeated waits, resource shortages, outcome distributions, and failure causes. Choose only metrics relevant to the hypothesis. A median milestone day is a model result; judging that day as desirable requires a task-specific target and player evidence.

## Meaningful choices

Examine whether available actions have understandable, consequential tradeoffs:

- Does the preferred action change with relevant state, information, or player goal?
- Is an action dominated in the scenarios considered, or is its purpose deliberately tutorial, expressive, or convenient?
- Can the player influence the outcome, or does the interface offer several buttons that resolve identically?
- Are risks and costs disclosed sufficiently for the intended kind of decision? Intentional uncertainty is valid when the brief calls for it; distinguish uncertainty from a misleading display.

Compare actions from the same starting state. Include a scenario that could overturn the apparent best action. Report the range of states considered and the accepted tradeoff; do not demand that every action have equal usage or value.

## Feedback and comprehension

Examine what a player can observe before and after acting:

- Does feedback correspond to the state and cost used by the implementation?
- Can the player distinguish success, refusal, exhaustion, and a technical failure?
- Does an important state change become visible at the time the next decision depends on it?
- Can a player explain the consequence without a reviewer teaching it during the observation?

State traces can check ordering and consistency. Running and inspecting the prototype can reveal missing or misleading presentation. Human observation is needed to support comprehension claims. An attractive screenshot alone does not establish understanding.

## Numerical and state checks

Select checks from the agreed rules: units and valid domains, budgets and limits, conversion consistency, repeated actions, termination, boundary transitions, batch versus incremental rounding, and failure side effects. Do not impose an invariant merely because a different game used it.

If two goals conflict, show the smallest counterexample. For example, immediate integer rewards can make many small conversions differ from one large conversion. Explain the consequence and candidate policies; record which tradeoff was chosen. Equality, minimum feedback, and exploit resistance may be different task goals.

## Evidence levels

Use precise labels in review output:

- **Static/artifact:** a source or generated artifact passes a stated inspection.
- **Model:** a calculation or simulation produces a result under named rules and assumptions.
- **Execution:** the real implementation ran with recorded inputs and environment.
- **Observed behavior:** an inspecting agent or person saw the result; identify which and retain the evidence.
- **Human playtest:** record audience, task, actions, comprehension, and limitations before interpreting the result.

Evidence at one level does not substitute for another. A simulated policy does not reproduce an actual audience. A technical check can establish correctness without supporting enjoyment. Do not claim that the game is fun, broadly balanced, or proven to improve retention from these checks alone.

## Small review output

For each finding, state the hypothesis or requirement, evidence, player consequence, and next action. Include a reproduction trace where possible. If a result is preference-dependent, identify the preference rather than treating it as a defect.

Recommend a change only as far as the evidence supports. A clear rule defect can be repaired within scope. A weak experience hypothesis may justify a focused playtest or a reversible comparison. An unavailable runtime should produce an explicit verification gap, not a fabricated pass.
