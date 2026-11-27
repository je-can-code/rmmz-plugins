---
type: notetag
title: Immunity to Fate
description: The tag setting a state apart from fate, so every roll for it is one plain roll no lucky, cursed or repeating effect touches.
tags: [abs, tag, state, chance, fate]
---

# Immunity to Fate

## Description

Have you ever wanted a state that no amount of luck, curses or repetition can bend, landing exactly the way its chance
says and never twice? Well now you can! A state carrying this tag is set apart from fate: whoever applies it, or tries
to take it away, makes one plain roll for it. Unlike
[`<immuneToAll>` and its siblings](state-application-immunity-resistance.md), which make a battler immune to states,
this tag belongs on the state itself.

## NOTE ABOUT WHAT STILL APPLIES

Everything that is not fate still weighs on the roll, as
[State-Application Immunity & Resistance](state-application-immunity-resistance.md) describes:

```
1. The authored chance, as a percent.
2. The recipient's State Rate traits for that state.
3. The recipient's <stateTypeResist> for each type the state carries.
4. For a state carrying <type:negative>, the luck between the two battlers.
```

The recipient's immunities are checked as it lands, too.

## NOTE ABOUT WHAT NEVER APPLIES

None of the fate the roll would otherwise meet weighs on it:

```
1. Lucky and cursed rolls, on either side, and a curse on the recipient.
2. <veryLucky> and <veryCursed>.
3. A critical hit's <forceCritProcs>.
4. Accumulate Mode and Encore.
```

So a state immune to fate lands once at most, on one roll. The same goes for a roll to take it off a battler: a skill's
Remove State effect, or a strip, remove or lose tag, rolls its chance once and plainly.

## TAG USAGE

- States

## TAG FORMAT

`<immuneToFate>`

## TAG EXAMPLES

`<immuneToFate>`
A food chain's phases carry this, so each one lands the next as it expires exactly once: no curse can stop it, and no
Accumulate Mode or Encore can land it twice.
