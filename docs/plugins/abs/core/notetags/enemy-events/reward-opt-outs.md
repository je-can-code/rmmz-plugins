---
type: notetag
title: Reward Opt-Outs
description: The tags letting an enemy refuse every reward point it would pay on defeat, or just its experience or gold.
tags: [abs, tag, enemy, rewards]
---

# Reward Opt-Outs

## Description

A defeated enemy pays out experience and gold, plus whatever an extension pays alongside them, such as SDP points
or AP. These tags let an enemy refuse those rewards, either all at once or one at a time, without touching anything
else on its row. Drops are loot rather than points, so an enemy refusing every reward still drops what it carries,
which is exactly what a harvest node or a crate wants.

## NOTE ABOUT THE OTHER REWARDS

`<noRewardPoints>` refuses every reward at once, SDP points from J-SDP and AP from J-Aptitude included. To refuse just
one of those, use J-SDP's [No SDP](../../../../sdp/core/notetags/no-sdp.md) or J-Aptitude's
[No AP](../../../../apt/core/notetags/no-ap.md) instead.

With J-Level-Flat, experience is paid by level difference rather than read off the enemy's row, and `<no:exp>` stops
that flat experience too.

## TAG USAGE

- Enemies, in the database.

## TAG FORMAT

`<noRewardPoints>`
Refuses every reward point: experience, gold, SDP points and AP.

`<no:exp>`
Refuses only experience.

`<no:gold>`
Refuses only gold.

## TAG EXAMPLES

`<noRewardPoints>`
Breaking this crate pays no experience, gold, SDP points or AP, but it still drops its loot.

`<no:exp>`
Defeating this enemy pays its gold, SDP points and AP as usual, but no experience.