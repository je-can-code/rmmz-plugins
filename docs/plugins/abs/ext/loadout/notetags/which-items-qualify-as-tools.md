---
type: notetag
title: Which Items Qualify as Tools
description: The tag marking an item as a tool for the tool slot rather than a consumable for the usable-item slot.
tags: [abs-loadout, tag, item, slot, tool]
---

# Which Items Qualify as Tools

## Description

Place this tag on the item itself to mark it as belonging in the
[tool slot](../../../core/notetags/using-skills/tool-slot.md) (hookshots, bombs, and other equippable-from-the-menu
items). Without this tag, an item is instead treated as a consumable and shows up in the usable-item slot's list instead
of the tool slot's list.

## NOTE ABOUT ITEM TYPE AND OCCASION

The tag alone is not the whole story -- the item's Item Type must also be "Regular Item" and Occasion must be "Always"
for it to actually populate either the tool or usable-item menu. `<jabsTool>` only decides which of those two menus a
qualifying item lands in.

## TAG USAGE

- Items

## TAG FORMAT

`<jabsTool>`

## TAG EXAMPLES

`<jabsTool>`
This item belongs in the tool slot instead of the usable-item slot.