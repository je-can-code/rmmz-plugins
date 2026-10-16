---
type: notetag
title: Gap Closing
description: The tags marking a skill as gap closing and a target as gap closable, matched by key.
tags: [abs-tools, tag, skill, enemy, event, gap-close]
---

# Gap Closing

## Description

Have you ever wanted to be able to use a skill and gap close to a target without having to take the painstaking effort
of manually moving to the given target? Well now you can! By applying the appropriate tags to various database
locations, you can enable/disable gap closing for your battlers!

## NOTE ABOUT REQUIRED TAGS

There are a number of tags required to make this work, so this will deviate from normal tag explanations a bit.

## NOTE ABOUT KEYS

Keys are arbitrary strings (word characters only). They act as a namespace so that different gap-close mechanics cannot
accidentally cross-trigger. For example, a hookshot skill with `<gapClose:hookshot>` will never warp the player to an
enemy bearing `<gapCloseTarget:pierce>`, and vice versa.

## TAG USAGE

- Event comments, primarily.
- Skills, primarily.
- Enemies, primarily.
- Actors, secondarily.
- Classes, secondarily.
- Skills, secondarily.
- Weapons, secondarily.
- Armor, secondarily.
- States, secondarily.

## TAG FORMAT

`<gapClose:key>`
This tag is required on skills that you want to be "gap closing skills". The key must match the key on the target for
gap closing to occur.

`<gapCloseTarget:key>`
This tag is required on the things you want to be "gap closable", such as enemies or on events representing enemies.
This tag can also be applied to things that a battler can be affected by, such as equipment or states. The key must
match the key on the skill for gap closing to occur.

## TAG EXAMPLES

`<gapClose:hookshot>` on skill ID 25.
`<gapCloseTarget:hookshot>` on an event representing a grapple anchor.
Using skill 25 against that event will pull the player to it.

`<gapClose:pierce>` on skill ID 34 (spear pin).
`<gapCloseTarget:pierce>` on state ID 4 (pinned state).
An enemy hit by skill 34 receives state 4.
Using skill 34 again against that pinned enemy will pull the player to it.
Hookshot anchors are unaffected because their key does not match.