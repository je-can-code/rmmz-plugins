---
type: notetag
title: Pierce Elements
description: The tags letting a battler partially ignore a target's elemental resistance, on all skills or on one skill.
tags: [elem, tag, element, pierce, resistance]
---

# Pierce Elements

## Description

Have you ever wanted a battler to partially ignore an enemy's elemental resistance — punching through fire immunity to
deal real damage? Well now you can! By applying the appropriate tag(s) to any notetag source, you can reduce the
target's effective element rate for one or more elements, nudging it toward neutral (1.0x) damage.

### Details

When a skill's elemental calculation is performed, all relevant pierce tags are summed for the element being used. The
target's effective rate is then raised by that sum, capped at 1.0 (neutral). Pierce never turns a resistance into a
weakness, and it never affects elements the target is already weak to or absorbs.

Two scopes are available:

### Pierce Element

`pierceElement` tags are read from the ATTACKER's full `getAllNotes()` sources (actor, class, equips, states, and
learned skills). If placed on a skill, the attacker passively benefits from the pierce on ALL skills they cast for as
long as they know that skill.

### This Pierce Element

`thisPierceElement` tags are read from the SKILL being cast RIGHT NOW only. This is the right tag when the pierce should
only apply to one specific attack rather than granting a global passive benefit.

### Example 1

Target has 0% fire rate (immune). Attacker has 50 total fire pierce.
Effective rate = `min(1.0, 0.0 + 0.50)` = 0.50 → target takes 50% fire damage.

### Example 2

Target has 50% fire rate (resistant). Attacker has 30 fire pierce.
Effective rate = `min(1.0, 0.50 + 0.30)` = 0.80 → target takes 80% fire damage.

### Example 3

Target has 200% fire rate (weak). Pierce is irrelevant — weakness unchanged.

### Example 4

Target absorbs fire. Pierce is irrelevant — absorption unchanged.

## NOTE ABOUT MULTIPLE TAGS

Multiple pierce tags on the same element are summed together. A state with `<pierceElement:[4, 30]>` and an armor with
`<pierceElement:[4, 20]>` together give 50 total pierce on element 4.

## TAG USAGE

- Actors
- Enemies
- Classes
- Skills (knowing the skill passively grants the pierce to all casts); `<thisPierceElement>` goes on Skills only.
- Weapons
- Armor
- States

## TAG FORMAT

`<pierceElement:[ELEMENT_ID, PIERCE_PERCENT]>`
`<thisPierceElement:[ELEMENT_ID, PIERCE_PERCENT]>`
Where ELEMENT_ID is the numeric element id from the Types tab,
and PIERCE_PERCENT is an integer (30 = 30 pierce, raising effective rate by 0.30).

## TAG EXAMPLES

`<pierceElement:[4, 30]>`
The attacker pierces 30% of the target's fire (element 4) resistance on all skills. If placed on a passive mastery
state, it is always active while the state is applied.

`<pierceElement:[4, 50]>` on actor, `<pierceElement:[4, 20]>` on equipped ring:
Combined 70 fire pierce. A fully immune target takes 70% fire damage.

`<thisPierceElement:[4, 100]>`
Only when casting THIS specific skill does it fully pierce fire immunity. Other skills the caster uses are unaffected.

`<thisPierceElement:[4, 40]>` combined with `<pierceElement:[4, 30]>` from a state:
70 total fire pierce on this skill (40 skill-specific + 30 passive global).