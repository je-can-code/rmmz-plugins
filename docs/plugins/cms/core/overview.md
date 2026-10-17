---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [cms, overview]
version: "1.2.1"
---

# Overview

This is a redesign of the main menu.

As the "core" of the CMS family, this plugin also carries the shared parameter-catalog rendering (grouping, chrome,
layout) that other CMS scenes build on, so it must be enabled and ordered before them.

## Command help text

The main menu describes the highlighted command in a help window along the top. Each of the engine's own commands has
its description [configured here](parameters/parent-config.md), because those commands belong to the engine rather than
to any plugin.

Commands contributed by other plugins carry their own descriptions, supplied where that plugin builds its command. This
plugin neither knows nor needs to know what those commands are.

## Note about notetags

This plugin has no notetags of its own- it is purely a scene/window redesign of the native main menu.