---
type: notetag
title: Natural Growth
description: The tags that buff a parameter while applied, or grow it permanently for every level gained.
tags: [natural, tag, parameter, buff, growth, formula]
---

# Natural Growth

## Description

Have you ever wanted an actor to gain a particular stat, but couldn't quite make it as customizable as you wanted it to
be? Well now you can! By adding the correct tags to your notes across the various entries in the database, you too can
make your actors gain more specific stats!

By constructing tags using the format described below, you are given access to a "Formula" box that behaves similar to
a "Formula" box that defines the damage of a skill. None of the tags are case sensitive, but the order is specific. If
you find yourself having trouble building the tags, you can peek at the source code of `J-NaturalGrowth` and search for
`J.NATURAL.RegExp =` to find the master list for the engine's own parameters; every other plugin keeps its parameters'
tags in its own list. Do note that the hard brackets of `[]` are required to wrap the formula in the note tag.

## NOTE ABOUT THE PERMANENCE OF BUFF

The "Buffs" effect, as indicated in the [overview](../overview.md#details), is applied temporarily at whatever the
formula would calculate out to when the parameter is requested. This allows the application of these "buffs" to live on
dynamic objects, such as equipment or states, giving greater control over what stats are gained and how much. However,
it is important to note that if you put a "buff" tag on a non-temporary object, such as the actor itself, it would be
functionally a permanent "buff".

## NOTE ABOUT THE PERMANENCE OF GROWTH

The "Growths" effect, as indicated in the [overview](../overview.md#details), is applied permanently for every level
gained. However, it is important to note that due to the nature of the growth being permanent, it WILL NOT be lost if
the level is reduced in some way, and WILL be gained AGAIN if the level increases once more.

## NOTE ABOUT STATS

The "stats" word choice was deliberate vague because this can apply to any of the 8 base parameters, 10 sp-parameters,
or 10 ex-parameters, max tp, healing rate, or any parameter another plugin has bound to natural growth.

## NOTE ABOUT FORMULAS

Within the FORMULA of the tag, the variable `a` is can be used to access the actor for more complex calculations. The
variable `b` is the parameter's own base before any natural bonus, in the same status-screen numbers the tag is written
in, so `<atkBuffPlus:[b * 0.1]>` is a tenth of the base attack. Note that `a` gives the engine's values as they are
stored, so `a.hit` is 0.95 and not 95- multiply by 100 when a formula needs the percent.

## NOTE ABOUT CUSTOM PARAMETERS

Custom parameters require their respective plugins to be installed. Where each plugin sits in the plugin list does not
matter.

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- Enemies
- States

## TAG FORMAT

`<(PARAM)(BUFF|GROWTH)(PLUS|RATE):[FORMULA]>`
Where (PARAM) is the (base/sp/ex) parameter shorthand.
Where (BUFF|GROWTH) is literally one of either "Buff" or "Growth".
Where (PLUS|RATE) is literally one of either "Plus" or "Rate".
Where [FORMULA] is the formula to produce the amount.

There are a lot of shorthands available for use with this plugin to build your various buff and growth tags. Here is a
comprehensive list of the shorthands along with a translation to the actual parameter of all supported shorthands.

### Base Parameters

`<mhpBuffPlus:[FORMULA]>`
`<mhpBuffRate:[FORMULA]>`
`<mhpGrowthPlus:[FORMULA]>`
`<mhpGrowthRate:[FORMULA]>`
Where `mhp` is max hp.

`<mmpBuffPlus:[FORMULA]>`
`<mmpBuffRate:[FORMULA]>`
`<mmpGrowthPlus:[FORMULA]>`
`<mmpGrowthRate:[FORMULA]>`
Where `mmp` is max mp.

`<atkBuffPlus:[FORMULA]>`
`<atkBuffRate:[FORMULA]>`
`<atkGrowthPlus:[FORMULA]>`
`<atkGrowthRate:[FORMULA]>`
Where `atk` is attack.

`<defBuffPlus:[FORMULA]>`
`<defBuffRate:[FORMULA]>`
`<defGrowthPlus:[FORMULA]>`
`<defGrowthRate:[FORMULA]>`
Where `def` is defense.

`<matBuffPlus:[FORMULA]>`
`<matBuffRate:[FORMULA]>`
`<matGrowthPlus:[FORMULA]>`
`<matGrowthRate:[FORMULA]>`
Where `mat` is magic attack.

`<mdfBuffPlus:[FORMULA]>`
`<mdfBuffRate:[FORMULA]>`
`<mdfGrowthPlus:[FORMULA]>`
`<mdfGrowthRate:[FORMULA]>`
Where `mdf` is magic defense.

`<agiBuffPlus:[FORMULA]>`
`<agiBuffRate:[FORMULA]>`
`<agiGrowthPlus:[FORMULA]>`
`<agiGrowthRate:[FORMULA]>`
Where `agi` is agility.

`<lukBuffPlus:[FORMULA]>`
`<lukBuffRate:[FORMULA]>`
`<lukGrowthPlus:[FORMULA]>`
`<lukGrowthRate:[FORMULA]>`
Where `luk` is luck.

### Ex Parameters

`<hitBuffPlus:[FORMULA]>`
`<hitBuffRate:[FORMULA]>`
`<hitGrowthPlus:[FORMULA]>`
`<hitGrowthRate:[FORMULA]>`
Where `hit` is hit rate.

`<evaBuffPlus:[FORMULA]>`
`<evaBuffRate:[FORMULA]>`
`<evaGrowthPlus:[FORMULA]>`
`<evaGrowthRate:[FORMULA]>`
Where `eva` is evasion rate.

`<criBuffPlus:[FORMULA]>`
`<criBuffRate:[FORMULA]>`
`<criGrowthPlus:[FORMULA]>`
`<criGrowthRate:[FORMULA]>`
Where `cri` is critical hit rate.

`<cevBuffPlus:[FORMULA]>`
`<cevBuffRate:[FORMULA]>`
`<cevGrowthPlus:[FORMULA]>`
`<cevGrowthRate:[FORMULA]>`
Where `cev` is critical evasion rate.

`<mevBuffPlus:[FORMULA]>`
`<mevBuffRate:[FORMULA]>`
`<mevGrowthPlus:[FORMULA]>`
`<mevGrowthRate:[FORMULA]>`
Where `mev` is magic evasion rate.

`<mrfBuffPlus:[FORMULA]>`
`<mrfBuffRate:[FORMULA]>`
`<mrfGrowthPlus:[FORMULA]>`
`<mrfGrowthRate:[FORMULA]>`
Where `mrf` is magic reflect rate.

`<cntBuffPlus:[FORMULA]>`
`<cntBuffRate:[FORMULA]>`
`<cntGrowthPlus:[FORMULA]>`
`<cntGrowthRate:[FORMULA]>`
Where `cnt` is counter attack rate.

`<hrgBuffPlus:[FORMULA]>`
`<hrgBuffRate:[FORMULA]>`
`<hrgGrowthPlus:[FORMULA]>`
`<hrgGrowthRate:[FORMULA]>`
Where `hrg` is hp regen rate.

`<mrgBuffPlus:[FORMULA]>`
`<mrgBuffRate:[FORMULA]>`
`<mrgGrowthPlus:[FORMULA]>`
`<mrgGrowthRate:[FORMULA]>`
Where `mrg` is mp regen rate.

`<trgBuffPlus:[FORMULA]>`
`<trgBuffRate:[FORMULA]>`
`<trgGrowthPlus:[FORMULA]>`
`<trgGrowthRate:[FORMULA]>`
Where `trg` is tp regen rate.

### Sp Parameters

`<tgrBuffPlus:[FORMULA]>`
`<tgrBuffRate:[FORMULA]>`
`<tgrGrowthPlus:[FORMULA]>`
`<tgrGrowthRate:[FORMULA]>`
Where `tgr` is targeting rate.

`<grdBuffPlus:[FORMULA]>`
`<grdBuffRate:[FORMULA]>`
`<grdGrowthPlus:[FORMULA]>`
`<grdGrowthRate:[FORMULA]>`
Where `grd` is guarding rate.

`<recBuffPlus:[FORMULA]>`
`<recBuffRate:[FORMULA]>`
`<recGrowthPlus:[FORMULA]>`
`<recGrowthRate:[FORMULA]>`
Where `rec` is recovery rate.

`<phaBuffPlus:[FORMULA]>`
`<phaBuffRate:[FORMULA]>`
`<phaGrowthPlus:[FORMULA]>`
`<phaGrowthRate:[FORMULA]>`
Where `pha` is pharmacy rate.

`<mcrBuffPlus:[FORMULA]>`
`<mcrBuffRate:[FORMULA]>`
`<mcrGrowthPlus:[FORMULA]>`
`<mcrGrowthRate:[FORMULA]>`
Where `mcr` is mp cost reduction rate.

`<tcrBuffPlus:[FORMULA]>`
`<tcrBuffRate:[FORMULA]>`
`<tcrGrowthPlus:[FORMULA]>`
`<tcrGrowthRate:[FORMULA]>`
Where `tcr` is tp cost reduction rate.

`<pdrBuffPlus:[FORMULA]>`
`<pdrBuffRate:[FORMULA]>`
`<pdrGrowthPlus:[FORMULA]>`
`<pdrGrowthRate:[FORMULA]>`
Where `pdr` is physical damage reduction rate.

`<mdrBuffPlus:[FORMULA]>`
`<mdrBuffRate:[FORMULA]>`
`<mdrGrowthPlus:[FORMULA]>`
`<mdrGrowthRate:[FORMULA]>`
Where `mdr` is magical damage reduction rate.

`<fdrBuffPlus:[FORMULA]>`
`<fdrBuffRate:[FORMULA]>`
`<fdrGrowthPlus:[FORMULA]>`
`<fdrGrowthRate:[FORMULA]>`
Where `fdr` is floor damage reduction rate.

`<exrBuffPlus:[FORMULA]>`
`<exrBuffRate:[FORMULA]>`
`<exrGrowthPlus:[FORMULA]>`
`<exrGrowthRate:[FORMULA]>`
Where `exr` is experience gained rate.

### Custom Parameters

`<mtpBuffPlus:[FORMULA]>`
`<mtpBuffRate:[FORMULA]>`
`<mtpGrowthPlus:[FORMULA]>`
`<mtpGrowthRate:[FORMULA]>`
Where `mtp` is max tp.

`<harBuffPlus:[FORMULA]>`
`<harBuffRate:[FORMULA]>`
`<harGrowthPlus:[FORMULA]>`
`<harGrowthRate:[FORMULA]>`
Where `har` is healing rate, and requires `J-Base` 3.2.0+.

Every other plugin keeps its parameters' tags in its own list:

- `cdm` (critical damage multiplier, requires [`J-CriticalFactors`](../../../crit/core/notetags/natural-growth.md))
- `ctr` (critical damage reduction, requires [`J-CriticalFactors`](../../../crit/core/notetags/natural-growth.md))
- `dor` (drop rate, requires `J-DropsControl`)
- `gdr` (gold rate, requires `J-DropsControl`)
- `hcr` (life cost, requires `J-Resources`; negative is cheaper)
- `lst` (lifesteal, requires `J-Resources-ABS`)
- `mst` (manasteal, requires `J-Resources-ABS`)
- `tst` (techsteal, requires `J-Resources-ABS`)
- `sar` (shield amplification, requires `J-ABS-Shield`)
- `ser` (shield effectiveness, requires `J-ABS-Shield`)
- `msb` (move speed boost, requires `J-ABS-Speed`)
- `apr` (aptitude rate, requires [`J-Aptitude`](../../../apt/core/notetags/natural-growth.md))
- `prof` (proficiency bonus, requires `J-Proficiency`)
- `sdr` (SDP rate, requires [`J-SDP`](../../../sdp/core/notetags/natural-growth.md))

## TAG EXAMPLES

`<hrgGrowthRate:[5]>`
Gain +5% hp regen (`hrg`) per level.
This would result in gaining an ever-increasing amount of hp regen per level.

`<exrBuffPlus:[25]>`
Gain a flat 25 exp rate (`exr`) while this tag is applied to this battler.
This would be lost if the object this tag lived on was removed.

`<atkGrowthPlus:[a.level * 3]>`
Gain (the battler's level multiplied by 3) attack (`atk`) per level.
This would result in gaining an ever-increasing amount of attack per level.

### Example ideas

While you can read about the syntax in [TAG FORMAT](#tag-format), here I wanted to present you a few ideas of things
you can do with this plugin, to better illustrate what exactly this plugin can do.

`<mtpBuffPlus:[80]>`
On an actor: the actor now has a permanent bonus of 80 to their max tp.

`<grdGrowthRate:[5]>`
On a class: for every level gained by an actor using this class, they will gain a permanent 5% "rate" bonus to their
GRD, meaning it is a multiplied percent bonus against their base and plus values combined. Note that this is stored on
the actor and will persist even after the class is changed.

`<hrgBuffPlus:[(a.level**1.3)+(a.level*5)]>`
On an armor: the actor will have a bonus of (5x their level) and (their level to the 1.3rd power) added together worth
of HRG.

`<atkGrowthPlus:[a.level]>`
On a state: for every level gained by an actor afflicted with this state, they will gain their level's worth of attack
permanently.

`<harBuffPlus:[20]>`
On a state: while afflicted, the actor's outgoing healing is 20% stronger on top of their base HAR. Lost as soon as the
state wears off.

`<lstGrowthPlus:[1.5]>`
On a class: for every level gained by an actor using this class, they permanently gain 1.5% lifesteal. Requires
`J-Resources-ABS`, which owns lifesteal.