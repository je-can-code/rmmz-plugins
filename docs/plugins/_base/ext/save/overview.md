---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [base-save, overview]
version: "1.0.3"
---

# Overview

This plugin replaces how RPG Maker MZ writes and reads savefiles.

Vanilla treats a save as a dump of the live game objects: it is compressed, it is one file per slot, and every value in
it is whatever the engine happened to be holding at the moment you pressed save. That makes a save unreadable,
impossible to hand-edit, and quietly full of data the game already knows how to rebuild.

With this plugin a slot becomes a directory of pretty-printed JSON, written through per-type codecs that decide what is
worth keeping.

## Details

A slot looks like this on disk:

```text
save/
  config.json                 settings that outlive every save
  profile.json                anything that outlives one playthrough
  file1/
    current                   names the live generation
    gen-0007/
      manifest.json           what the load menu reads
      world.json
      party.json
      actors.json
      systems/
```

Three things follow from that shape.

A save is READABLE. Open it in any text editor and the state of the game is right there, in named fields, in indented
JSON.

A save is RECOVERABLE. Each save writes a new generation and then swaps a one-line pointer, which is the only filesystem
operation that is genuinely atomic. A crash mid-write leaves the previous generation live and untouched, so the worst
case is losing the newest save rather than losing the file.

A save is HONEST. Derived data - caches, timers, anything the game rebuilds on its own - is
[declared as such](../../../../save-system.md#deciding-what-is-transient) and never written, so what is in the file is
only what actually had to be remembered.

## The files scene

This plugin also replaces `Scene_Save` and `Scene_Load` with [a single scene](scenes/files.md) that saves, loads,
deletes, and rewinds. What it offers depends entirely on where it was opened from:

| Opened from | Offers |
|---|---|
| save platform | Save, Load, Rewind |
| main menu | Load, Rewind |
| title screen | Load, Delete |

Commands an origin does not offer are omitted rather than greyed out. The player should never learn that these are the
same screen.

REWINDING is loading an older generation of the slot being played, listed newest first and labelled by how long ago
each one was written. It is NOT a delete: the pointer stays where it is and the next save writes a new generation on
top, so the state rewound away from remains on disk until [retention](parameters/retained-save-generations.md) retires
it normally. Rewinding is itself undoable.

DELETING is the only irreversible thing in the scene, which is why it exists only at the title screen. It takes the
whole slot, pointer first.

Every save also writes a `snapshot.jpg` into its generation - the map, cropped around where the player was standing -
which the list draws beside each row. It is deliberately not named in the manifest, so a lost picture can never cost
anybody a save.

## Note about save compatibility

Savefiles written by vanilla RPG Maker MZ cannot be read by this plugin, and savefiles written by this plugin cannot be
read without it. There is no converter. Install it before a project has saves worth keeping.