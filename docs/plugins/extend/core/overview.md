---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [extend, overview]
---

# Overview

This plugin extends the functionality of skills. It features additional functionality that allow you to leverage new
strategies in skill learning and game development.

## Details

The new functionalities available are as follows:

- [Skills extending skills](notetags/skill-extension.md).
- [On-hit self-state application and removal](notetags/state-reaction-effects.md).
- [On-cast self-state application and removal](notetags/state-reaction-effects.md).
- [On-hit target-state stack stripping and full removal](notetags/state-reaction-effects.md).
- [On-cast target-state stack stripping and full removal](notetags/state-reaction-effects.md).

## What does "act as an extension" mean?

This section of information is so important that it gets its own headline!

Lets pretend that in our fictional example, skill id 40 maps to "Fireball". We want to extend our "Fireball" skill in
some way by using this skill's data points. What might that look like? It can manifest in a variety of ways, but with
this plugin, we use extension skills as OVERRIDES or AUGMENTS to the base skill. Thusly, if this skill were some kind of
upgrade, you could fill in the damage formula to maybe have higher multipliers, and add some extra repeats (offset of
+1). The changes in the skill will overlay the base skill's parameters and apply BEFORE the skill's execution. You can
see below for a comprehensive list of what happens to the base skill based on an extension skill.

### Note about removing tags

Effects are only added or updated. Tags cannot be removed by this plugin with the single exception of the extend tag.

### Comprehensive breakdown of how things are overridden

If a damage type is checked:

- yes/no critical option is replaced.
- base element id is replaced.
- allowed upgrade of "hp damage" >> "hp drain" (but not cross or reverse)
- allowed upgrade of "mp damage" >> "mp drain" (but not cross or reverse)
- damage variance is replaced.
- the formula itself is replaced if it is not completely empty.

Other sections include:

- the "effects" section of the skill just adds right into the base skill.
- the two "meta" objects are merged with the extension skill's priority.
- the extension skill's "note" object is appended onto the base skill's.
- the repeats are added onto the base (offset of +1).
- the speed is added onto the base.
- the success is added onto the base (only if not same or equal to 100).
- the scope is replaced.
- the mp cost is replaced.
- the tp cost is replaced.
- the tp gain is added onto the base.
- if the hit type section is not "certain hit", then it replaces.
- both message lines are replaced.

Base data things of note:

- the "occasion" is not changeable.
- though "note" objects are appended, the tag for extension is removed to prevent recursive behaviors in skill
  extension. This removal is only for this execution of the skill for overlay purposes only.
- the editor's speed cap of +/-2000 is not respected!
- the editor's success cap of 0-100 is not respected!

When it comes to the note section:

- all tags by default will be overridden where the key matches.
- you can avoid override behavior by configuring duplicate keys.

### If using this plugin with JABS

#### Note about adding move-related tags

The effects of adding the `moveType` tag onto a skill that didn't previously have it are completely untested, use at
your own risk!

#### Note about adding guard-related tags

The effects of adding the `counterGuard`/`counterParry` tags onto a skill that didn't previously have it are untested,
though shouldn't cause any problems if they are added onto a skill with "guard & parry".

#### Note about combo-related tags

The effects of adding the `combo`/`actionId`/`direct` tags onto any skills is something to be careful about, as they
very significantly change how the manager interacts with the actions. Replacing any of those values though should be
totally fine if they already existed on the base skill.

### Starting an extension

With that in mind, it is strongly recommended that you copy-paste the base skill into the extension skill slot in your
RMMZ editor database skill tab to start your extension (or another skill extension of the same skill perhaps)!