---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [omni-monster, overview]
version: "3.0.0"
---

# Overview

This plugin extends the [Omnipedia](../../core/overview.md) by adding a new entry: The Monsterpedia.

Due to rendering a large amount of data, there are a number of other plugins required to use this plugin:

- [`J-Base`](../../../_base/core/overview.md): always required for my plugins.
- [`J-ABS`](../../../abs/core/overview.md): enables the tracking of most data points.
- [`J-DropsControl`](../../../drops/core/overview.md): renders loot drop data and tracking.
- [`J-Elementalistics`](../../../elem/core/overview.md): renders elemental data and tracking.
- [`J-SDP`](../../../sdp/core/overview.md): renders SDP points earned and panel drop rate.

## Pages

The Monsterpedia is split into pages, one for each kind of entry, authored in `data/config.omni.json` with the data
editor's Omnipedia board. The file is required. An enemy names the page it belongs on with
[Monster Type](notetags/monster-type.md), and the [Monsterpedia scene](scenes/monsterpedia.md) describes what each page
shows.