---
type: notetag
title: AI Traits
description: The tags modifying how an enemy chooses and uses its skills.
tags: [abs, tag, enemy, event, ai, skills]
---

# AI Traits

## Description

While the basic AI works, you may want to tune it for specific enemies. AI traits modify how an enemy chooses and uses
its skills. Add these tags alongside the enemy id, sight, and other configuration tags.

### `<aiTrait:careful>`

Careful enemies are more calculating. They avoid using skills that would be elementally ineffective, and generally make
smarter decisions. This also amplifies the judgment of other AI traits when combined.

### `<aiTrait:executor>`

Executor enemies prioritize skills that maximize damage and target weak spots. They will use everything in their arsenal
to destroy you.

### `<aiTrait:reckless>`

Reckless enemies never use their basic attack. They will spam their learned skills until they are out of resources. This
also influences decision-making for other traits when combined.

### `<aiTrait:healer>`

Healer enemies monitor nearby allies and prioritize healing skills to keep those allies alive. If combined with
Reckless, they will ignore efficiency and use the strongest healing skill available. If combined with Careful, they will
use the best-fit healing skill for the situation rather than just the most powerful one.

### `<aiTrait:cleanser>`

Cleanser enemies scan nearby allies for negative states and attempt to remove them using skills flagged as
state-removing. They will prioritize cleansing over attacking when allies are suffering. If combined with Careful, they
use the most targeted cleanser available. If combined with Reckless, they will use any cleanser regardless of overlap.

### `<aiTrait:buffer>`

Buffer enemies try to apply positive states to nearby allies using buff-flagged skills before choosing an attack. This
lets you build support enemies who bolster their teammates before engaging the player. Buffer is amplified by Careful
(more selective) and Reckless (spams it).

### `<aiTrait:tactical>`

Tactical enemies step back to maintain optimal range before using a skill. Where a basic enemy will fire wherever they
happen to be, a tactical enemy will reposition first. Pair with Careful or Executor for enemies that stay at range and
punish you for advancing.

### `<aiTrait:berserker>`

Berserker enemies go all-out when their HP drops below a threshold. Once low on health, they stop caring about range,
cooldowns, or efficiency, and just attack as fast as possible. Think of it as the AI equivalent of "panic mode".

### `<aiTrait:follower>`

NOTE: This is a coordination trait. Prefer `<aiRole: follower>` instead. Supported as a backward-compatible alias only.

### `<aiTrait:leader>`

NOTE: This is a coordination trait. Prefer `<aiRole: leader>` instead. Supported as a backward-compatible alias only.

## NOTE ABOUT ENEMIES WITHOUT TRAITS

Without any AI traits, enemies will still attack and use skills, but skill selection will be mostly random within what
is available, subject to cooldowns and resource costs.

## NOTE ABOUT MULTIPLE TRAITS

Multiple AI traits can be stacked on a single enemy.

## TAG USAGE

- Event comments, on an enemy event.
- Enemies, as a default for that enemy.

## TAG FORMAT

`<aiTrait:careful>`

`<aiTrait:executor>`

`<aiTrait:reckless>`

`<aiTrait:healer>`

`<aiTrait:cleanser>`

`<aiTrait:buffer>`

`<aiTrait:tactical>`

`<aiTrait:berserker>`

`<aiTrait:follower>`

`<aiTrait:leader>`

## TAG EXAMPLES

`<aiTrait:careful>`
This enemy has the careful AI trait.