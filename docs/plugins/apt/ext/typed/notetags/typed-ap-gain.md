---
type: notetag
title: Typed AP Gain
description: The tag defining how many points of a particular type of AP an enemy yields upon defeat.
tags: [apt-typed, tag, enemy, source, typed]
---

# Typed AP Gain

## Description

Have you ever wanted to gain AP of a particular type from enemies? Well now you can! By applying the appropriate tags to
enemies in the database, you too can gain AP of a particular type from enemies.

## TAG USAGE

- Enemies only.

## TAG FORMAT

`<apTyped:[AMOUNT, DOMAIN, ID_OR_NAME]>`
Where AMOUNT is the amount of AP to be gained.
Where DOMAIN is the family of AP typing to consider for ID_OR_NAME.
Where ID_OR_NAME is the id or name of the element/weapon/skilltype.

## TAG EXAMPLES

`<apTyped:[6, element, fire]>`
This enemy will yield 6 fire-element AP upon defeat.

`<apTyped:[3, weapontype, sword]>`
This enemy will yield 3 sword-weapontype AP upon defeat.