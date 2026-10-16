---
type: notetag
title: Content Sync
description: The map tags that activate content level sync and choose between cap-only and uplevel mode.
tags: [level-sync, tag, map, sync, level]
---

# Content Sync

## Description

The map note tag is the convenience way to activate content sync, scoped to the map. Add `<levelSync:N>` to a map's note
field. Sync activates on map setup and clears automatically when leaving a map without the tag (provided no session is
active).

### `<levelSync:N>`

Activate content sync at level N on this map (N must be > 0). Default mode is cap-only: overleveled actors clamp down to
N, underleveled actors are unaffected.

### `<levelSyncUp>`

Paired with `<levelSync:N>`. Enables uplevel (exact sync) mode: all actors fight at exactly level N, including
underleveled ones.

## NOTE ABOUT SESSIONS

Map notes are ignored when a session is running. See [session priority](../overview.md#session-priority) for how a
session started by the [Set Content Sync](../commands/set-content-sync.md) plugin command takes priority.

## TAG USAGE

- Maps, in the map's note field.

## TAG FORMAT

`<levelSync:N>`
Where N is the level to sync to, which must be greater than 0.

`<levelSyncUp>`

## TAG EXAMPLES

`<levelSync:50>`
Cap-only at 50.

`<levelSync:50>`
`<levelSyncUp>`
Exact sync at 50.