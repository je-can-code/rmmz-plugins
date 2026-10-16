---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [prof, overview]
version: "2.6.0"
---

# Overview

This plugin enables the ability to have actors grow in prof when using skills. Additionally, triggers can now be
configured to execute against these new proficiencies (and other things).

## Integrations

Integrates with others of mine plugins:

- [`J-ABS`](../../abs/core/overview.md); actions performed in JABS will accrue proficiency.
- [`J-Elem`](../../elem/core/overview.md); enables damage formula integration for proficiency.

## Details

This plugin tracks all skill usage for all battlers (actors and enemies, though with enemies it is much less meaningful
since they are short-lived). By defining "proficiency conditionals", you can enable actors to unlock new skills or gain
other javascript-based rewards by using their skills.

### When using J-Elementalistics

Additionally, a new parameter is exposed in the "damage formula" for `p` which represents the attacker's proficiency in
the skill being used. For example, consider the following formula:

```js
((a.atk * 4) + p) - (b.def * 2)
```

We would now translate that as:

```
4X attacker ATK + attacker's proficiency in this skill
minus
2X defender DEF
```

Which gives this skill the ability to scale the more the attacker uses this skill. Be aware there is no practical upper
limit on proficiency, so if the game is intended to go on for a long while, such scaling could be difficult to balance
in the long run. Use it in damage formulas wisely!

### Important note about configuration data

The configuration data for this plugin is derived from an external file rather than the plugin's parameters. This file
lives in the `/data` directory of your project, and is called `config.proficiency.json`. You can absolutely
generate/modify this file by hand, but you'll probably want to visit my github and swipe the `jmz-data-editor` project
I've built that provides a convenient GUI for generating and modifying the configuration.

If this configuration file is missing, the game will not run.

Additionally, due to the way RMMZ base code is designed, by loading external files for configuration like this, a
project made with this plugin will simply crash when attempting to load in a web context with an error akin to:

```
ReferenceError require is not defined
```

This error is a result of attempting to leverage nodejs's `require` loader to load the `fs` (file system) library to
then load the plugin's config file. Normally a web deployed game will alternatively use `forage` instead to handle
things that need to be read or saved, but because the config file is just that- a file sitting in the `/data` directory
rather than loaded into `forage` storage- it becomes unaccessible.

## Plugin commands

### [Modify Actor's Proficiency](commands/modify-actor-skill-proficiency.md)

This command will allow you to increase or decrease a single actor's proficiency for a given skill. You only need choose
the actor, skill, and the amount to increase/decrease by.

### [Modify Party's Proficiency](commands/modify-party-skill-proficiency.md)

This command will do the same as the [single actor's command](commands/modify-actor-skill-proficiency.md) above, but
instead apply against the whole party.

### Notes

- You cannot reduce a skill's proficiency in a skill below 0.
- Increasing the proficiency can trigger rewards for the skill.
- Decreasing the proficiency will NOT undo rewards gained.