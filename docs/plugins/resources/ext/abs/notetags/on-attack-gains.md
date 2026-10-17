---
type: notetag
title: On-Attack Gains
description: The tags granting the caster HP, MP, or TP every time a skill lands a hit on-map.
tags: [resources-abs, tag, skill, gain, on-attack]
---

# On-Attack Gains

## Description

Have you ever wanted a skill that siphons a little bit of HP each time it connects, or a technique that refunds TP on
every successful hit? Well now you can! By applying the appropriate tag(s) to a skill, the caster will receive HP, MP,
or TP every time that skill lands.

## NOTE ABOUT REC SCALING

Gains are scaled by the caster's REC stat.

## TAG USAGE

- Skills

## TAG FORMAT

### Flat

`<on-attack-hp-gain:FLAT>`
`<on-attack-mp-gain:FLAT>`
`<on-attack-tp-gain:FLAT>`
Where FLAT is a fixed amount to restore on each hit.

### Percentage

`<on-attack-hp-gain:PERCENT%>`
`<on-attack-mp-gain:PERCENT%>`
`<on-attack-tp-gain:PERCENT%>`
Where PERCENT is a percentage of the caster's maximum for that resource.

### Formula

`<on-attack-hp-gain:[FORMULA]>`
`<on-attack-mp-gain:[FORMULA]>`
`<on-attack-tp-gain:[FORMULA]>`
Where FORMULA is an eval'd expression.
`a` = the caster battler.
`b` = flat + calculated-percent (the accumulated base before formula).

## TAG EXAMPLES

`<on-attack-hp-gain:20>`
Restores 20 HP to the caster each time this skill lands.

`<on-attack-mp-gain:5%>`
Restores 5% of the caster's max MP each time this skill lands.

`<on-attack-tp-gain:[a.level / 10]>`
Restores TP equal to one-tenth the caster's level per hit.