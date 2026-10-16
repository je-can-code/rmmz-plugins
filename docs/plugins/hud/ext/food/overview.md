---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [hud-food, overview]
version: "1.1.0"
---

# Overview

This plugin adds a food chain HUD frame to the screen. It reads the leader's current food chain plan from `JABS_Engine`
and renders a vertical strip with a state icon, a segmented duration bar colored per phase, and a label list
highlighting the currently active phase.

This plugin does NOT parse food notetags or register the R2 button. Those responsibilities belong to `J-ABS-Food`.