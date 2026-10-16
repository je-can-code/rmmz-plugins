---
type: notetag
title: On Gap Close End
description: The tags firing follow-up skills the moment a gap close arrives at its destination.
tags: [abs-tools, tag, skill, gap-close, follow-up]
---

# On Gap Close End

## Description

### This On Gap Close End

Put this on the gap-closing skill itself to fire the listed skill ids immediately once the caster arrives at the
destination- useful for a follow-up strike the instant a hookshot connects.

### On Gap Close End

Put this on any of the caster's note sources (actor, class, weapon, armor, state) to fire the listed skill ids on every
gap close this battler performs, regardless of which skill triggered it. IDs from both this tag and
`<thisOnGapCloseEnd>` are merged and de-duplicated before firing.

## TAG USAGE

- Skills, on the gap-closing skill itself, for `<thisOnGapCloseEnd>`.
- Actors, for `<onGapCloseEnd>`.
- Classes, for `<onGapCloseEnd>`.
- Weapons, for `<onGapCloseEnd>`.
- Armor, for `<onGapCloseEnd>`.
- States, for `<onGapCloseEnd>`.

## TAG FORMAT

`<thisOnGapCloseEnd:[SKILL_IDS...]>`
Where SKILL_IDS are the skill ids to fire once the caster arrives at the destination.

`<onGapCloseEnd:[SKILL_IDS...]>`
Where SKILL_IDS are the skill ids to fire on every gap close this battler performs.

## TAG EXAMPLES

`<thisOnGapCloseEnd:[40]>`
Skill 40 fires the instant this skill's gap close arrives at its destination.

`<onGapCloseEnd:[40]>`
Skill 40 fires on every gap close this battler performs.