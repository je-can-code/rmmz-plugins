---
type: notetag
title: Heal Events
description: The onSelf and onAlly tags cascading secondary HP, MP, or TP heals whenever a battler recovers a resource.
tags: [resources-abs, tag, heal, cascade, ally, on-self, on-ally]
---

# Heal Events

## Description

When a battler receives positive HP, MP, or TP recovery, a cascade of secondary heals can be triggered based on
notetags placed on any traited source (actor, class, equip, state, skill).

Two families:

- `onSelf` tags — when THIS battler's trigger resource is healed, also heal PERCENT% of the heal amount as the output
  resource. Self always receives it; if RANGE > 0, allies within RANGE tiles also receive it.
- `onAlly` tags — when an ally within RANGE tiles has their trigger resource healed, this battler (the observer)
  receives PERCENT% of that heal amount as the output resource.

Cascades are limited by the [`healChainDepth`](../parameters/heal-chain-depth.md) plugin parameter (default 5).
Secondary heals themselves fire `onHeal` again, so chains of empathy bonds and jelly transfusions can propagate
naturally up to the depth limit.

## TAG USAGE

- Actors
- Enemies
- Classes
- Weapons
- Armor
- States
- Skills

## TAG FORMAT

### onSelf

`<onSelf{Trigger}Heal{Output}:[PERCENT, RANGE]>`
`<onSelf{Trigger}Heal{Output}:[PERCENT, RANGE, MAX_DEPTH]>`
Where Trigger is one of `Hp`, `Mp`, `Tp` or `Any`.
Where Output is one of `Hp`, `Mp` or `Tp`.
Where PERCENT is an integer percentage of the heal amount to apply as secondary.
Where RANGE is a tile radius; 0 = self only, >0 includes allies within radius.
Where MAX_DEPTH is the max cross-battler cascade hops (default: `healChainDepth` plugin param). The tag never echoes
itself on the same battler regardless of this value.

### onAlly

`<onAlly{Trigger}Heal{Output}:[PERCENT, RANGE]>`
`<onAlly{Trigger}Heal{Output}:[PERCENT, RANGE, MAX_DEPTH]>`
Where Trigger is one of `Hp`, `Mp`, `Tp` or `Any`.
Where Output is one of `Hp`, `Mp` or `Tp`.
Where PERCENT is an integer percentage of the ally's heal to apply to self.
Where RANGE is a tile radius; observer only reacts if healed ally is within range.
Where MAX_DEPTH is the max cross-battler cascade hops (default: `healChainDepth` plugin param).

## TAG EXAMPLES

`<onSelfHpHealMp:[50, 0]>`
When this battler receives HP healing, also recover 50% of that amount as MP. Self only (Jelly Mana Transfusion).

`<onSelfHpHealHp:[25, 3]>`
When this battler is healed for HP, also heal self and allies within 3 tiles for 25% of the same amount (Empathic
Splash).

`<onAllyHpHealHp:[30, 4]>`
Whenever an ally within 4 tiles receives HP healing, this battler also gains 30% of that heal amount as HP (Emotion
Empathic Bond).

`<onSelfAnyHealTp:[10, 0]>`
Any resource recovery on this battler also grants 10% as TP (Momentum from healing).