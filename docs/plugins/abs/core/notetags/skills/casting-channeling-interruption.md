---
type: notetag
title: Casting / Channeling Interruption
description: The tags configuring how casting and channeling can be interrupted, and who is immune.
tags: [abs, tag, skill, casting, channel, interrupt]
---

# Casting / Channeling Interruption

## Description

By default, ALL casting and channeling can be interrupted two ways: the caster chooses to move (self-interrupt), or an
enemy lands a hit with an `<interrupt:MAGNIFIER>` skill (external interrupt). Either way, the skill in-flight never
fires (or, for a channel, no further ticks/on-complete payoff occur), and a cooldown penalty is stamped onto the
interrupted skill's own slot: its full effective cooldown for a self-interrupt, or that cooldown scaled by MAGNIFIER
percent for an external interrupt.

## TAG USAGE

- Skills, on the casting/channeling skill itself, for `<cannotMoveToInterrupt>` and `<thisCannotBeInterrupted>`.
- Skills, on an attacking skill, for `<interrupt:MAGNIFIER>`.
- Actors, for `<cannotBeInterrupted>`.
- Classes, for `<cannotBeInterrupted>`.
- Weapons, for `<cannotBeInterrupted>`.
- Armor, for `<cannotBeInterrupted>`.
- States, for `<cannotBeInterrupted>`.

## TAG FORMAT

`<cannotMoveToInterrupt>`
Placed on the casting/channeling skill itself. Roots the caster in place entirely for the duration (today's original
cast-time behavior)- movement is simply not possible, so it can never trigger a self-interrupt.

`<interrupt:MAGNIFIER>`
Placed on an attacking skill. On landing a hit against a casting/channeling target, cancels that cast/channel and stamps
(target's effective cooldown for the interrupted skill) * (MAGNIFIER / 100) onto its slot. A skill with no `<interrupt>`
tag never disturbs a cast or channel it hits, no matter how hard it hits.

`<thisCannotBeInterrupted>`
Placed on the casting/channeling skill itself. That specific cast/channel cannot be externally interrupted, regardless
of the caster's own battler-wide immunity (or lack thereof). Does not affect self-interruption via movement- that is
`<cannotMoveToInterrupt>`'s job.

`<cannotBeInterrupted>`
A battler-wide immunity tag, read from ANY of a battler's own note sources (states, equips, class, actor)- not the skill
being cast/channeled. Suppresses external interrupts entirely for this battler, no matter what is casting/channeling.
Does not affect self-interruption via movement.

## TAG EXAMPLES

`<cannotMoveToInterrupt>`
The caster is rooted in place while casting/channeling this skill, so it can never trigger a self-interrupt.

`<interrupt:200>`
A skill has a cooldown of 100 frames, reduced by CDR/fastCooldown to an effective 75 frames. It gets hit by an
`<interrupt:200>` skill mid-cast: the slot goes on cooldown for 75 * (200 / 100) = 150 frames.

`<thisCannotBeInterrupted>`
That specific cast/channel cannot be externally interrupted.

`<cannotBeInterrupted>`
External interrupts are suppressed entirely for this battler, no matter what is casting/channeling.