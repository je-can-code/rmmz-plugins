---
type: notetag
title: Overriding the Indicator per Enemy
description: The tags overriding, per enemy, whether its danger indicator shows.
tags: [abs-danger, tag, enemy, event, indicator]
---

# Overriding the Indicator per Enemy

## Description

By default, whether an enemy's danger indicator shows is controlled by the plugin parameter
"[Show Indicator by Default](../parameters/default-enemy-show-danger-indicator.md)". You can override this on a
per-enemy basis using the tags below.

## NOTE ABOUT EVENT-LEVEL TAGS

An event-level tag overrides whatever the database note tag or plugin parameter default would otherwise decide for that
specific event.

## TAG USAGE

- Enemies, in their database note.
- Event comments, on an enemy event, overriding the database default for that event.

## TAG FORMAT

`<noDangerIndicator>`
Suppresses the danger indicator for this enemy, regardless of the plugin parameter default.

`<showDangerIndicator>`
Forces the danger indicator to show for this enemy, regardless of the plugin parameter default. Only meaningful on an
event comment when the database default (or an event-level `<noDangerIndicator>`) would otherwise suppress it.

## TAG EXAMPLES

`<noDangerIndicator>`
This enemy never shows a danger indicator, even if the plugin parameter default is enabled.