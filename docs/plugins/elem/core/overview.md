---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [elem, overview]
---

# Overview

This plugin enables the ability to modify skills with note tags to to further control a skill's elemental properties in
the context of battle.

By overwriting the `.calcElementRate()` function, we have added new functionality to elemental processing:

- Skills can now possess more than one element.
- Elements can now be absorbed.
- Elements can now be boosted.
- Actors/Enemies can now whitelist effective elements.

## Combining elements

Combining multiple elements together is done multiplicatively for all the various operations below.

- [Additional Elements](notetags/additional-elements.md)
- [Absorb Elements](notetags/absorb-elements.md)
- [Boost Elements](notetags/boost-elements.md)
- [Strict Elements](notetags/strict-elements.md)
- [Pierce Elements](notetags/pierce-elements.md)