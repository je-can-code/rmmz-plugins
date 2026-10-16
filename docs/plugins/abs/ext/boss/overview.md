---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [abs-boss, overview]
version: "1.0.1"
---

# Overview

This plugin allows boss fights to be authored as data instead of as long chains of event commands.

A boss encounter describes who is fighting, who is allowed to drive them, and what recurs while the fight runs. That
description lives in an external configuration file, which means a fight can be revised, retimed, or rebuilt without
opening a single event page.

## Integrations

Integrates with others of mine plugins:

- `J-Base`; to be honest this is just required for all my plugins.
- `J-ABS`; the battle system the encounters take place in.

## Details

Encounters are defined in the `bosses` block of `data/config.jabs.json`, alongside `teams` and `juice`. Each encounter
names a map, one or more participants, and any number of recurring routines.

Participants are a list rather than a single boss on purpose. A lone boss, a boss with destructible parts, a pair of
twins, and a swarm sharing a single health pool are all the same structure with a different win condition, so none of
them require a new shape later.

Nothing in this plugin draws anything. What a boss is - a battler, a health pool, a set of behaviors - is combat
knowledge, and a frame drawn around a health bar is a view of that knowledge. Anything wanting to display a boss asks
this plugin for it.

## Authoring an encounter

A minimal encounter looks like this:

```json
{
  "teams": [ ... ],
  "juice": { ... },
  "bosses": [
    {
      "key": "gluttonwolf",
      "map": 75,
      "participants": [
        {
          "key": "mayor",
          "eventId": 4,
          "enemyId": 581,
          "expect": "Gluttonwolf Mayor"
        }
      ],
      "aiControl": "shared",
      "routines": [
        {
          "key": "devour",
          "cadence": 20,
          "steps": [
            {
              "verb": "forceSkill",
              "skill": 2584,
              "expect": "Devour",
              "cast": true
            }
          ]
        }
      ]
    }
  ]
}
```

### AI control

`shared` means the encounter layers behavior on top of a boss that its normal AI continues to drive. This is the
default and it is what most fights want.

`scripted` means the encounter drives the boss outright for the duration of a routine, and the routine is expected to
suppress the normal AI itself.

### Cadence

A routine's cadence is measured in seconds, counted from the moment the encounter starts, so a routine's first
execution is a full interval away rather than landing on the first frame of the fight.

When a routine comes due while the boss cannot act - stunned, or already casting - that execution is skipped rather
than queued. Queueing would mean a stun releases into every missed execution firing back to back.

### Cast time

A step's `cast` property decides whether the skill observes its own cast time. This is not cosmetic. A cast time is the
telegraph - the window in which a player reads an attack and moves out of it - so a skill executed without its cast
time is a skill that cannot be dodged.

It defaults to true. Set it to false only for scripted set-pieces that are not meant to be reacted to.

### The `expect` property

Every database reference carries the name that row had when the encounter was authored. Before a fight runs, those
names are checked against the database as it stands now.

This exists because a stale id fails silently. When a database is rebalanced and ids move, a fight that references the
old numbers keeps running - it just summons the wrong enemy or casts the wrong skill, forever, without complaint.
Recording the name turns that silence into a crash at the one moment an author can act on it.