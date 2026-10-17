---
type: notetag
title: Proficiency Blocking
description: The tags blocking a battler from giving or gaining proficiency.
tags: [prof, tag, block, give, gain]
---

# Proficiency Blocking

## Description

Have you ever wanted a battler to NOT be able to gain proficiency? Well now you can! By applying the appropriate tags to
the various database locations, you too can block any battler from giving or gaining proficiency!

## NOTE ABOUT GIVING AND GAINING

It is important to recognize that there are two tags that both block the gain of proficiency in different ways. One tag
is designed to prevent the GIVING of proficiency, for most commonly being placed on enemies or states that enemies can
be placed in. The second tag is designed to prevent the GAINING of proficiency, most commonly being placed on actors or
states that actors can be placed in... though either tag can go on anything as long as you understand what you're doing.

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- Enemies
- States

## TAG FORMAT

`<proficiencyGivingBlock>`
`<proficiencyGainingBlock>`

## TAG EXAMPLES

`<proficiencyGivingBlock>`
The battler that has this tag will not GIVE proficiency to any opposing battlers that hit this battler with skills.

`<proficiencyGainingBlock>`
The battler that has this tag will not be able to GAIN proficiency from any battlers that this battler uses skills
against.