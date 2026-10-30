---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [sdp, overview]
version: "4.8.1"
---

# Overview

This plugin is a form of "stat distribution"- an alternative to the standard of leveling up to raise an actor's stats.

## Integrations

Integrates with others of mine plugins:

- `J-ABS`; enemies will individually drop their points and panels.
- `J-ABS-Speed`; enables usage of Movespeed Boost as a parameter on panels.
- `J-CriticalFactors`; enables usage of CDM/CDR as parameters on panels.
- `J-DropsControl`; enables usage of item-as-panel drops.
- `J-Natural`; enables SDP reward modifications.
- `J-Proficiency`; enables usage of Proficiency+ as a parameter on panels.

## Details

This system allows the player's party to unlock "stat distribution panels" (aka SDPs), by means of plugin command.

The scene to manage unlocked SDPs is accessible via the menu, the JABS quick menu, or via plugin command.

Each SDP has the following:

- 1+ parameters (of the 27 available in RMMZ) with flat/percent growth.
- A fixed rank max.
- Rank-up costs driven by **rarity defaults** (plugin parameters) plus optional **per-panel offsets** in
  `config.sdp.json` (`baseCost`, `flatGrowthCost`, `multGrowthCost` — usually **0 / 0 / 1.0**).
- Customizable name/icon/description1/description2.
- Rank up rewards for any/every/max rank, which can be most anything.

In order to rank up these SDPs, you'll need to use SDP points. These can be acquired by using the tags (see
[SDP Points](notetags/sdp-points.md)), or by using plugin commands.

### Notes

- SDP points gained from enemies are earned for all members of the party.
- SDP points are stored and spent on a per-actor basis.
- SDP points for an actor cannot be reduced below 0.
- Stat Distribution Panels are unlocked for all members of the party.
- Stat Distribution Panel rewards can unlock other panels.

### Important note

The SDP data is derived from an external file rather than the plugin's parameters. This file lives in the `/data`
directory of your project, and is called `config.sdp.json`. You can absolutely generate/modify this file by hand, but
you'll probably want to visit my github and swipe the rmmz-data-editor project I've built that provides a convenient GUI
for generating and modifying SDPs in just about every way you could need.

If this configuration file is missing, the game will not run.

Additionally, due to the way RMMZ base code is designed, by loading external files for configuration like this, a
project made with this plugin will simply crash when attempting to load in a web context with an error akin to:

```
ReferenceError require is not defined
```

This error is a result of attempting to leverage nodejs's `require` loader to load the `fs` (file system) library to
then load the plugin's config file. Normally a web deployed game will alternatively use `forage` instead to handle
things that need to be read or saved, but because the config file is just that- a file sitting in the `/data` directory
rather than loaded into `forage` storage- it becomes unaccessible.

### Note about panel names

Generally speaking, you can name your chosen panels (described in the configuration file mentioned above) whatever you
want- with a couple of exceptions for organizational purposes within the JMZ Data Editor.

If a panel starts with any of the following characters:

- `__` (double underscore)
- `--` (double hyphen/dash)
- `==` (double equals)

Then the panel will not be included in the list that is parsed from the configuration file upon starting the game.

## Families and subgroups

Have you ever wanted to organize a large panel list into browsable categories, or build a chain of panels where
investing deep into one grants a payoff that replaces the previous tier's? Well now you can! Two new top-level blocks in
`config.sdp.json`- `families` and `subgroups`- let you group panels for menu browsing and for mastery progression.

A FAMILY is a top-level menu category. In the SDP scene, the player cycles between families with L2/R2, filtering the
panel list down to just that family's panels (or "All", or "Unsorted" for panels with no subgroup/family enrollment).
Each family row owns a list of subgroup keys.

A SUBGROUP is a tiered chain of panels that live inside a family. Panels enroll in a subgroup individually (see their
own `mastery` block below) by referencing the subgroup's key and declaring their tier within it. Subgroups themselves
don't define the panels- they're just the authoring/display metadata (name, key, icon, description) that panels point
back to.

### Config schema (families)

```json
{
  "key": "elemental",
  "name": "Elemental Affinities",
  "iconIndex": 64,
  "description": "Mastery over the elements.",
  "subgroupKeys": ["fire-mastery", "ice-mastery"]
}
```

Where `key` uniquely identifies this family and is referenced by nothing else directly- families own subgroups, not the
other way around.

Where `subgroupKeys` lists every subgroup key that belongs to this family.

### Config schema (subgroups)

```json
{
  "key": "fire-mastery",
  "name": "Fire Mastery",
  "iconIndex": 65,
  "description": "Deepen your command of flame."
}
```

Where `key` is referenced by panels via their own `mastery.subgroupKey` (see MASTERY below) and by a family's
`subgroupKeys` list above.

NOTE: A subgroup with no owning family (not listed in any family's `subgroupKeys`) still functions for mastery purposes,
but its panels fall back to the "Unsorted" filter bucket in the family strip instead of a named family.

## Mastery

Have you ever wanted maxing out a panel to grant a passive skill- and have a deeper panel in the same progression line
automatically replace that skill with a better one? Well now you can! Any panel can opt into the mastery program by
adding a `mastery` block to its config row.

### Note about two independent flags

Subgroup ENROLLMENT (`subgroupKey` + `subgroupTier`) and mastery SKILL GRANTING (`masterySkillId`) are independent- a
panel can be enrolled in a subgroup (participating in family filtering and occupying a tier slot) without granting any
skill at all (`masterySkillId` left at 0). This is useful for "filler" tiers that exist purely to occupy a slot in the
progression without a payoff of their own.

### Config schema (panel `mastery` block)

```
"mastery": {
  "subgroupKey": "fire-mastery",
  "subgroupTier": 1,
  "masterySkillId": 501
}
```

Where `subgroupKey` enrolls this panel in a subgroup (must match a `subgroups[].key` entry above). Omit or leave empty
to opt this panel out of the subgroup hierarchy entirely.

Where `subgroupTier` is this panel's rank within the subgroup's progression- higher tiers win when reconciling which
mastery skill is active. Boot validation rejects two panels sharing the same tier within one subgroup. Required (> 0)
whenever `subgroupKey` is set.

Where `masterySkillId` is the skill id granted to the actor when this panel reaches max rank. Leave at 0 (or omit) for
an enrolled panel that should not grant a mastery skill of its own.

### How reconciliation works

The instant a panel reaches max rank, every panel enrolled in that same subgroup is re-evaluated: the actor's
highest-tier MAXED panel in the subgroup wins, its `masterySkillId` is learned if not already known, and every other
tier's `masterySkillId` in that subgroup is forgotten if currently known. Only one mastery skill per subgroup is ever
active on a given actor at a time- deepening your investment upgrades the payoff instead of stacking it.

NOTE: Ranking a panel back down (if your project allows that) does not un-grant a mastery skill by itself-
reconciliation only runs when a panel is freshly maxed. The mastery summary for whichever panel is currently hovered in
the SDP scene is shown read-only alongside the normal reward list.