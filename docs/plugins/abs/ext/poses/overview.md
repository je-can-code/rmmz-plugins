---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [abs-poses, overview]
---

# Overview

This plugin enables "action poses", or "character sprite animations" within the JABS engine.

Integrates with others of mine plugins:

- `J-Base`; to be honest this is just required for all my plugins.
- [`J-ABS`](../../core/overview.md); allies and enemies will perform animations for various actions.

## Details

A new functionality for "action poses" or "character sprite animations" is now available by adding a variety of tags
across the database. Mind you, this will not animate your character sprites for you, under the hood it will just swap
out the regular character sprite defined in the database with another for a given duration, and cycle through the
stepping animation.