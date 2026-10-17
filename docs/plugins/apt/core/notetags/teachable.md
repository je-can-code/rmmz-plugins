---
type: notetag
title: Teachable
description: The tag describing how much AP a skill costs to learn from a given source.
tags: [ap, tag, learn, skill, source]
---

# Teachable

## Description

Ever want to have skills “teach themselves” while you play?
Well now you can!
By applying the appropriate tags across the various database locations, your actors will soak up AP from adventures and
unlock those skills.

## NOTE ABOUT MULTIPLE TAGS

If there are multiple teachable tags for the same skill id with different cost requirements, the first one completed
will complete them all.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States

## TAG FORMAT

`<aptitude:[SKILL_ID, REQUIRED_AP]>`
Where SKILL_ID is the database id of the skill to learn,
Where REQUIRED_AP is how much AP that source needs to teach it.

## TAG EXAMPLES

`<aptitude:[12,150]>`
This source enables learning skill of id 12 once the owner gains 150 AP.