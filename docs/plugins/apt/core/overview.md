---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [ap, overview]
---

# Overview

"Aptitude" is a system that grants the ability to gain points towards learning new skills. Traditionally, this is akin
to systems like "job points" or something from other games like Final Fantasy Tactics.

## How does it work?

### Earning points

Points are obtained by default by defeating enemies, and optionally can be gained by other means like plugin commands.
When points are gained, based on the currently-active sources (such as classes, equipped weapons and armor, applied
states, or even the actor itself), every source will gain the full amount. If there are no currently-active sources,
then the AP gain does nothing. When enough points are obtained based on the teachable, the skill will be learned.

### Applying teachables

Teachables are a pair of "points required to learn a skill" and "skill to be learned" data points. These live as tags
in the notes of actors/classes/weapons/armor/states. When gaining points, they will automatically be distributed to all
currently active teachables the actor has. If a player loses an active teachable (like by changing weapons), the points
obtained will persist in case the actor regains that teachable again.