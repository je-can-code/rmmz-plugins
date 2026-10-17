---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [motion, overview]
version: "1.2.0"
---

# Overview

A character on the map is a static sprite that slides between tiles. This plugin makes it move on its own: breathing,
floating, swaying, spinning, flickering, flashing, tinting, and travelling to a new size or angle and staying there.

## Integrations

Integrates with others of mine plugins:

- [`J-Base`](../../_base/core/overview.md); to be honest this is just required for all my plugins.

## Details

A motion is DECLARED on the thing that should have it, and runs for exactly as long as that declaration exists. An
event page declares motions with a [comment tag](notetags/motion.md), and they stop when the page changes. Nothing
expires on its own and nothing fires once- if you want a motion to last three seconds, the
[plugin command](commands/apply-motion.md) that applies it says so.

Several motions compose on one character. A breathing, swaying, ghosting enemy is three declarations, and each of them
can be withdrawn without disturbing the other two.

Two characters declaring the same motion will not animate in lockstep; each one starts somewhere random within its own
cycle. A room of thirty breathing enemies reads as alive rather than choreographed. Add the `sync` keyword to a motion
when you actually want them in formation.