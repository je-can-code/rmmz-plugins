---
type: notetag
title: HAR (Healing Rate)
description: The tag raising or lowering the potency of the healing a battler deals out, separately from REC.
tags: [base, tag, har, healing, battler]
---

# HAR (Healing Rate)

## Description

Have you ever wanted a battler to be better (or worse) at healing others, separately from how well a battler receives
healing (REC)? Well now you can! HAR is the sender-side counterpart to REC — it multiplies the potency of healing this
battler deals out, rather than healing this battler receives.

## NOTE ABOUT COMBINING TAGS

This is additive across the board, so if a single battler has multiple tags from various equipment and/or states, all
amounts of HAR will be summed together before being applied as a single percent multiplier.

## NOTE ABOUT WHERE THIS APPLIES

HAR is applied everywhere REC already is on the giving side: Damage-tab "HP/MP Recover" skills, Effects-tab "Recover
HP/MP" entries, and `J-ABS-Formula`'s custom heal pipeline (if that plugin is installed).

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- Enemies
- States

## TAG FORMAT

`<har:VALUE>`
Where VALUE represents the percent bonus/penalty to outgoing healing.

## TAG EXAMPLES

`<har:25>`    (on actor)
This battler's outgoing healing is now 125% effective.

`<har:-50>`   (on state)
While afflicted, this battler's outgoing healing is only 50% effective.