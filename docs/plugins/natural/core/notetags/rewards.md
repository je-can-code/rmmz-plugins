---
type: notetag
title: Rewards
description: The tags adding formula-driven bonuses to the experience, gold and SDP points an enemy yields.
tags: [natural, tag, enemy, reward, formula]
---

# Rewards

## Description

While the [natural growth](natural-growth.md) parameters and such are shared between actors and enemies alike, and thus
a common pattern was useful, there are a couple of "parameters" that are unique to enemies: rewards. Specifically,
experience, gold, and SDPs. Since they aren't directly useful in combat, their tags are a bit different.

## NOTE ABOUT BASE VALUES

The base value that is in the database will be added to the calculated value for exp/gold/sdp, thus the static value in
the database can be thought of as a "base" value.

## TAG USAGE

- Enemies
- States

## TAG FORMAT

`<(REWARD)(PLUS):[FORMULA]>`
Where (REWARD) is one of exp, gold, or sdp.
Where (PLUS) is... plus. There is no "rate" for this value.
Where [FORMULA] is the formula to produce the amount.

### Rewards (plus only, no rate)

`<expPlus:[FORMULA]>`
`<goldPlus:[FORMULA]>`
`<sdpPlus:[FORMULA]>`

## TAG EXAMPLES

`<expPlus:[5 + a.lvl * 50]>`
When defeating this enemy, the experience gained will be increased by the enemy's level multiplied by 50, plus an extra
5.

`<goldPlus:[100 + a.luk + a.level ** 2]>`
When defeating this enemy, the gold gained will be increased by 100 plus the enemy's luck value plus the enemy's level
squared (to the second power).

`<sdpPlus:[100 * a.atk]>`
When defeating this enemy, the SDPs gained will be increased by 100 plus the enemy's attack value.