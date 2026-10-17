---
type: notetag
title: Steal Rates
description: The lifesteal, manasteal and techsteal tags recovering a percentage of the HP damage a battler deals.
tags: [resources-abs, tag, lifesteal, manasteal, techsteal, lst, mst, tst]
---

# Steal Rates

## Description

Have you ever wanted a weapon that siphons life with every strike, or a vampiric state that converts damage dealt into
mana? Well now you can! By applying the appropriate tag(s) across the database, a battler can recover HP, MP, or TP
equal to a percentage of the HP damage they deal, on every hit.

## NOTE ABOUT SOURCES

These are battler-wide percent-point stats, not per-skill tags- they're summed from every note source on the battler
(actor, class, weapons, armors, states) and combined with any SDP panel bonus for the same parameter key.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- Enemies
- States

## TAG FORMAT

`<lst:VALUE>`
Lifesteal- VALUE percent of HP damage dealt is recovered as HP.

`<mst:VALUE>`
Manasteal- VALUE percent of HP damage dealt is recovered as MP.

`<tst:VALUE>`
Techsteal- VALUE percent of HP damage dealt is recovered as TP.

## TAG EXAMPLES

`<lst:10>`
This battler recovers 10% of all HP damage they deal as HP.

`<mst:5>`
`<tst:5>`
This battler recovers 5% of all HP damage they deal as both MP and TP simultaneously (the three steal rates are
independent and can stack).