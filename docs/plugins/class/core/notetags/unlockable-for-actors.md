---
type: notetag
title: Unlockable For Actors
description: The tag setting a class aside for particular actors, so only they can ever unlock it.
tags: [class, tag, unlock, actor]
---

# Unlockable For Actors

## Description

Want a class only certain actors can ever unlock, like a job one character grows into and nobody else does? By applying
the appropriate tag to the class, you can set it aside for the actors it lists.

It unlocks only for them: an "[Unlock Classes](../commands/unlock-classes.md)" command naming any other actor is
refused, with a warning in the console. Until one of those actors unlocks it, the class waits in their list as a dimmed
"???" row, with no name, icon or details, and confirming it buzzes. Every other actor never sees it at all.

A class without the tag is open to anyone, and stays out of every list until it is unlocked.

## TAG USAGE

- Classes

## TAG FORMAT

`<unlockableForActors:[ACTOR_ID, ACTOR_ID, ...]>`
Where each ACTOR_ID is an actor this class can be unlocked for.

## TAG EXAMPLES

`<unlockableForActors:[1]>`
Only actor 1 can unlock this class, and it waits in their list as "???" until they do.