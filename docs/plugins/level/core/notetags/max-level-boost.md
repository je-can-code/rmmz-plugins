---
type: notetag
title: Max Level Boost
description: The tag raising or lowering an actor's max level, beyond the database's cap of 99.
tags: [level, tag, actor, max-level]
---

# Max Level Boost

## Description

Have you ever wanted levels to exceed 99? Well now you can! By properly setting the
[plugin configuration](../overview.md#plugin-configuration), you too can reach beyond the max level!

## NOTE ABOUT PLUGIN CONFIGURATION

There are two important values that should be considered when working with beyond max level tags: the "default beyond
max level" value- aka the "base", and the "max boosted level" value- aka the "cap", as they influence the tags in this
section.

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- States

## TAG FORMAT

`<maxLevelBoost:AMOUNT>`
Where AMOUNT is a negative or positive integer applied to the base beyond max level.

## TAG EXAMPLES

`<maxLevelBoost:+25>` (on the actor)
The actor with this tag will have a +25 modifier to their base max level, but no higher than the cap max level.

`<maxLevelBoost:+100>` (on the actor)
`<maxLevelBoost:-25>` (on an equipped weapon)
The actor with these tags will have a +75 (100-25=75) modifier to their base max level, but no higher than the cap max
level.

`<maxLevelBoost:-50>` (on the actor)
`<maxLevelBoost:-25>` (on a learned skill for the actor)
`<maxLevelBoost:+10>` (on a state applied to the actor)
The actor with these tags will have a -65 (-50-25+10=-65) modifier to their base max level.