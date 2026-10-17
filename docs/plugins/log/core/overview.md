---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [log, overview]
version: "3.0.3"
---

# Overview

This plugin enables logging functionality. It has three built in logging managers:

- Action Log
- Loot Log
- DiaLog

Each of the logging managers is responsible for different types of logging for the player to observe.

This plugin was designed for JABS, but doesn't require it. If added while using JABS, the log window will automatically
register all actions taken, damage/healing dealth, loot and such picked up, and more.

Additionally, the log window is a command window under the covers, so it also supports scrolling via mouse/touch.

Controller/keyboard support for the log window is not supported.

## Integrations

Depends on other plugins of mine:

- `J-Base` (used for drawing the logs properly onto the window)
- `J-Message` (used for translating text codes in logging)

Integrates with others of mine plugins:

- `J-ABS`; enables logging of the player/allies/enemies' actions.
- `J-SDP`; enables logging of SDP gains.

## The action log

This log is designed for the player to view various interactions that happen through the course of playing the game.
While this plugin doesn't require it, it was designed to be used with JABS.

Things that get reported to the Action Log (with JABS):

- a skill being used (player/allies/enemies)
- a target being defeated (player/allies/enemies)
- a skill being learned (player/allies/enemies)
- a level up (player/allies)
- a state being applied to oneself (player/allies/enemies)
- a retaliation (player/allies/enemies)
- a skill being parried (player/allies/enemies)
- a skill being dodged (player/allies/enemies)
- a skill not affecting a target (player/allies/enemies)
- the act of party cycling (player)
- the experience gained (the leader, others gain it, but no logs are added)
- the sdp points found (the leader, others gain it, but no logs are added)

Without JABS, nothing is added by default and must be woven into wherever a developer wants it to show up since most
usages and executions would happen in a non-`Scene_Map` context.

This window is effectively just a `Window_Command` under the covers, which means it is nothing more special than your
average Show Choices window or what have you. However, it is not accessible to the keyboard or controller, which means
only a mouse may interact with it (due to the fact that it cannot be "selected").

## The loot log

This log is designed for the player to exclusively messages related to items and their acquisition or loss.

Things that get reported to the Loot Log (with JABS):

- the gold found (on enemy defeat)
- an item being used (player)
  - also if the last item in the party's possession was used (player)

Without JABS, nothing is added by default. It was a conscious decision not to integrate the loot log with the
`Game_Party#gainItem()` function- so that other devs may have control over when it the logs are added, in case there
were items that should be added silently.

## The DiaLog

This log is designed for the player to view messages that occur while things on the map are still executing. This
portion of the plugin has nothing to do with JABS and is not influenced by it.

To add messages to the DiaLog, you'll need to utilize a [plugin command](commands/add-dia-log.md). In it, you will find
the parameters are similar to that of a regular message window, except that it is smaller, and in the upper right
corner. You can specify the message (max of three lines), and optionally a face image and index to accompany the message
to enable chatter that doesn't interrupt the flow of gameplay.

It is worth noting that the DiaLog window is an extended version of the Action Log window, and bears many of the same
sorts of functionality, including the ability to scroll with the mouse and not control it with the keyboard/controller.
It will automagically become invisible after lack of interaction.

When setting up events that add to the DiaLog, it is encouraged to consider using parallel events that add the messages
with Waits in between each message to give it a proper dialogue-like effect rather than dumping all the messages in at
once, but not being able to see them because the player has to scroll up.

## Note about notetags

This plugin has no notetags of its own- logging is driven entirely by JABS integration (when installed) and by plugin
commands.