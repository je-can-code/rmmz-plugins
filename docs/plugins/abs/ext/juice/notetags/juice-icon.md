---
type: notetag
title: Juice Icon
description: The tag forcing which IconSet icon a skill's weapon swing overlay shows.
tags: [abs-juice, tag, skill, icon, overlay]
---

# Juice Icon

## Description

Forces weapon swing overlay icon index N on the IconSet sheet. When absent, the icon is inferred from the actor's
equipped gear: dual-wield offhand uses weapon slot 2; a single offhand resolves the orb/shield armor icon by matching
skill ids on armor rows or the equip slot when it is armor.

## TAG USAGE

- Skills

## TAG FORMAT

`<jabsJuiceIcon:N>`
Where N is the icon index on the IconSet sheet.

## TAG EXAMPLES

`<jabsJuiceIcon:97>`
This skill's weapon swing overlay shows icon index 97 on the IconSet sheet.