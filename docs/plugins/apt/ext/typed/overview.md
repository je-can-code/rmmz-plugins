---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [apt-typed, overview]
---

# Overview

This plugin extends the [Aptitude System](../../core/overview.md) by allowing the ability to define teachables to
require certain "types" of AP, and also allow the player to gain certain "types" of AP.

## Integrations

Integrates with others of mine plugins:

- `J-Base`; to be honest this is just required for all my plugins.
- [`J-Log`](../../../log/core/overview.md); log the type of AP gained.
- [`J-Popups`](../../../popups/core/overview.md) (+ [`J-Popups-APT`](../../../popups/ext/apt/overview.md)); updates
  popups for typed AP gained.

## Details

This plugin allows the dev to create teachable skills that demand specific "types" of AP to be earned instead of just
plain AP. AP is "typed" by one of two approaches: either explicit (putting a new "typed AP gain" tag on specific
enemies, similar to the existing [AP gain tag](../../core/notetags/ap.md)) or implicit (the ability to dynamically
assess elements and the means of which an enemy was defeated to determine what "types" of AP the player should earn).

By default, implicit AP gains are disabled. Update the plugin parameters to enable implicit AP gains. See the
[next section](#explicit-vs-implicit) for more details.

## Explicit vs implicit

### Explicit

What is "explicit" typed AP gain? You, the dev, can explicit apply tags to enemies of your choosing and state that a
particular enemy will grant a particular type of AP. Period. That is it. You can specify that a fire demon grants 25
fire AP, or if you wanted, you can specify that that same fire demon actually grants 10000 water AP. It is explicit and
simply whatever tags you apply.

### Implicit

What is "implicit" typed AP gain? You, the dev, no longer need to worry about that cumbersome effort of having to cycle
over the entire database of enemies and applying tags to them. Instead, the system will evaluate the means of defeat and
the enemy being defeated and determine "which type of AP" the player should gain. The system will identify enemies as
"aligned" by the following conditions in conjunction with the plugin parameter values (that have sensible defaults).

### Implicit elemental gain from enemies (elemental type)

If an enemy has a elemental trait on them that is equal to or lesser than the plugin parameter
"[Elemental Alignment Threshold](parameters/resist-threshold.md)", then that enemy is "aligned" with that particular
element.

### Implicit elemental gain from enemies (slayer type)

If an enemy has an elemental trait that is prefixed with "vs " or "x " or "tool-" and it has a value that is equal to or
greater than the plugin parameter for "[Slayer Alignment Threshold](parameters/slayer-weakness-threshold.md)", then that
enemy is "aligned" with that particular element.

### Note about "slayer" typed elements

"Slayer" type elements are an arbitrary concept where an element doubles as a "taxonomy/attribute/functionality
identifier" for an enemy. Examples of such might be:

- "vs Reptile" (taxonomy of lizards and dragons)
- "vs Undead" (taxonomy of zombies and skeletons)
- "vs Slime" (taxonomy of slimes and oozes)
- "vs Construct" (taxonomy of robots and machines)
- "x Flying" (attribute of enemies that fly or have wings)
- "x Armored" (attribute of enemies that are armored or have shells)
- "tool-shatter" (functionality of being susceptible to shatter effects)
- "tool-overload" (functionality of being susceptible to overload effects)

I do not know if this is a common usage of elements, but it is how I leveraged elements in my own games, so if you want
this type of functionality in your game, you'll need to adapt your elements to follow such conventions because it is
hard-coded to look for this stuff. You also do not have to use it.

### Implicit weapon type gain from usage

If an enemy is defeated with a skill that has a "required weapon type" value on it, then AP gained from that enemy will
be of that "weapon type".

### Implicit skill type gain from usage

If an enemy is defeated with a skill that is a part of a particular "skill type", then AP gained from that enemy will be
of that "skill type".

### Implicit element gain from usage

If an enemy is defeated with a skill that has a particular element (or elements if using `J-Elementalistics`), then AP
gained from that enemy will be of that particular element.

### Note about AP gained implicitly

All implicit gains will refer to the base [`<ap:AMOUNT>`](../../core/notetags/ap.md) tag and will be gained at
"[Percent of Implicitly-Typed AP Gained](parameters/implicit-enemy-element-percent.md)"% of AMOUNT. By default, this is
set to 0, meaning that no implicit AP gains will occur. If this system is