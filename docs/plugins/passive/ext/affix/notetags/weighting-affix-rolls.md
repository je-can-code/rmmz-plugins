---
type: notetag
title: Weighting Affix Rolls
description: The tag setting how often a state is drawn from its prefix or suffix pool, as a share of that pool.
tags: [passive-affix, tag, state, affix, weight, rng]
---

# Weighting Affix Rolls

## Description

Have you ever wanted some affixes to be common and others to be rare? Well now you can! By applying a weight tag to a
state, you too can influence how often it is selected by the weighted roll.

## NOTE ABOUT WEIGHTS BEING SHARES

A weight is a share, not a percent. An affix's odds are its own weight divided by the total weight of its slot's pool,
so doubling every weight in a pool changes nothing at all.

## NOTE ABOUT A WEIGHT OF ZERO

A weight of zero means "a member of the pool that is never drawn". The state stays registered, so an event pinning it
via `<passive:[...]>` still works and the tier presentation still recognizes it - it simply has no presence in the
random roll. This is how an affix is reserved for something else to hand out later, such as a difficulty layer.

## TAG USAGE

- States

## TAG FORMAT

`<affix-weight:N>`
Where N is a non-negative integer weight.

## TAG EXAMPLES

`<affix-weight:10>`
Ten times as likely as an affix with weight 1.

`<affix-weight:0>`
Never rolled at random; available only when something grants it a weight.