---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [popups-abs, overview]
---

# Overview

This plugin is an extension of [`J-Popups`](../../core/overview.md) for `J-ABS`.

Have you ever wanted floating popups for all of that glorious combat chaos your JABS game dishes out- damage numbers,
healing, experience, gold, loot, level-ups, and skill learns? Well now you can! This plugin wires up popup builders for
every major JABS combat and reward event.

## Details

Popup construction is handled through `JABS_PopupManager`, which provides dedicated builder methods for each popup type.
All popups are displayed on the relevant battler's or character's map sprite.