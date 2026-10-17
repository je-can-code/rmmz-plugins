---
type: notetag
title: Shield Protect
description: The tag making a shield nullify the overflow damage of the blow that breaks it.
tags: [abs-shield, tag, state, shield, protect, overflow]
---

# Shield Protect

## Description

Have you ever wanted your shields to protect you from the overflow damage after they break like they do in certain
other games you might've played? Well now you can! By applying the shield protect tag to the various shield states, you
too can have shields that will protect you from damage that would otherwise overflow and deal damage after a shield is
broken.

## TAG USAGE

- States

## TAG FORMAT

`<shieldProtect>`
This tag is used to indicate that the shield should protect you from damage that would otherwise overflow and deal
damage after the shield is broken.

## TAG EXAMPLES

`<shieldProtect>`
Let us assume that a battler is afflicted with a shield state with the [`<shield:[100]>`](shielding.md) tag as well,
meaning they have a flat 100 shield points. If this battler was struck with a blow that dealt 150 damage, normally 100
of it would be soaked up by the shield leaving 50 to overflow back and damage the battler's HP. If that same state also
had the protect tag, then that overflow of 50 would instead be nullified entirely.