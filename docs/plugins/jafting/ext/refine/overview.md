---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [jafting-refine, overview]
---

# Overview

This plugin enables the "refine" functionality of JAFTING. The "refine" functionality is basically a trait transferrence
system with some guardrails in-place.

## Integrations

Integrates with others of mine plugins:

- `J-Base`; to be honest this is just required for all my plugins.
- [`J-JAFTING`](../../core/index.md); the core that this engine hooks into to enable upgrading.

## Note about ingredient types

Stack-counted armor and weapon rows (one list row per stack) read type ids from [`J-JAFTING`](../../core/index.md) core
("[Material armor type id](../../core/parameters/material-armor-type-id.md)" /
"[Material weapon type id](../../core/parameters/material-weapon-type-id.md)"). Use -1 on either parameter to disable;
0 remains a valid database type id.

## Upgrading

Ever want to upgrade your equips by sacrificing others in the name of ascending to godliness? Well now you can! By using
a variety of tags placed deliberately on your equips throughout the database, you too can have a dynamic and powerful
upgrading system for equipment.

### How does it work?

This is an extension of the JAFTING plugin to enable the ability to "refine" equipment. "Refinement" is defined as
"transfering the traits of one item onto another". It is also important to note that "transferable traits" are defined
as "all traits on an equip in the database that are below the divider".

This functionality's exclusive target is equipment. The most common use case for this type of plugin is to repeatedly
upgrade a weapon or armor of a given type with new/improved traits, allowing the player to keep their equipment relevant
longer (or hang onto stuff for sentimental reasons, I guess). It works in tandem with a basic crafting system (the
JAFTING base system) to allow you, the RM dev, to come up with fun ways to allow not only you, but the player as well,
to flex creativity by using recipes to make stuff, then using refinement to upgrade it. With a wide variety of traits
spread across various equipment, combined with the [notetags below](#tags), this extension on JAFTING can make for some
interesting situations in-game (good and bad).

### Note about the divider

The "divider" is another trait: 'Collapse Effect'. It doesn't matter which option you select in the dropdown for this
(for now). Traits that are above the "divider" are considered "passive" traits that cannot be transfered.

### Note about trait removal

This plugin does not handle trait removal, so do keep that in mind.

## Menu management

In order to enable or disable menu access for this plugin, you can use the
[plugin parameter that identifies the switch](parameters/menu-switch.md) and toggle that in-editor. The enabling of the
menu option for refinement will match the state of the switch in the plugin parameters.

## Tags

Obviously, being able to willy nilly refine any equips with any equips could be volatile for the RM dev being able to
keep control on what the player should be doing (such as refining a unique equipment onto another and there by losing
said unique equipment that could've been required for story!).

- [Disable Refinement](notetags/disable-refinement.md)
- [Disallow Using as a Base](notetags/disallow-using-as-a-base.md)
- [Disallow Using as a Material](notetags/disallow-using-as-a-material.md)
- [Maximum Refinement Count](notetags/maximum-refinement-count.md)
- [Maximum Traits per Equip](notetags/maximum-traits-per-equip.md)