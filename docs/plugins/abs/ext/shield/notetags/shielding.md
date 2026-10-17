---
type: notetag
title: Shielding
description: The tag defining how many shield points a state supplies to protect against damage.
tags: [abs-shield, tag, state, shield, formula]
---

# Shielding

## Description

Have you ever wanted to apply some amount of shield points to a state to protect against damage? Well now you can! By
applying the appropriate tag on your states, you too can apply shields to your heart's content.

## NOTE ABOUT FORMULA-BASED TAGS

All formula-based tags are recalculated upon application of the state, and again anytime the state refreshes. When a
state is recalculated, the current shield gets replaced with an updated shield, carrying over the previous current
amount along with adding it to the new base amount. The cap is simply replaced with the updated value.

## NOTE ABOUT SAR/SER SCALING

After the formula is evaluated, the result is multiplied by the applying battler's `sar` (Shield Amplification Rate)
and the receiving battler's `ser` (Shield Effectiveness Rate) factors. See
[Shield Amplification / Effectiveness](shield-amplification-effectiveness.md) for how those factors are built.

## TAG USAGE

- States

## TAG FORMAT

`<shield:[FORMULA]>`
Where FORMULA represents a damage-like formula calculating the amount to absorb. The variables `a`, `b`, and `s` can
be used in the formulas like you would in a damage formula, where `a` represents the battler applying the shield state,
`b` represents the battler receiving the shield state, and `s` represents the `RPG_State` object of the shield state
itself.

## TAG EXAMPLES

`<shield:[100]>`
A shield to protect against 100 damage will be supplied when afflicted with the state bearing this tag.

`<shield:[(a.mat * 3) + s.stepsToRemove]>`
A shield based on triple the caster's magic attack parameter as well as the value in the "steps to remove" field on the
shield state.