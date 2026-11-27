---
type: notetag
title: State-Application Immunity & Resistance
description: The tags blocking states from being applied to a battler, or reducing the chance they land.
tags: [abs, tag, state, immunity, resistance]
---

# State-Application Immunity & Resistance

## Description

These tags are read from the TARGET's own notes (states, equips, class, etc.), not from the state being applied. Checked
in `Game_Battler#isStateAddable`, in this priority order- each one blocks the state outright, every time it would land,
however its chance roll went:

```
1. <immuneToAll>          — blocks everything, including the death state.
2. <immuneToStates>       — blocks everything EXCEPT the death state.
3. <immuneToNegatives>    — blocks any state carrying <type:negative>.
4. <stateTypeImmune:TYPE> — blocks any state carrying a matching <type:TYPE>.
```

`<stateTypeResist:[TYPE, PCT]>` is different- it does not block anything outright, it reduces the chance a state
carrying a matching `<type:TYPE>` tag lands, folded into the same application roll as vanilla's per-id state rate.
Multiple tags for the same TYPE stack additively.

## NOTE ABOUT THE APPLICATION ROLL

Every chance a state has to land on a battler is rolled the same way, whatever carries it there: a skill's own state
effect, the attack states a normal attack carries, an on-hit, on-cast or on-crit tag, an evasion, an aura, a state
spreading, a state applied as another expires, or a region. The one exception is a food chain's next phase, which
[`J-ABS-Food`](../../../ext/food/notetags/food-chain-states.md) lands with no roll at all. The chance is built up in
this order:

```
1. The authored chance, as a percent.
2. The target's State Rate traits for that state.
3. The target's <stateTypeResist> for each type the state carries.
4. For a state carrying <type:negative>, the luck between the two battlers.
```

The luck is RMMZ's own: every point of LUK the battler applying the state holds over the target adds a tenth of a
percent to the chance, and every point it lacks takes one away. Luck only weighs on harm. A state without the
`<type:negative>` classifier is a blessing, and no one lucks their way out of a blessing, so no luck gap touches its
chance. A battler applying a state to itself holds no edge over itself, but its own State Rate traits and
`<stateTypeResist>` still weigh in. The attack states a normal attack carries also answer to the attacker's own rate for
each of them, before the target's resistances do.

The result is rounded to a whole percent and rolled with both battlers' fate, as
[On-Chance Roll Manipulation](../skills/on-chance-roll-manipulation-lucky-cursed-rolls.md) describes. Accumulate Mode
and Encore can land it more than once, and the immunities above are checked on every landing.

A Certain Hit skill cannot miss, and the states it carries take this same roll.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills, known by the battler.

## TAG FORMAT

`<stateTypeResist:[TYPE, PCT]>`

`<stateTypeImmune:TYPE>`

`<immuneToNegatives>`

`<immuneToStates>`

`<immuneToAll>`

## TAG EXAMPLES

`<stateTypeResist:[cc, 50]>`
Reduces the chance a state carrying a matching `<type:cc>` tag lands on this battler by 50%.

`<stateTypeImmune:cc>`
Blocks any state carrying a matching `<type:cc>` from being applied to this battler.

`<immuneToNegatives>`
Blocks any state carrying `<type:negative>` from being applied to this battler.

`<immuneToStates>`
Blocks every state from being applied to this battler, EXCEPT the death state.

`<immuneToAll>`
Blocks every state from being applied to this battler, including the death state.