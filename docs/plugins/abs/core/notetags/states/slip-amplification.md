---
type: notetag
title: Slip Amplification
description: The tags amplifying each tick of the damage and healing over time a battler applies.
tags: [abs, tag, state, slip, regen, amplify]
---

# Slip Amplification

## Description

Independent of tick speed, the VAL of a single tick can be amplified directly. Amplification is always sourced from the
battler who APPLIED the slip effect (the source), not the battler suffering/receiving it -- a Ring of Melting worn by
the poisoner makes their poison hit harder, it does nothing for the poisoner's own poison resistance. Healing-over-time
additionally still applies the afflicted battler's own REC trait first, exactly as before; these tags layer on top of
that.

## TAG USAGE

- Actors, for the battler-wide rates.
- Classes, for the battler-wide rates.
- Weapons, for the battler-wide rates.
- Armor, for the battler-wide rates.
- States, for the battler-wide rates.
- Skills, for the skill-scoped rates.

## TAG FORMAT

`<dotAmpRate:VAL>`
`<hotAmpRate:VAL>`
Battler-wide percent amplification against every DoT/HoT this battler applies, summed from every note source on the
source (actor, class, weapons, armors, states). VAL is a percent: 100 = double tick damage/healing, -50 = half.

`<thisDotAmpRate:VAL>`
`<thisHotAmpRate:VAL>`
Skill-scoped percent amplification, read from the skill that was executing when the state was applied (not the bearer's
other skills). Adds on top of the battler-wide rate above; a state applied with no skill in scope
(ambient/self-inflicted effects) never consults this.

## TAG EXAMPLES

`<dotAmpRate:100>`
(Ring of Melting) Doubles the tick damage of every DoT this battler's wearer applies to anyone.

`<thisDotAmpRate:50>`
(on a specific poison skill) Adds another 50% on top of that, but only for poison applied by this exact skill.