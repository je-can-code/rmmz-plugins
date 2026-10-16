---
type: notetag
title: Teams
description: The tag assigning a battler to a team, and the required config file defining the teams.
tags: [abs, tag, enemy, event, team, config]
---

# Teams

## Description

JABS teams are now fully data-driven.

Team relationships (friendly vs opposing) are defined in an external file:

- `data/config.jabs.json`

This file is REQUIRED. If it is missing or invalid, JABS will error on boot.

The root shape is an object with a `teams` array:

```json
{
  "teams": [
    { "id": 0, "name": "Allies", "opposes": [ 1, 2 ] },
    { "id": 1, "name": "Enemies", "opposes": [ 0, 2 ] },
    { "id": 2, "name": "Neutral", "opposes": [ 0, 1 ] }
  ]
}
```

Default team assignment (unchanged):

- Actors and party battlers are team 0.
- Enemies are team 1 (unless overridden).
- Inanimate battlers are team 2.

Assigning a team id is still done via notes/event comments.

The same file also carries the loot settings; see "Configuring loot" in the [overview](../../overview.md).

## TAG USAGE

- Event comments, on an enemy event.
- Enemies, as a default for that enemy.

## TAG FORMAT

`<teamId:TEAM>`
Where TEAM is the numeric id to assign to the battler.

## TAG EXAMPLES

`<teamId:2>`
This battler is assigned the team id 2.