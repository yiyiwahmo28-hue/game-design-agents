# Rain Harbor — baseline design

Source: [the original brief](brief.md). This is a new fictional example, not an adaptation of Lantern Expedition. The baseline is preserved in `examples/rain-harbor/baseline.json`.

## Responsibility and decision record

The coordinating assistant delegated this task to a real assistant. That delegate combines systems design, economy design and core implementation; its code review is self-review, not an independent specialist review. Browser work and the integrated review are separate responsibilities. Numerical choices below are authorized reversible design decisions for this brief.

**Confirmed:** visible preparation versus immediate rescue; one fuel resource; distinct boat costs and passenger counts; a short deterministic storm deadline; action previews; invalid actions spend no turn; no account, service or API key.

**Selected details:** seven turns, four starting fuel, one preparation, four stranded boats. Preparation spends two fuel and a turn, increasing each later refuel from two to five. Rescue is all-or-nothing for one boat and takes one turn. There is no hidden movement, random weather, passive income or per-boat deadline.

The passenger objective is explicit: maximize people rescued before closure. It is a model objective, not a moral ranking of people or a claim that one play style is enjoyable.

## Complete rule contract

1. A fresh run starts at turn 0 with four fuel, no preparation and no rescued boats.
2. **Refuel:** gain two fuel before preparation or five afterward; consume one turn.
3. **Prepare:** once per run, pay two fuel and consume one turn. It produces no immediate rescue or fuel; its benefit applies only to later refuels.
4. **Rescue:** pay the selected boat's fuel cost, rescue all its passengers and consume one turn. Each boat is rescuable only once.
5. Turn 7 is the final permitted action. Apply its full effect first, then close the harbor. If all boats are rescued earlier, end immediately. No action is accepted after either ending.
6. Unknown, unaffordable, repeated or post-ending actions return an explanation and an unchanged copy of state. No fuel or turn is spent.
7. Before clicking, the browser reads cost, fuel gain or passenger outcome, turn cost, preparation's future refuel amount and availability from the shared engine.
8. At the end show rescued people, each remaining boat and remaining fuel. Reset starts a new run; this first version has no undo, rollback or editing interface.

## Editable parameters

- Turn limit: **7**. Initial fuel: **4**.
- Refuel: **2**, prepared refuel: **5**. Prepare cost: **2**.
- Dinghy: **2 fuel / 2 people**; Skiff: **4 / 4**; Trawler: **6 / 6**; Ferry: **8 / 10**.

All values are integer task-specific parameters. The engine bounds turns to 1–12 and boats to 1–6 so finite-state analysis stays small. These are prototype safety limits, not universal game design standards.

## Rationale and accepted tradeoffs

Preparation improves later resource access but delays the first rescue and consumes fuel. Its benefit depends on how many refuels remain. The ferry offers more people per fuel, but saving for it can defer immediately affordable rescues. The short deadline makes both resource and action opportunity cost visible.

The chosen world may leave boats behind even under an optimal passenger policy. That is a consequence to verify by execution, not a promised result. Preparation is not meant to be best in every state: analysis must also seek a reachable late-turn state where rescue is better.

Alternative considered: preparation discounts each rescue. The selected refuel improvement has a smaller, more visible causal chain and exposes a time-dependent payoff. This choice is reversible if observation shows players cannot understand it.

## Reproduction and acceptance

- Zero-turn refusal: an unaffordable rescue and a repeated rescue leave every state field unchanged.
- Preparation preview and execution agree; the next refuel uses the prepared amount.
- Fuel equals initial fuel + gained fuel − spent fuel at every accepted step.
- The final-turn rescue counts before closure; a later action is refused.
- Named policies replay through the same module as manual browser actions.
- Enumerate legal states to compare maximum rescued people with and without preparation, and show witnesses for legal first actions and a late-preparation counterexample if one exists.

Results are recorded only after running the implementation in [evidence.md](evidence.md). No passenger result, strategy win or player preference is predeclared as evidence.

## Experience hypothesis and open validation

Players can explain an investment versus immediate rescue using visible fuel and turns. Ask unfamiliar players to make their own choices before explaining the intended tradeoff; retain their actions and explanations. No human session has been conducted. The engine and search cannot establish comprehension, preference or real rescue behavior.

## 中文摘要

本例从公开虚构 brief 独立设计。首版为7回合、4初始燃油；补给获得2燃油，一次准备消耗2燃油和1回合，使后续补给变为5。四艘船的燃油/人数分别为2/2、4/4、6/6、8/10。最后一回合先执行救援再关港，重复、缺油或终局操作不消耗回合。具体获救结果需运行后记录；同一受委派助手兼任系统、数值和核心开发，属于自检，不能当独立审查或真人试玩。
