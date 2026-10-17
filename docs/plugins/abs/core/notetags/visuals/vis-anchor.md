---
type: notetag
title: Vis Anchor
description: The tag overriding the anchor point of a skill's action sprite.
tags: [abs, tag, skill, visual, sprite, anchor]
---

# Vis Anchor

## Description

Overrides the anchor point of the action sprite. Anchor values are between 0.0 and 1.0, where [0.5, 0.5] is the center.

## TAG USAGE

- Skills

## TAG FORMAT

`<visAnchor:[AX,AY]>`
Where AX is the horizontal anchor (0.0 = left edge, 1.0 = right).
Where AY is the vertical anchor (0.0 = top, 1.0 = bottom).

## TAG EXAMPLES

`<visAnchor:[0.5,1]>`
Anchors the action sprite at its horizontal center and its bottom.