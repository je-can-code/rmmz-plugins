---
type: notetag
title: When-Hit Gains
description: The tags granting a battler HP, MP, or TP each time it takes HP damage on-map.
tags: [resources-abs, tag, gain, when-hit, damage]
---

# When-Hit Gains

## Description

Have you ever wanted a battler that builds rage the more they get beaten around, or an accessory that slowly
replenishes MP for a stalwart defender? Well now you can! By applying the appropriate tag(s) to the database object in
question, that battler will receive HP, MP, or TP each time they take HP damage. All tagged sources are summed together
automatically.

## NOTE ABOUT REC SCALING

Gains are scaled by the target's REC stat.

## NOTE ABOUT FORMULAS

In formula tags, `b` is the raw HP damage dealt rather than the accumulated base value- this lets you write
damage-proportional expressions like `b * 0.05`.

## TAG USAGE

- Actors
- Enemies
- Classes
- Weapons
- Armor
- States

## TAG FORMAT

### Flat

`<when-hit-hp-gain:FLAT>`
`<when-hit-mp-gain:FLAT>`
`<when-hit-tp-gain:FLAT>`

### Percentage

`<when-hit-hp-gain:PERCENT%>`
`<when-hit-mp-gain:PERCENT%>`
`<when-hit-tp-gain:PERCENT%>`
Where PERCENT is a percentage of the target's maximum for that resource.

### Formula

`<when-hit-hp-gain:[FORMULA]>`
`<when-hit-mp-gain:[FORMULA]>`
`<when-hit-tp-gain:[FORMULA]>`
Where FORMULA is an eval'd expression.
`a` = the target battler.
`b` = the raw HP damage dealt by the hit.

## TAG EXAMPLES

`<when-hit-tp-gain:5>`
Gain 5 TP each time this battler takes HP damage (great for a "Rage" state).

`<when-hit-mp-gain:2%>`
Recover 2% of max MP each time this battler takes HP damage.

`<when-hit-tp-gain:[b * 0.05]>`
Gain TP equal to 5% of the damage taken- scales with how hard the hit was.