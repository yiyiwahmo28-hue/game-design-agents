# Briefs, decisions, and handoffs

Use these templates only when they replace missing context or prevent a consequential misunderstanding. A clear request or existing issue can already be the brief. A narrow task can put its handoff directly in the final response.

## Optional task brief

```markdown
# Task

Player action and experience hypothesis:
Current behavior and authoritative sources:
Requested change:
Authorized edits/actions and exclusions:
Completion criteria:

Confirmed decisions:
Assumptions, their scope, and how to test them:
Open decisions and which work depends on them:
```

The experience hypothesis describes a consequence to examine, such as whether the player understands the resource tradeoff between upgrading and exploring. It is not a declaration that the design is enjoyable. Put parameter values and platform or release conventions in task inputs; do not make them global rules.

## Minimal handoff

```markdown
# Handoff: responsibility -> next responsibility

Baseline: task, applicable decisions, artifact versions or source references
Decision: change made, reason, accepted tradeoff, assumptions still in use
Artifacts: files or results the recipient must inspect; affected consumers
Acceptance: checks/observations with environment and evidence references
Unverified/open: missing evidence or decision, consequence, next useful action
```

Name the artifacts that exist. Do not create a document solely to populate a link. Include the relevant content when the receiving host cannot access the artifact. If a source changed after a delegate started, identify the difference before integrating its output.

## Decision boundaries

- **Confirmed:** the user chose the behavior, or an established source defines the current behavior. These are different reasons; retain the source.
- **Assumed:** a reversible choice made within the user's scope. Record its effect and the condition that would require revisiting it.
- **Open:** the choice is consequential and the available intent does not decide it. Give a concrete example of the alternatives and continue work that does not depend on the choice.

Do not turn every routine choice into an approval request. Conversely, implementation convenience is not evidence that a player preference has been chosen. A new external publication, message, or destructive operation needs authorization that actually covers that action.

## Example handoff: Lantern Expedition

```markdown
# Handoff: systems design -> prototype implementation

Baseline: the current gather/upgrade/explore rules and an approved request
          to bring the first upgrade earlier while preserving total upgrade cost
Decision: adjust the upgrade cost distribution; leave exploration rules intact
Artifacts: the inspected parameter source, cost comparison, and scenarios
           for upgrading, exploring, reaching the goal, and insufficient resources
Acceptance: first-upgrade availability changes under the stated model inputs;
            total upgrade cost is unchanged; rejected actions do not spend time;
            displayed costs and effects match the prototype's real rules
Unverified/open: whether players understand the investment versus progress
                 tradeoff; observe a play session after behavior checks pass
```

This example does not prescribe an API, parameter value, interface layout, or failure rule. Use the real task's approved behavior and implementation when applying it.

## Change propagation

For each changed rule, inspect its relevant consumers: specification, parameters, model inputs, runtime logic, player-facing feedback, and acceptance scenarios. Track the consumers that matter to this task. Some tasks have only a subset.

Record what was synchronized and why a consumer was omitted or remains unverified. Agreement across documents proves consistency of those artifacts; it does not prove the running program consumes them or that the experience is effective.
