---
type: notetag
title: Passive States
description: The tags granting passive states from the database objects a battler, or the whole party, possesses.
tags: [passive, tag, state, actor, class, enemy, skill, item, equip]
---

# Passive States

## Description

Have you ever wanted a battler to be able to be in possession of some object like a skill or equipment, and have that
object grant passive effects? Well now you can! By adding the correct tags to the various database objects, you too can
have passive states!

The means of application are specific to what type of database object the tag lives on, as well as the scope of the
effect.

### On-skill

If the tag lives on a skill, then the battler only needs to know the skill for it to apply the passive state(s). The
effects of this are applied to the battler that knows the skill.

### On-item/weapon/armor

If the tag lives on an item/weapon/armor, then the party only needs to have the object in their possession for it to
apply the passive state(s). The effects for this are applied to the entire party.

### On-actor/enemy

If the tag lives on an actor/class/enemy, then the actor or enemy would only need to exist for it to apply the passive
state(s). The effects for this are applied only to the battler the tag is on.

### On-class

If the tag lives on a class, then an actor would need the class to be currently applied for it to apply the passive
state(s). The effects for this are applied only to the actor using the class.

### On-state

If the tag lives on a state, then the battler would need to be afflicted with the given state in order to apply the
passive state(s). The effects for this are applied only to the battler afflicted with the original state bearing the
tag.

### "Equipped" tag formats

If the "equipped" version of the tags live on an equip, the effects of the passive state(s) will only be applied while
it is equipped. The effects for this are applied only to the actor using the class.

## NOTE ABOUT ADDING/REMOVING PASSIVE STATES

Any states that are added in this manner are tracked as "passive", and thus always active regardless of duration
specifications in the database. These states also cannot be removed, cannot be applied/re-applied by normal means while
possessing a passive state id of the same state.

## NOTE ABOUT JABS INTERACTIONS

If using [`JABS`](../../../abs/core/overview.md) with this plugin, it is important to keep in mind that all
[formula-based slip effects](../../../abs/core/notetags/states/slip-damage.md) will use the afflicted battler as both
the source AND target battlers in the context of `a` and `b` in the formula.

## TAG USAGE

- Actors
- Classes
- Enemies
- Skills
- Items
- Weapons
- Armor
- States

## TAG FORMAT

`<passive:[STATE_IDS]>`
`<uniquePassive:[STATE_IDS]>`
`<equippedPassive:[STATE_IDS]>`
`<uniqueEquippedPassive:[STATE_IDS]>`
Where STATE_IDS is a comma-delimited list of state ids to be applied.

## TAG EXAMPLES

`<passive:[10]>`
If the battler has possession of a database object with this tag, then the state of id 10 is applied.

`<passive:[10,11,12]>`
If the battler has possession of a database object with this tag, then the state ids of 10, 11, and 12, will all be
applied.

`<passive:[10]>`
`<passive:[10,11,12]>`
If a battler had two separate database objects in their possession each bearing one of the above two tags, then the
state id of 10 would be applied twice, while 11 and 12 would be applied only once.

`<uniquePassive:[10]>`
`<passive:[10,11,12]>`
If a battler had two separate database objects in their possession each bearing one of the above two tags, then the
state id of 10 would be applied once due to uniqueness, along with 11 and 12 being applied once, too.

`<equippedPassive:[10,11]>`
If the battler has a piece of equipment equipped with this tag, then the state ids of 10 and 11 would be applied. If the
battler did not have this equipment equipped, it would do nothing.

`<uniqueEquippedPassive:[10]>`
`<equippedPassive:[10,11,12]>`
If a battler had two separate equipped equips each bearing one of the above two tags, then the state id of 10 would be
applied once due to uniqueness, along with 11 and 12 being applied once, too.