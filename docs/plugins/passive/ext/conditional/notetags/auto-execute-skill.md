---
type: notetag
title: Auto-Execute Skill
description: The tag firing a map skill from its bearer on a timer or a combat event, with no cost or cooldown.
tags: [passive-conditional, tag, skill, trigger, condition]
---

# Auto-Execute Skill

## Description

Fires a map skill through JABS `forceMapAction` — no MP/TP cost, no skill cooldown. Victims may parry and retaliate.
Payload skill owns radius, hitbox, and formula.

### Cast time

A payload with a `<castTime>` winds up first. It takes its bearer's cast slot, so the map paints its telegraph and
counts the windup down exactly as for any cast, and it fires the moment the windup ends, still with no cost and no
cooldown. A bearer already deciding or casting something keeps it and skips that firing; a timed or proximity rule
tries again on the next frame, while an event-driven one (a hit, a kill) lets that event pass.

### Aim

A rule fired by a hit (`onDamageDealt`, `onWeaponHit`) knows the battler that was struck, and a `<direct>` payload lands
on that battler's tile: an enchant's follow-up hits the foe the swing hit, not whatever stands around the one swinging.
A payload with a cast time keeps that aim through its windup, and lands where it was aimed even if the foe moves. Every
other payload fires from its bearer, as does every payload on any other condition.

### Conditions

PARAM meaning matches [`autoApplyState` CONDITIONS](auto-apply-state.md), plus the four- or five-value tuple
`enemiesNearby` / `alliesNearby` / `enemiesNearbyBelow` / `alliesNearbyBelow` take (see TAG FORMAT). A skill carrying
[`<countsAsWeaponHit>`](counts-as-weapon-hit.md) fires `onWeaponHit` rules as a basic attack does.

## NOTE ABOUT THE PAYLOAD SKILL

Do not tag the payload skill with `autoExecuteSkill` ([depth guard](../parameters/auto-execute-skill-max-depth.md)).

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills

## TAG FORMAT

`<autoExecuteSkill:[SKILL_ID, CONDITION, PARAM]>`
Where SKILL_ID is the map skill to fire,
Where CONDITION is one of the conditions above,
Where PARAM meaning matches the `autoApplyState` CONDITIONS.

`<autoExecuteSkill:[SKILL_ID, KIND, COUNT, FRAMES]>`
Where KIND is `enemiesNearby`, `alliesNearby`, `enemiesNearbyBelow` or `alliesNearbyBelow`;
`enemiesNearby`/`alliesNearby` fire at or above COUNT; the Below variants fire strictly under COUNT,
Where FRAMES is the minimum FRAMES between firings, as for the `autoApplyState` CONDITIONS,
Where an optional fifth TRIGGER_TILES overrides [`default-proximity-tiles`](../parameters/default-proximity-tiles.md)
for the gate only.

## TAG EXAMPLES

`<autoExecuteSkill:[1021, time, 60]>`
`<autoExecuteSkill:[1022, enemiesNearby, 1, 60]>`
`<autoExecuteSkill:[1023, move, 1]>`
`<autoExecuteSkill:[1024, stand, 120]>`

`<autoExecuteSkill:[1025, enemiesNearbyBelow, 1, 60, 1]>`
Casts skill 1025 every 60 frames while no enemy is within 1 tile.

`<autoExecuteSkill:[1026, onWeaponHit, 0]>`
Magic-knight style: every basic-attack (or combo) hit also fires skill 1026 on the target, landing on that foe when
1026 is `<direct>`.

`<autoExecuteSkill:[1027, whenGlanced, 0]>`
Retaliate on a glancing blow: every time this battler is grazed, fires skill 1027 as a real map action from this
battler's own position. No auto-aim at the attacker- the payload skill's own hitbox/range decides who it reaches
(self-centered radial or facing-cone reads as "retaliation"). Only the hit-driven conditions aim.