---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [class, overview]
version: "1.0.0"
---

# Overview

This plugin gives every actor a set of classes they have unlocked, and a scene where the player reviews those classes
and, where the game allows it, changes between them.

## Integrations

Integrates with others of mine plugins:

- [`J-Base`](../../_base/core/overview.md); to be honest this is just required for all my plugins.
- [`J-CMS`](../../cms/core/overview.md); the parameters are formatted through it, so a stat reads the same here as on
  the equip screen.
- [`J-Classes-Aptitude`](../ext/apt/overview.md); adds each class's learnings beside the parameters, and each class's
  progress to the list.
- [`J-Classes-Natural`](../ext/natural/overview.md); lists each class's natural growths beneath the parameters.
- [`J-LevelMaster`](../../level/core/overview.md); gives Max Tech a curve, so Max Tech gets a multiplier like any other
  parameter with one.

## Details

An actor's class list shows every class they have unlocked, plus the class they are wearing right now. Classes are
unlocked for one actor at a time with the "[Unlock Classes](commands/unlock-classes.md)" plugin command, and nothing
ever locks one again.

A class set aside for particular actors also shows in their lists before they unlock it, as a dimmed "???" row that
gives nothing away. See [Unlockable For Actors](notetags/unlockable-for-actors.md).

Whether [the scene](scenes/classes.md) can change classes is decided by whatever opens it:

- The "[Call Scene](commands/call-scene.md)" plugin command says whether changing is allowed. This is how a game ties
  changing classes to a place or a moment: open the scene with changing allowed from there, and from nowhere else.
- The main menu's command only views, unless the "[Menu Change Switch](parameters/menu-change-switch.md)" is set and ON.

Opened without changing allowed, every class can still be browsed and read; confirming a class only buzzes.

Changing classes keeps the actor's experience.

## Layout

Beside the class list, everything about the highlighted class is shown at once: its description across the top, then its
parameters, with whatever extensions list beneath them, and any window an extension places beside them. There are no
pages to cycle.

### Description

RPG Maker's editor has no field for a class's description, so it is written in the JMZ data editor, on the Classes
board. A class without one leaves the strip across the top blank.

### Icons

RPG Maker's editor has no field for a class's icon either, so it is chosen in the JMZ data editor too. A class without
one is drawn with the "[Class Icon](parameters/class-icon.md)" parameter's icon, and so is every "???" row.

### Parameters

Every class lists the same fifteen parameters, in the same order, so a row never moves as the cursor goes from class to
class: the resources (Max Life, Max Magi, Max Tech), the six core stats (attack, magic attack, defense, magic defense,
agility, luck), then Accuracy, Parry, Crit Rate, Crit Dodge, Physical Evasion and Magic Evasion. A growth section an
extension lists beneath reads in the same order.

For any other class, a parameter changing into it would move reads what it would become and by how much, green when the
change is good for the actor and red when it is bad. One it would leave alone reads as it stands, in white. For the
class the actor is already in, nothing would change, so every parameter reads as it stands. Every value is padded with
zeroes, the way the equip screen pads a value as it stands.

Every value is raw: the actor without their equipment. The class's curve and buffs, the actor's own growth and their
passives all count, and gear does not, since a class that cannot wear what is equipped takes it off the moment it is
changed into.

Each parameter reads across four columns, so the numbers line up from row to row: its name, the class's multiplier, its
value, and its change.

```
 Max Life   ×0.80   1674   (-419)
```

The multiplier is how a class's growth curve scales a parameter: the class's curve over the curve of the class the actor
started the game in, measured at level 99. A class authored as the starting class's curve times some number shows
exactly that number, and a curve times one reads ×1.00, the class leaving the parameter alone. The starting class is the
Class set on the actor's own database entry.

RPG Maker gives Max Tech no curve. Under `J-LevelMaster`, a class's
[`<mtpGrowthCurve>`](../../level/core/notetags/growth-curves.md) tag is its Max Tech curve, and is measured the same
way.

`J-Classes` only knows curves. An extension can measure other parameters the same way:
[`J-Classes-Natural`](../ext/natural/overview.md#multipliers) measures a parameter with no curve by what the class buffs
it by while worn.

A class that grants passive states through a [`<passive>`](../../passive/core/notetags/passive-states.md) tag is
previewed without them.