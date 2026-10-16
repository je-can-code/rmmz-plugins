---
type: notetag
title: Combos
description: The tags configuring what skill can be followed up after using a skill, and when it becomes available.
tags: [abs, tag, skill, combo, ai]
---

# Combos

## Description

### Combo Action

Defines what skill can be followed up after using this skill, how long until that follow-up becomes available, and
optionally how long the window stays open before the combo is auto-cleared.

The combo-starter's cooldown must be longer than the LINK_TIME, or the combo will never be reachable. Each executed
combo action extends the remaining cooldown by LINK_TIME, keeping the chain going.

EXPIRE_FRAMES counts from the moment the opener fires — not from when the combo becomes pressable. For a tight follow-up
window on a slow skill, set EXPIRE_FRAMES close to LINK_TIME so the player must press quickly once the combo opens.

### Combo Starter

AI-controlled battlers ignore skills with combo tags by default.
Adding this tag tells the AI that this skill is safe to initiate.

### Freecombo

Makes the next combo action available immediately on skill execution, without requiring a hit.

## NOTE ABOUT CONNECTING WITH A TARGET

Follow-up combos require the skill to connect with a target.
If you want the combo to become available regardless of whether the skill hit, use `<freeCombo>` instead.

## TAG USAGE

- Skills

## TAG FORMAT

`<combo:[COMBO_SKILL_ID]>`
`<combo:[COMBO_SKILL_ID, LINK_TIME]>`
`<combo:[COMBO_SKILL_ID, LINK_TIME, EXPIRE_FRAMES]>`
Where COMBO_SKILL_ID is the skill ID that will be combo'd into.
Where LINK_TIME is frames until the combo becomes pressable (default 0).
Where EXPIRE_FRAMES is the total frames from skill fire until the combo auto-clears if unused (default 0 = no expiry;
window stays open until the slot's base cooldown resets).

`<comboStarter>`

`<freeCombo>`

## TAG EXAMPLES

`<combo:[2,10]>`
Using this skill makes skill ID 2 available after 10 frames (no expiry).

`<combo:[5,8,60]>`
Makes skill ID 5 available after 8 frames; auto-clears after 60 frames total if the player has not pressed it.

`<comboStarter>`
Tells the AI that this skill is safe to initiate.

`<freeCombo>`
Makes the next combo action available immediately on skill execution, without requiring a hit.