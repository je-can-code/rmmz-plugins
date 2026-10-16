---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [abs-charge, overview]
---

# Overview

This plugin enables the ability to charge certain skills by holding down the input associated with the skill slot.

This plugin requires `J-ABS`. This plugin has minimal plugin parameter configuration.

## Details

Actors can now "charge up" their skills to configurable degrees based on the tags applied to the skills in question.
This concept is basically a JABS version of what Link can do when you charge up his sword to swing it all around,
instead of just swinging it by mashing the button.

The functionality is defined by "[charging tiers](notetags/charging-tiers.md)", which include data points such as:

- how long to charge this tier.
- what skill will be executed if released when this tier is charged.
- the tier number of this tier.

A skill can have multiple tiers of charging to represent the ability to have different releasable abilities depending
on how long you charge.

## Plugin parameters

The plugin parameters provide some convenient defaults for the charging functionality.

- [`DefaultChargingAnimationId`](parameters/default-charging-anim-id.md): The animation that will play if none is
  specified while the player is charging up a skill.
- [`DefaultTierCompleteAnimationId`](parameters/default-tier-complete-anim-id.md): The animation that will play upon
  completing a any non-final tier of charging.
- [`DefaultFullyChargedAnimationId`](parameters/default-fully-charged-anim-id.md): The animation that will play upon
  completing the final tier of charging.
- [`UseTierCompleteSE`](parameters/use-default-charging-se.md): If you'd prefer to go purely by sound, there are sounds
  configured to play instead of an animation.
- [`AllowTierCompleteSEandAnimation`](parameters/allow-tier-complete-s-eand-anim.md): Whether or not to allow both the
  animation and the sounds to play. This is not recommended.

## Limitations

While the reference above makes it sound like ANY skill can be charged, that is only partially true. ANY skill can be
charged, as long as it meets a few criteria.

- It has to be one of the chargable skill slots.

  Skill slots you CAN charge:
  - mainhand slot
  - offhand slot
  - combat skill 1 slot
  - combat skill 2 slot
  - combat skill 3 slot
  - combat skill 4 slot

  Skill slots you CANNOT charge:
  - dodge slot
  - item/tool slot
- It has to be a valid chargable skill.

  Skill situations that are not valid chargable skills:
  - tools cannot be charged, even if they have charge tier data.
  - guard skills cannot be charged, even if they have charge tier data.
- The battler must know the skill somehow.

## More about charge tiers

In some cases, you may only want the player's charged ablity to release a skill if it is charged multiple tiers. While
you could just make a really long charge tier, it may make more sense to charge up three tiers and only the last tier
will release a skill when fully charged. In this case, you can only place the last tag on a skill (like a tier7 tag)
and this engine will auto-generate the prior tiers as 1/2 second charges per tier up until the tier you defined is
reached. None of the auto-generated tiers will have releasable skills.

If you manually created a gap, for example, by defining only charging tiers 1 and 6, the auto-generated ones (2/3/4/5)
would not have any releasable skills, but if the tier1 you defined DOES have a releasable skill, releasing anything
after the first but before the 6th tier would end up releasing the 1st tier charge skill as a result.