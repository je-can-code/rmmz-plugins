---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [resources, overview]
---

# Overview

This plugin extends the skill cost and gain system to support HP, MP, and TP costs and gains defined entirely through
notetags.

## Integrations

Integrates with others of mine plugins:

- [`J-ABS`](../../abs/core/overview.md); JABS will use these costs/gains when executing skills.
- [`J-CMS-Skill`](../../cms/ext/skill/overview.md); the skill detail window will display HP costs.
- [`J-HUD-InputFrame`](../../hud/ext/input/overview.md); the input frame will display HP costs on skill slots.

## Details

By default, RMMZ supports MP and TP costs on skills via the editor. This plugin adds HP cost and gain support, as well
as tag-based flat, percentage, and formula costs for MP and TP as well.

HP cost reduction is registered in the parameter catalog as `hcr`.