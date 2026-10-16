---
type: notetag
title: State-Application Immunity & Resistance
description: The tags blocking states from being applied to a battler, or reducing the chance they land.
tags: [abs, tag, state, immunity, resistance]
---

# State-Application Immunity & Resistance

## Description

These tags are read from the TARGET's own notes (states, equips, class, etc.), not from the state being applied. Checked
in `Game_Battler#isStateAddable`, in this priority order- each fully blocks application before any chance roll:

```
1. <immuneToAll>          — blocks everything, including the death state.
2. <immuneToStates>       — blocks everything EXCEPT the death state.
3. <immuneToNegatives>    — blocks any state carrying <type:negative>.
4. <stateTypeImmune:TYPE> — blocks any state carrying a matching <type:TYPE>.
```

`<stateTypeResist:[TYPE, PCT]>` is different- it does not block anything outright, it reduces the chance a state
carrying a matching `<type:TYPE>` tag lands, folded into the same application roll as vanilla's per-id state rate.
Multiple tags for the same TYPE stack additively.

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