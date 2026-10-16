---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.2.0
  - The equipment list now orders by database id rather than by the datastore slot each row happens to occupy. A refined
    equip keeps the id of the thing it was refined from and only takes a new slot, so slot order stranded every refined
    copy in a block at the bottom of the list, far from the plain one it came from. Id order sits them together, plain
    one first, and puts two copies of the same equip next to each other. The empty row meaning "take this slot off" has
    no id and stays pinned last.
### 1.1.0
  - Added a context action on the equip slot list to unequip the currently-selected slot directly, without opening the
    item list.
  - Renamed slot-window handler symbols pagedown/pageup to actor-next/actor-prev.
### 1.0.0
  - Initial release.