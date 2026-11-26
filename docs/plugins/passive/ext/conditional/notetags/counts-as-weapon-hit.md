---
type: notetag
title: Counts As Weapon Hit
description: The tag letting a skill's hits count as weapon hits, so they fire its caster's onWeaponHit rules as a swing does.
tags: [passive-conditional, tag, skill, trigger, condition]
---

# Counts As Weapon Hit

## Description

A skill carrying this tag counts as a weapon hit wherever it lands, though it is cast from a combat-skill slot rather
than the Mainhand or Offhand. Every hit it lands on an opposing battler fires its caster's `onWeaponHit` rules, from
[`autoApplyState`](auto-apply-state.md) and [`autoExecuteSkill`](auto-execute-skill.md), exactly as a basic attack's
hit does.

It is meant for a skill that is a weapon technique in all but its slot: a blade flurry, a whip whirl. Whatever a swing
sets off, an enchant's follow-up or a per-swing buff, goes off on its hits too. A multi-hit skill fires those rules once
per hit, so a flurry that lands nine hits on a foe sets off nine follow-ups.

## NOTE ABOUT THE PAYLOAD SKILL

Never put this tag on a payload that a weapon-hit rule fires. That follow-up would then count as a weapon hit itself,
and fire again off every hit it lands. An untagged payload can never do this: a forced payload carries no slot of its
own, so it never counts as a weapon hit.

## TAG USAGE

- Skills only.

## TAG FORMAT

`<countsAsWeaponHit>`

## TAG EXAMPLES

`<countsAsWeaponHit>`
On a whirling blade skill: while its caster's enchant state carries `<autoExecuteSkill:[267, onWeaponHit, 0]>`, every
enemy each whirl hits also takes skill 267, and if 267 is `<direct>`, it lands right on that enemy.
