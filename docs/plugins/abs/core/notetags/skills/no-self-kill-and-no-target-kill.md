---
type: notetag
title: No Self Kill & No Target Kill
description: The tags stopping a battler's skills one HP short of killing itself, or an opponent.
tags: [abs, tag, skill, damage, kill]
---

# No Self Kill & No Target Kill

## Description

These tags stop a blow one HP short of killing. They belong to the battler casting the skill, or to the skill itself,
never to the one being hit:

```
<noSelfKill>       — nothing this battler casts can kill this battler itself.
<thisNoSelfKill>   — this skill can't kill the battler casting it.
<noTargetKill>     — nothing this battler casts can kill an opponent.
<thisNoTargetKill> — this skill can't kill an opponent.
```

An opponent is decided by team, the same way J-ABS decides who a skill may hit. An ally caught by friendly fire is
covered by neither tag and can still die. If the caster has left the map before its skill lands, such as an enemy
felled with a projectile still in flight, an actor and an enemy count as opponents.

The floor holds a skill's damage and its J-ABS-Formula packets. It is applied after every multiplier and after shields
have absorbed their share, so nothing downstream can push a held blow back over the edge. A target already at 1 HP
takes nothing. One sitting at a fraction above 1 keeps that fraction, because only whole HP above 1 is ever taken.

Damage over time, skill costs, a Recover HP effect written below zero, and the death state are not held back: none of
them is a skill's damage.

## TAG USAGE

`<noSelfKill>` and `<noTargetKill>`:

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills, known by the battler.

`<thisNoSelfKill>` and `<thisNoTargetKill>`:

- Skills, only while that skill is the one being cast.

## TAG FORMAT

`<noSelfKill>`

`<thisNoSelfKill>`

`<noTargetKill>`

`<thisNoTargetKill>`

## TAG EXAMPLES

`<noSelfKill>`
On an enemy whose pulse hits itself as well as the party: the pulse can bring it down to 1 HP, but the last blow has to
come from someone else.

`<thisNoTargetKill>`
On a skill: it can leave an opponent at 1 HP but never kills it, like a False Swipe.
