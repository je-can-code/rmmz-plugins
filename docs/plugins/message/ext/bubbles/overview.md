---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [message-bubbles, overview]
---

# Overview

This plugin lets a message float above the character saying it, drawn as a bubble rather than shown in the box at the
edge of the screen.

The bubble is drawn at runtime rather than assembled from a windowskin, so it is sized to the text actually in it, and
the speaker's name sits inline in the bubble's own border rather than in a separate plate above it.

Messages that name no target are not left out: they are drawn as the same panel, without a tail, at whichever of
top/middle/bottom the Show Text command already asked for.

## Integrations

Integrates with others of mine plugins:

- `J-Base`; to be honest this is just required for all my plugins.
- [`J-Message`](../../core/overview.md); the glyphs in a bubble are its glyphs.

## Details

Line breaks are the author's, always. A long line makes a wide bubble; this plugin will never re-break a line to make it
fit something.

## Naming who is speaking

Put the text code below anywhere in a Show Text command, and the message floats above the target it names instead of
appearing in the message box. The code itself is removed before the message is drawn.

### Text code format

`\pop[TARGET]`
Where TARGET is one of the forms in the table below.

### Text code examples

`\pop[self]`
The message floats above the event running this command.

`\pop[player]`
The message floats above the player.

`\pop[e12]`
The message floats above event 12 of the current map.

`\pop[a1]`
The message floats above actor 1, wherever that actor is walking- as the player if they are leading the party, or as
the follower they currently are. If that actor is not marching with the party at all, no bubble is drawn.

`\pop[f2]`
The message floats above the second follower behind the player.

`\pop[320,180]`
The message floats at a fixed point on screen, and does not follow anyone.

A target naming nothing that exists- a deleted event, an actor sitting in reserve, a form with a typo in it- draws no
bubble, and the message appears as an ordinary panel instead.

## Conversations

A bubble does not disappear the moment its message closes. It stays where it is, dimmed and frozen, until the
conversation is over- so two characters trading lines both stay on screen and a player who blinks does not lose half of
an exchange.

A speaker who talks again replaces their own bubble rather than stacking a second one, so a character delivering four
lines in a row leaves one behind.

A conversation ends by itself the frame the player has control back, and the bubbles fade out rather than vanishing. An
event that is still running- still pausing, still walking its characters around between lines- has not handed control
back yet, so pacing about mid-scene costs nothing and no event needs anything written into it for this to be right.

Use the [End Conversation](commands/end-conversation.md) plugin command for a scene where the talking stops well before
the event does, and the last line would otherwise hang over somebody's head for the rest of it.

Changing map, entering a battle and opening the menu all end one too, because the characters those bubbles were pointing
at have stopped existing.