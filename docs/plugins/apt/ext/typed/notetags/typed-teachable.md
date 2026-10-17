---
type: notetag
title: Typed Teachable
description: The tag describing how much typed AP a skill costs to learn from a given source.
tags: [apt-typed, tag, learn, skill, source, typed]
---

# Typed Teachable

## Description

Have you ever wanted to enable the ability to associate an element or weapon type or skill type with a particular
teachable so the player would need to gain a particular type of AP to learn it? Well now you can! By applying the
appropriate tag to across the various database locations, you too can do cool things that only others with this plugin
can do.

## NOTE ABOUT IMPLICIT vs EXPLICIT GAINED AP

The typed teachables do not care whether the typed AP is explicitly gained or implicitly gained. If the teachable
requires 25 fire AP and the player gains 25 fire AP from either approach, it will teach them the skill.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States

## TAG FORMAT

`<aptitudeTyped:[SKILL_ID, REQUIRED_AP, DOMAIN, ID_OR_NAME]>`
Where SKILL_ID is the database id of the skill to learn,
Where REQUIRED_AP is how much AP that source needs to teach it.
Where DOMAIN is the family of AP typing to consider for ID_OR_NAME.
Where ID_OR_NAME is the id or name of the element/weapon/skilltype.

## TAG EXAMPLES

`<aptitudeTyped:[12, 150, element, fire]>`
This source enables learning skill of id 12 once the owner gains 150 points of "fire" element AP.

`<aptitudeTyped:[20, 800, weapontype, 5]>`
This source enables learning skill of id 20 once the owner gains 800 points of weapon type with id 5 worth of AP.

`<aptitudeTyped:[74, 1250, skilltype, sorcery]>`
This source enables learning skill of id 74 once the owner gains 1250 points of skill type with name "sorcery" worth of
AP.