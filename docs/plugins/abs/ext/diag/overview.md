---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [abs-diag, overview]
---

# Overview

This plugin enables 8-directional movement for the player. This plugin enables the respect of diagonal directions for
JABS actions. This plugin enables diagonal facing script controls in moveroutes.

This plugin requires [JABS](../../core/overview.md).

## Diagonal directions for actions

Have you ever wanted your actions to respect diagonals? Well now they will! Additionally, by leveraging some
straight-forward script commands in your action event moveroutes, you too can diagonlize your actions moveroutes to make
spirals and all sorts of fun stuff!

Use this to turn an event 45 degrees to the right:

```js
this.turnRight45();
```

Use this to turn an event 45 degrees to the left:

```js
this.turnLeft45();
```

Use this to turn an event randomly right or left 45 degrees:

```js
this.turnRightOrLeft45();
```

### Homing actions

Have you ever wanted your actions to home into targets? Well now you can! By dropping one of these straight-forward
script commands into your action event moveroutes and slapping 'em on repeat, you too can home into current targets
and/or your last hit targets to your heart's content!

What is "Homing"?

"Homing" is defined as taking the absolute shortest route to the target, respecting terrain that the action cannot pass.
In most cases, action events probably have 'through' checked, so it will simply be the most direct route to the target,
but should the action not have 'through' checked, it will pathfind to the target.

Use this to force an action event to home into it's last-hit target:

```js
this.homeIntoLastHit();
```

Use this to force an action event to home into it's current target:

```js
this.homeIntoTarget();
```

### Seeking actions

Have you ever wanted your actions to sorta home into targets, but be a bit more subtle about it? Well now you can! By
dropping one of these straight-forward script commands into your action event moveroutes and slapping 'em on repeat, you
too can sorta gradually home into your current targets and/or your last hit targets to your heart's content!

What is "Seeking"?

"Seeking" is defined as turning 45 degrees once per step while moving toward the target, NOT respecting terrain that the
action cannot pass. In most cases, the action events will probably have 'through' checked, so it will simply be the
somewhat most direct route to the target, but should the action not have 'through' checked, it will loosely head towards
the target until a collision with something impassible.

Use this to force an event to seek it's last-hit target:

```js
this.seekLastHit();
```

Use this to force an event to seek it's current target:

```js
this.seekTarget();
```

## Note about notetags

This plugin has no notetags of its own. Everything here is exposed as script commands
(`turnRight45`/`turnLeft45`/`turnRightOrLeft45`/`homeIntoLastHit`/`homeIntoTarget`/`seekLastHit`/`seekTarget`) dropped
into action event moveroutes- there's nothing to tag on database objects.