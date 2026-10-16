---
type: notetag
title: AI Roles
description: The tags defining how a battler coordinates with other battlers on its team.
tags: [abs, tag, enemy, event, ai, coordination]
---

# AI Roles

## Description

AI roles define how a battler coordinates with other battlers on its team. They are distinct from AI traits, which
govern what skills an enemy chooses -- roles govern who they work with and how.

A battler can only meaningfully hold one role. Assigning multiple roles to the same battler has undefined behavior.

### `<aiRole: leader>`

Leader battlers act like normal enemies and obey their own AI traits, but they also make skill decisions on behalf of
nearby followers. A leader uses its own AI traits to choose which skill a follower should execute, effectively turning
followers into remote extensions of the leader's strategy.

NOTE: Leaders need followers nearby to actually coordinate. Without any followers in range, a leader behaves like a
normal enemy.

### `<aiRole: follower>`

Follower battlers are restricted to only their basic attack when no leader is nearby. When a leader is in range, the
leader will take over and decide which of the follower's skills to use. This is a great way to create "dormant" enemies
that suddenly become dangerous when a boss or leader enemy is present.

NOTE: Followers are intentionally hobbled without a leader. If you want followers that can still fight independently but
coordinate when a leader is around, give them other AI traits on top of this role.

### `<aiRole: guardian>`

Guardians are passive by default; they will not initiate attacks on their own. However, the moment one of their
ward-role allies is struck, the guardian immediately retargets to engage whoever attacked the ward. Think of guardians
as bodyguards who stay out of the fight unless their charge is threatened.

### `<aiRole: ward>`

Wards are the potential targets of guardian battlers. A ward itself has no special behavioral code -- it simply serves
as the "trigger" for a guardian to engage. Place this on any enemy you want others to protect.

### `<aiRole: solo>`

Solo battlers act purely on their own, ignoring all coordination logic. A solo enemy will not respond to leader commands
and will not be picked up as a follower. Use this for enemies that should fight independently even if they happen to be
in the same area as a leader or follower.

### `<aiRole: sentinel>`

Sentinel battlers hold their position. A sentinel will engage enemies that enter their sight, but once the target leaves
the sentinel's home range (based on pursuit radius), the sentinel disengages and returns home. Use this for "guard" type
enemies who aren't supposed to chase the player across the entire map.

NOTE: The sentinel's "home range" is measured from its spawn position. If the sentinel itself is pushed far from home,
it may disengage more readily than expected. Keep sentinel pursuit values reasonable.

## NOTE ABOUT CONFIGURING ROLES

AI roles are configured with the `<aiRole: X>` tag on the enemy database entry or as an event comment override. All
roles are optional; an enemy with no role behaves as a default self-interested combatant.

## TAG USAGE

- Enemies
- Event comments, as an override on an enemy event.

## TAG FORMAT

`<aiRole: leader>`

`<aiRole: follower>`

`<aiRole: guardian>`

`<aiRole: ward>`

`<aiRole: solo>`

`<aiRole: sentinel>`

## TAG EXAMPLES

`<aiRole: leader>`
This enemy holds the leader role.