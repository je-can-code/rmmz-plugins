---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [jafting, overview]
version: "2.2.1"
---

# Overview

This plugin is the core menu system that other JAFTING menus plug into. It was designed as an extensible wrapper scene
for all JAFTING modes.

## Note about this plugin

This is a base plugin that offers no actual crafting functionality itself. It offers instead a root
"[JAFTING](scenes/jafting.md)" menu that the other extensions will connect to for singular JAFTING access—including
[Salvage](scenes/jafting-salvage.md) on that hub (same scene as [`call-salvage`](commands/call-salvage.md)). Chances
are, if you are using this plugin, you probably also want to grab the
"[Creation](../ext/create/overview.md)" extension and/or the "[Refinement](../ext/refine/overview.md)" extension and
place them below this one.

## Organization

Have you ever wanted a menu that has a single purpose, such as granting access to all the other crafting menus built to
work with JAFTING? Well now you can! Just drop this plugin above your other installed JAFTING extension plugins, and
voila! It works.

### Note about this plugin

It isn't really necessary. It is literally just a wrapper scene and menu that unifies access to all JAFTING scenes. You
could also just directly call the other JAFTING scenes directly if you preferred.

## Note about notetags

This plugin has no notetags of its own- salvage/refine material typing is configured entirely via plugin parameters
([armor](parameters/material-armor-type-id.md)/[weapon](parameters/material-weapon-type-id.md) type ids), and the
JAFTING extensions that plug into this hub
([Creation](../ext/create/overview.md), [Refinement](../ext/refine/overview.md)) own their own respective tags.