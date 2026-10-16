---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [message-chatter, overview]
version: "1.0.3"
---

# Overview

This plugin lets characters talk to themselves as the player walks past.

A civilian mutters about the weather; a shopkeeper tries to peddle his goods. Nobody pressed a button and nothing was
interrupted to make it happen: chatter runs alongside whatever the player is doing, never blocks the interpreter, and
never takes the player's input.

## Integrations

Integrates with others of mine plugins:

- `J-Base`; to be honest this is just required for all my plugins.
- [`J-Message`](../../core/overview.md); a chatter line is laid out as that plugin's glyphs.
- [`J-Message-Bubbles`](../bubbles/overview.md); a chatter line is drawn as that plugin's bubble.

## Details

Chatter is declared on an event page, which means it inherits that page's conditions for free. A merchant who has closed
up for the night is page two with no chatter tags on it, and the muttering stops with the page.

Chatter is silent- it plays no sound as it types itself out. A whole town of blipping NPCs gets obnoxious fast.

Line breaks are the author's, always. A chatter line is never re-wrapped.

## Project Defaults

The defaults every character starts from live in the `chatter` section of `data/config.message.json`, alongside the
speaker profiles. A project that has not written that section gets the plugin's own defaults, which are the numbers
used as [examples](notetags/tuning-one-character.md#tag-examples).

## When Chatter Stops

- The player walks out of earshot. The line is cut where it stands.
- A message opens above that character. Somebody you have started talking to stops muttering; everybody else carries
  on.
- An event takes the floor. A cutscene does not get heckled, and every idle line on the map is cut for the duration of
  it.
- The map changes.

A line forced by the [plugin command](commands/chatter-now.md) ignores the first two - it is heard from anywhere and it
carries on through a cutscene, which is the entire point of it. It is still cut by the map changing, and by a message
opening above that same character, because one character cannot be muttering and speaking dialogue in the same place at
the same time.

Note that this is only ever about the character the message is on. A forced line on somebody else carries on
regardless - one character thinking while another one talks needs nothing at all, whatever the two of them are doing.

For the same character, tick Keep During Dialogue on the [command](commands/chatter-now.md). That is how one person
holds a thought while saying something else out loud. It is also the one case where the two bubbles share an anchor
however much room the scene has, so give them opposite sides - the thought at `top` and the spoken line at `bottom`, or
the reverse.