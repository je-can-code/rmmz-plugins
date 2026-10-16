---
type: notetag
title: Shield Caps
description: The tag defining the most shield points a state's shield can grow to when it is reapplied.
tags: [abs-shield, tag, state, shield, cap, formula]
---

# Shield Caps

## Description

Have you ever wanted to have a cap on shields that was higher than the initially applied amount? Well now you can! By
applying the appropriate tag on your states, you too can have shield caps as high as your heart desires!

## NOTE ABOUT OMITTING SHIELD CAPS

If the shield cap is omitted from a shield state, then the cap will automatically be set to the initial shield amount.
This tag lets you create states that can be reapplied to further increase the shield amount up to a certain point- the
cap.

## TAG USAGE

- States

## TAG FORMAT

`<shieldCap:[FORMULA]>`
Where FORMULA represents a damage-like formula calculating the cap shield amount. The variables `a`, `b`, and `s` can be
used in the formulas like you would in a damage formula, where `a` represents the battler applying the shield state, `b`
represents the battler receiving the shield state, and `s` represents the `RPG_State` object of the shield state itself.

## TAG EXAMPLES

`<shieldCap:[100]>`
A shield cap of 100 will be applied when afflicted with the state bearing this tag.

`<shieldCap:[(a.mat * 3) + s.stepsToRemove]>`
A shield cap of (caster's magic attack * 3) + (number of steps to remove) will be applied when afflicted with the state
bearing this tag.