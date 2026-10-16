---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [regions-states, overview]
---

# Overview

This plugin enables the ability to attempt to autoapply states based on the region that a given character is standing
upon while on the map.

## Details

At set intervals while any charater on the map stands upon a given regionId, the plugin will attempt to repeatedly apply
a given state or states to the character's battler.

This plugin probably could've been developed to work without JABS to some extent, but this was designed FOR JABS, so it
is a required dependency.

## Plugin parameters

- [Apply State Delay](parameters/application-delay.md): The number of frames between states being applied. The lower
  this number, the more frequently states will be applied while standing on a tile with a region that applies states.
  Defaults to 15, aka roughly 4 times per second.