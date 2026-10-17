---
type: notetag
title: Respect Terrain
description: The tag cancelling a gap close when the caster cannot legally reach the destination tile.
tags: [abs-tools, tag, skill, gap-close, terrain]
---

# Respect Terrain

## Description

Put this on the gap-closing skill to cancel the gap close entirely if the caster cannot legally reach the computed
destination tile (blocked by impassible terrain). Without this tag, gap close bypasses terrain checks the way all
gap-close modes normally do.

## TAG USAGE

- Skills, on the gap-closing skill.

## TAG FORMAT

`<respectTerrain>`

## TAG EXAMPLES

`<respectTerrain>`
This skill's gap close is cancelled entirely if the caster cannot legally reach the computed destination tile.