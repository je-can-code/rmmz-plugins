---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [regions-skills, overview]
---

# Overview

This plugin enables the ability to attempt to auto-execute skills based on the region that a given character is standing
upon while on the map.

## Details

At set intervals while any character on the map stands upon a given regionId, the plugin will attempt to repeatedly
execute a given skill or skills against that character's JABS battler (player, follower, or any map character that has
a JABS battler attached).

Executions use [`J-ABS`](../../../abs/core/overview.md) forced map actions. A temporary "dummy" enemy battler is created
from an enemy id you specify in [the tag](notetags/region-skill.md); that dummy's stats power the skill. The skill is
resolved at the standing character's map coordinates.

This plugin probably could've been developed to work without JABS to some extent, but this was designed FOR JABS, so it
is a required dependency. [`J-RegionEffects`](../../core/overview.md) is also required (map note parsing shares its
refresh gate).

## Plugin parameters

- [Execute Skill Delay](parameters/execution-delay.md): The number of frames between skill execution attempts. The
  lower this number, the more frequently skills will fire while standing on a tile with a region that executes skills.
  Defaults to 60, aka roughly once per second at 60 FPS.