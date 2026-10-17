---
type: notetag
title: Cooldown Management
description: The tags configuring skill cooldowns, the battler-wide global cooldown, and cooldown reduction.
tags: [abs, tag, skill, cooldown, gcd, cdr]
---

# Cooldown Management

## Description

To prevent endless skill spam, you'll want to add cooldowns.

### Cooldown

The primary tag for cooldown management. This defines the number of frames that must pass before the skill can be used
again.

### Unique Cooldown

Forces each slot to track its cooldown independently, even if the skill shares the same ID as another slot.

### Global Cooldown (GCD)

Optional battler-wide lockout after using skills whose skill type id (`stypeId`) is listed in plugin param "Global
Cooldown Skill Types" (`number[]`). Dodge and tool inputs never participate. Enable via "Enable Global Cooldown".

### Cooldown Reduction (CDR)

A battler-wide stat that shrinks how long the global cooldown lasts once it's triggered. This is not a per-skill tag --
it's summed from every note source on the battler (actor, class, weapons, armors, states) and cached as a single
percent-point value, same as a stat like ATK would be.

Formula context: `a` = the battler being evaluated, `b` = 0, `v` = `$gameVariables._data`.

## NOTE ABOUT SLOTS ON COOLDOWN

JABS allows the same skill to be equipped in multiple slots. By default, when a skill with a cooldown is used, all slots
carrying that same skill ID will also go on cooldown. Use `<uniqueCooldown>` to change this.

## NOTE ABOUT CDR TOTALS

The final summed value is converted from percent-points to a decimal before use (e.g. 25 percent-points becomes 0.25)
and clamped at 0 on the low end by the GCD length math (`Math.max(0, baseFrames * (1 - cdr))`). A total of 100 or more
percent-points reduces GCD length to zero frames.

## TAG USAGE

- Skills, for `<cooldown:VAL>`, `<uniqueCooldown>`, `<noGlobalCooldown>`, `<ogcd>` and `<gcd:FRAMES>`.
- Actors, for `<cdr:[FORMULA]>`.
- Classes, for `<cdr:[FORMULA]>`.
- Weapons, for `<cdr:[FORMULA]>`.
- Armor, for `<cdr:[FORMULA]>`.
- States, for `<cdr:[FORMULA]>`.

## TAG FORMAT

`<cooldown:VAL>`
Where VAL is the cooldown in frames for this skill.

`<uniqueCooldown>`

`<noGlobalCooldown>`
`<ogcd>`
Either tag marks an "oGCD" skill: it does not stamp GCD and is not blocked by the global timer.

`<gcd:FRAMES>`
Overrides default GCD length for this skill when it triggers GCD.

`<cdr:[FORMULA]>`
Where FORMULA resolves to the percent-points of cooldown reduction this source contributes. All matching sources are
summed together.

## TAG EXAMPLES

`<cooldown:120>`
This skill has a cooldown of 120 frames.

`<uniqueCooldown>`
Each slot carrying this skill tracks its cooldown independently.

`<ogcd>`
This skill does not stamp GCD and is not blocked by the global timer.

`<gcd:30>`
Overrides the default GCD length for this skill to 30 frames when it triggers GCD.

`<cdr:[10]>`
This source grants a flat +10 percent-points of CDR.

`<cdr:[a.luk * 0.1]>`
This source grants CDR scaled off the battler's own LUK.