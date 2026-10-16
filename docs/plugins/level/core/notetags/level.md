---
type: notetag
title: Level
description: The tags giving an enemy a level, modifying a battler's level, and hiding an enemy's level from its name.
tags: [level, tag, enemy, actor, event, scaling]
---

# Level

## Description

Have you ever wanted to scale damage/experience/gold by level, but realized that enemies in RMMZ don't have a level
parameter? Well now you can! By adding the appropriate tags to various locations in the database, you too can scale
numbers to your hearts content!

This was initially designed only for enemies, but has since been expanded to also allow you to apply modifiers to your
actors as well. For enemies, since they do not innately have levels, the total amount of "level" is the sum of all tags
found for a given enemy across itself and any states that may be applied to an enemy. For actors, it starts with
whatever their current level is, and if states/classes/equipment/skills also contain the tags, the level modifiers will
be stacked against the actor's base level.

## NOTE ABOUT LEVEL ZERO

The level-scaling utility has no concept of actor or enemy when performing its calculations. With that in mind, be
cognizant of the magic level of zero. If a level ever ends up being zero, that battler will be identified as a
"non-level", aka level scaling won't apply and all multipliers to and from that battler will be 1.0x. Level can drop
below zero, though, so just stay aware when doing unusual things, like trying to add a state that grants bonus levels
for a scaling bonus to a non-level enemy.

## NOTE ABOUT REWARDS

The way the math works out for the level-scaling calculations, the inputs for levels are entered in reverse from the
way they are in combat formulas! If it helps you, you can think of it like enemies using a skill against each member of
your party that gives experience- and is affected by the normal level-scaling mechanics. The same applies to gold
rewards.

## NOTE ABOUT WORKING WITH JABS

If a level is present on an event that is identified as a JABS enemy, this level will override whatever is present on
the database note section. You can think of the event as the real level, while the database notes are the "default"
level for enemies. The overriden level still gets combined with any other modifications from states and whatnot. If an
enemy has a level, by default it will show up in their battler name. If it is desired to be hidden, it can be converted
to ??? by using the hide level tag.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States, on actors or enemies.
- Enemies
- Skills, known by an actor.
- Event comments, on an enemy event (with JABS).

## TAG FORMAT

`<lv:NUM>`
`<lvl:NUM>`
`<level:NUM>`
Where NUM is the level value to set/modify. (can be negative)

`<hideLevel>`

## TAG EXAMPLES

`<level:4>`
On enemies, if on the enemy, it would set their base level to 4.
On enemies, if on a state, it would grant a +4 modifier to their base level.
On events, this will override whatever the JABS enemy's level would be.
On actors, this would grant a +4 level modifier to their base level.

`<level:-2>`
On enemies, if on the enemy, it would do nothing.
On enemies, if on a state, and they have a base level set, this will grant a -2 modifier to their base level.
On actors, this will grant a -2 modifier to their base level.

`<hideLevel>`
On enemies, this will turn the level into "???" instead of the level value.
On events, this will override a singular enemy into hiding the value.
On states, this will do nothing.