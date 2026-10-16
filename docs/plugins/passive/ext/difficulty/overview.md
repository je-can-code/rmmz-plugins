---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [passive-difficulty, overview]
---

# Overview

This plugin is an extension of [`J-Passive`](../../core/overview.md).

It enables the ability to apply one to many "difficulty layers". A layer is a passive that is on for everyone,
perpetually: it names one state for actors and one state for enemies, and while the layer is enabled every actor and
every enemy carries that state as a passive.

Everything a layer does lives on its states, so anything a state can do, a layer can do: any trait, and any tag any
plugin reads off a state.

Being passives, the states show no icon, fill no HUD strip, never expire, and nothing can cure or cleanse them. Tag
each one `<hideFromPassiveList>` to keep it out of the Passives menu as well.

## Note about notetags

There are no tags for this plugin. All difficulties are defined in an external JSON file.

## Configuring a layer

Every layer lives in `data/config.difficulty.json`, which is a list of them:

```json
{
  "key": "011_crimson-drive",
  "name": "Bloody Exchange",
  "iconIndex": 1009,
  "description": "First line.|Second line.",
  "cost": 5,
  "actorStateId": 501,
  "enemyStateId": 502,
  "enabled": false,
  "unlocked": false,
  "hidden": false
}
```

- `actorStateId`: the state every actor carries while the layer is enabled.
- `enemyStateId`: the state every enemy carries while the layer is enabled.
- Either may be 0, which grants that side of every fight nothing.
- With no layer enabled at all, the default layer (the [Default Difficulty](parameters/default-difficulty.md)
  parameter) stays in force, states and all.

## Affix effects (requires `J-Passive-Affix`)

It gives every difficulty layer an optional say in how enemy affixes roll: how often they appear, how evenly the pool is
spread, and whether affixes that are otherwise unreachable become available at all.

Nothing here is required. A layer that says nothing about affixes changes nothing about them, and without
[`J-Passive-Affix`](../affix/overview.md) installed the block is read and validated but never applied.

Have you ever wanted your hardest difficulty to feel like a different game rather than the same game with bigger
numbers? Well now you can! By adding an `affixEffects` block to a layer in the difficulty configuration, you too can
make that layer reshape the affixes your enemies spawn with.

### Config usage

- Any layer in `data/config.difficulty.json`

### Config format

```
"affixEffects": {
  "prefixChance": 150,
  "suffixChance": 150,
  "flatten": 40,
  "grants": [
    { "stateId": 306, "weight": 50 }
  ]
}
```

### Config notes

- Every field is optional. An omitted field does nothing at all.
- Effects from multiple enabled layers are combined, not overridden.
- When no layers are enabled, the default layer's block applies, matching how the default layer's states apply.

### Prefix chance / suffix chance

These are multipliers against whatever chance the spawn would otherwise have had, expressed as a percent. 100 means
"leave it alone".

They scale the chance AFTER `J-Passive-Affix` has resolved it, so the usual precedence still decides the baseline: an
event comment beats an enemy note, which beats the plugin default. This only says how much of that applies.

Examples:

`"prefixChance": 150`
Prefixes are half again as common while this layer is enabled.

`"prefixChance": 0`
Prefixes never roll while this layer is enabled. This is legal and occasionally useful, but it is an easy typo for
"leave it alone", which is 100 rather than 0.

Two enabled layers at 150 combine to 225% of the base chance, because layers multiply. The result is clamped to 0-100
before it is rolled.

### Flatten

Affix weights are shares, not percentages: an affix's odds are its own weight divided by the total weight of its pool. A
pool authored so that its best affix is fifty times rarer than its worst will show that best affix roughly never, no
matter how often affixes roll.

Flatten pulls every weight toward the pool's average, as a percent of the distance. At 0 the pool is untouched. At 100
every affix in the pool is equally likely. In between, the rare end becomes reachable without the common end
disappearing.

Example:

`"flatten": 40`
In a pool averaging 179, an affix weighted 10 is rewritten to about 78 - close to eight times as likely - while one
weighted 500 drops to about 372, losing roughly a quarter of its share.

Two enabled layers each flattening 40 combine to 64, not 80. Each layer closes part of the remaining distance to the
mean, so what is left after both is 60% of 60%. The order they are applied in does not matter.

Flatten applies to the whole pool. It has no notion of a "good" or "bad" affix, because an affix is only a state and
nothing records whether its effects favor the player.

### Grants

Have you ever wanted an affix that simply does not exist until the player opts into a harder game? Well now you can! By
reserving a state at weight zero and granting it from a layer, you too can hide an affix behind a difficulty.

An affix state weighted at zero is a member of its pool that is never drawn. It still counts as an affix everywhere
else - an event pinning it through `<passive:[...]>` still works, and its tier presentation still applies - it simply
never wins a random roll.

A grant hands that state a weight, which both unlocks it and prices it.

#### Config format

```
"grants": [
  { "stateId": ID, "weight": WEIGHT }
]
```

#### Example

A state noted with:

```
<enemy-prefix>
<affix-weight:0>
```

...paired with a layer configured:

```
"grants": [
  { "stateId": 306, "weight": 50 }
]
```

...means state 306 can only appear while that layer is enabled, at a weight of 50 against the rest of the prefix pool.

#### Config notes

- Grants are a list of objects rather than an object keyed by state id, because JSON object keys are always strings. A
  keyed form would make every id arrive as text and need converting before it could match anything, and named fields say
  which number is the id and which is the weight.
- The same state may not be granted twice by one layer. Two different layers granting it is fine and resolves to the
  larger of the two weights.
- Which slot a grant lands in comes from the state's own `<enemy-prefix>` or `<enemy-suffix>` tag, so a grant never has
  to name it. A state carrying both is granted in both.
- Granted weights are never flattened. Flatten reshapes the pool as authored; grants speak for what was deliberately
  left out of it.
- Two layers granting the same state resolve to the larger weight, not the sum of the two.
- Granting a state that already has a nonzero weight is an error and stops the game at boot. Grants exist to unlock
  reserved affixes; applied to one that already rolls, a grant would silently overwrite an authored weight.
- Granting a state id that does not exist, or one that is neither a prefix nor a suffix, is likewise an error at boot. A
  grant that quietly does nothing is indistinguishable from bad luck, which is a miserable thing to have to diagnose
  from inside a playthrough.