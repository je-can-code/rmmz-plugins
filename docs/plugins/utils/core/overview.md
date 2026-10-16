---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [utils, overview]
version: "1.1.4"
---

# Overview

This plugin provides a small set of system utility functions that may or may not be helpful to all users.

## New functions

- F6 toggles all sound on/off.
- autostart newgame on testplay (when [plugin parameter](parameters/autostart-newgame.md) enabled).
- pull up devtools window in background upon testplay (always).
- `$gameParty.removeInvalidItemsFromParty()` strips junk bag rows and equipment (missing DB rows, blank names, or names
  starting with `"==="`).

## Note about notetags

This plugin has no notetags of its own- everything here is a system-wide utility function or plugin-parameter/testplay
convenience.