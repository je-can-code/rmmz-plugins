---
type: notetag
title: Piercing
description: The tag defining how many connections a skill's map action may complete, and the delay between them.
tags: [abs, tag, skill, pierce, hits]
---

# Piercing

## Description

Defines how many collision "steps" (connections) the map action may complete before it ends, and the delay between those
steps.

## NOTE ABOUT HIT FREQUENCY

The most a skill can register a new connection is once per frame. A DELAY of 0 means it can connect every frame its
hitbox overlaps valid targets.

## NOTE ABOUT DATABASE REPEATS

JABS does not read the RMMZ skill "repeats" field for pierce or for extra hits per connection. Use `<pierce:[...]>` and
the [bonus-hits tags](per-connection-bonus-hits-skill-note.md).

## TAG USAGE

- Skills

## TAG FORMAT

`<pierce:[TIMES,DELAY]>`
Where TIMES is the connection budget for this skill (including the first).
Where DELAY is the number of frames to wait before the next connection.

## TAG EXAMPLES

`<pierce:[3,10]>`
This skill has a connection budget of 3 (including the first), and waits 10 frames before each next connection.