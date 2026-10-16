---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [abs, overview]
---

# Overview

This plugin is JABS: J's Action Battle System. Using this plugin will enable you to carry out combat directly on the map
in real-time, similar to popular game franchises like Zelda.

## Details

Have you ever wanted to decorate events with tons of event comments and watch them come to life as AI-controlled
allies/enemies in an action battle system for your button-mashing hack-n-slash pleasure? Well now you can! Just slap
some tags on the various everything across the entire RMMZ editor, and you too can have a functional ABS, aka JABS!

## Integrations

In addition to JABS, I've written a suite (20+) of other plugins that add new systems or modify existing systems.

All plugins I have written are highly compatible with each other, and with JABS. Many of them were written to complement
JABS, such as the HUD or Ally AI.

If you find an issue with how my plugins are interacting with one another, feel free to reach out and let me know.

If you find an issue with how JABS is interacting with someone else's plugin, I encourage you to communicate with that
plugin author to have them reach out to me. We shall discuss the problem and try to find a solution.

Alternatively, you are welcome to file an issue against my GitHub repository describing the issue and how to reproduce
it minimally, and I will look into it when possible.

## How does it work?

### Setting up your enemy events

There are a lot of potential tags you can place all across the database to accomplish various goals, so let's get
started with setting up an enemy event.

First and foremost, all tags will be living inside comment event commands:
"Event Commands > Flow Control > Comment"

#### Note about priority of tags

With the exception of the ENEMY ID tag and MOVE SPEED tag, all the rest are mostly optional. If you place the same tags
for ENEMY EVENTS in the database, they will become the defaults for that enemy, and the tags in the event will act as
"overrides".

Priority order:

- 1st: tags in the ENEMY EVENT.
- 2nd: tags in the database on that particular enemy.
- 3rd: the defaults listed in the plugin parameters.

### First time setup, the enemy map

While you can create enemies on the map as much as your heart desires, it is also possible to dynamically generate
enemies on-the-fly with plugin or script commands. If you want to use this, you will need to define an "enemy clone map"
-- a map of premade enemy events used exclusively for spawning via plugin/script commands.

NOTE: If you have zero chance of using this functionality, JABS will operate fine as long as the map defined as "enemy
clone map" in the plugin configuration does indeed exist.

### Setting up the enemies in the database

Setting up an enemy event is not quite enough on its own. A couple of basics still need to be defined in the database.

NOTE: Configuration you want to apply universally to all enemies of a given id should be placed in the database notes
for that enemy, rather than repeated on every single event.

#### Basic attack

All enemies should have a "basic attack". This is defined by the "Attack Skill" trait, found at the top of the third
page in the trait picker for enemies.

#### Prepare speed

To emulate a "turn speed", enemies wait a fixed number of frames before acting. This is defined by the "Attack Speed"
trait found in the middle of the third page in the trait picker. An enemy without that trait can use the
`<prepare: FRAMES>` tag in its notes instead (see [Prepare Time](notetags/enemy-events/prepare-time.md)).

#### Available skills

Any skills listed in the "Action Patterns" section of an enemy in the database will be considered available. To create a
skill usable in JABS, see the "SETTING UP YOUR SKILLS" section below.

#### Note about conditions

Enemies do not currently obey conditions; they obey their AI traits along with skill cooldowns.

#### Note about skill extension for enemies

If you are leveraging `J-Extend`, extension skills must be known to the enemy in some form. Extension skills are
excluded from random selection but will still apply their extension effects.

### First time setup, the action map

If you're not using the demo as a base, you'll need to add a new map to your project where all the "action events" will
live. These events represent the visual components of skills on the map and are linked to skills via a tag on the skill.
Once you've created the map, take note of the map id and set it in the plugin parameters as
"[Action Map Id](parameters/action-map-id.md)".

### Setting up your skills

In addition to setting up enemies, you'll need to set up skills. There are a huge variety of tags to use, but a few will
appear on most skills.

#### Note about through

I would strongly encourage setting action events on the action map to have "through" checked. Otherwise, they may get
stuck on events or terrains unexpectedly, especially with pixel movement plugins.

### Using skills

Now that you've spent all this time setting up skills, you'll probably want to actually use them. Fortunately, that is
relatively easy.

#### Note about skill usability

In addition to the default RMMZ requirements (cost etc), the battler MUST know the skill to execute it. This is
especially relevant for the mainhand/offhand slots, where gear can provide a skill the actor never explicitly learned.

#### A little about skill slots first

JABS has eight skill slots:

- mainhand
- offhand
- tool
- dodge
- combat skill 1
- combat skill 2
- combat skill 3
- combat skill 4

### Aggro management

Any AI-controlled battler always targets the foe with the highest aggro value in relation to them. Aggro is a numeric
representation of how mad a battler is at another.

Review the plugin parameter tags for aggro generation defaults.

Aggro calculation order:

1. Base amount from plugin params.
2. HP, then MP, then TP damage.
3. HP Drain (MP/TP not considered).
4. Parry amount if applicable (target parrying also aggros attacker).
5. Bonus aggro from the aggro tags.
6. Bonus rate from the aggro tags.
7. Iterative multiplier from attacker states.
8. Iterative multiplier from target states.
9. Attacker TGR stat multiplier.
10. Player-unique multiplier, if applicable.

Steps 1-10 above produce a single delta that gets written to the caster's own aggro entry on the target. aggroPercent
and notMyAggro/notMyAggroPercent (see the aggro tags) are separate post-processing steps that run AFTER that write,
operating on already-stored aggro entries rather than this hit's delta.

### Configuring loot

After a hard day of chopping up trash mobs, reward your player with loot! Any droppable item from the database can be
collected. Consider using `J-DropsControl` for cleaner loot drop configuration.

#### Loot config

The same external file that defines the teams (`data/config.jabs.json`, see
[Teams](notetags/enemy-events/teams.md)) carries a `loot` block, also REQUIRED:

```json
{
  "loot": {
    "magnetRadius": 2,
    "magnetSpeed": 0.08,
    "magnetAcceleration": 3.5
  }
}
```

`magnetRadius` is the baseline distance in tiles from which a battler draws loot drops toward themselves, before any
`<lootMagnetBuff:N>` or `<lootMagnetRate:N>` the battler carries is applied.

`magnetSpeed` is how fast a drop travels in tiles per frame at the very edge of that radius, and `magnetAcceleration` is
how much faster it moves as it closes, so a drop snaps home rather than drifting the last half tile.

Tune the radius against how the party actually fights: a value wide enough to reach a ranged kill collects loot the
player never approached, which quietly removes the decision to go and get it.

### Setting up states

States are obviously critical to any good RPG! There are a few important concepts to understand when building states for
JABS.

### Visual metadata

These tags are placed on skills and control how the action event sprite looks on the map. None of them affect hitboxes
or physics.

All tags are optional. Omitting a tag leaves that property at its default value.

### Cast preview

These tags control the hitbox preview overlay that is shown on the map while a battler is casting a skill. Previews are
visible by default if the hitbox overlay system is enabled.