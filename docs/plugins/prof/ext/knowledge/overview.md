---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [prof-knowledge, overview]
version: "1.0.0"
---

# Overview

This plugin turns skill use into a spendable currency.

Whenever an actor gains proficiency in a skill, the party gains the same amount of "knowledge" in whatever kinds that
skill's type is mapped to. What the kinds are, which skill types produce them, and what they can be traded for are all
authored in configuration - this plugin never knows what any particular kind of knowledge means.

## Integrations

Integrates with others of mine plugins:

- [`J-Base`](../../../_base/core/overview.md); to be honest this is just required for all my plugins.
- [`J-Proficiency`](../../core/overview.md); the source of every point this plugin hands out.

## Details

Knowledge is defined in three blocks of `data/config.proficiency.json`, alongside `conditionals`.

A TAG is a kind of knowledge. It is a name for a balance and nothing more.

The SKILL TYPE MAPPING says which tags a skill's use produces, keyed by the skill's type. A skill type absent from the
mapping produces nothing, which is what lets a roster of passives and item skills need no exclusion list - and means a
skill type added later stays silent until somebody maps it.

An EXCHANGE is a standing offer to convert one tag's points into something from the database at an authored rate.
Exchanges are named, because a tag may be worth spending on more than one thing.

Only actors produce knowledge. Enemies gain proficiency of their own and it yields nothing, because the party cannot
learn from a lesson it did not sit through.

Proficiency can also be handed out in the negative by the
[commands that reward it](../../core/overview.md#plugin-commands). A debit reduces proficiency and leaves knowledge
alone; the points may already have been spent, and taking back what is no longer there would leave the ledger
disagreeing with the bag.

## Authoring knowledge

A minimal setup looks like this:

```json
"knowledgeTags": [
  {
    "key": "offensive",
    "name": "Offensive Knowledge",
    "iconIndex": 0,
    "description": "What swinging something teaches you about making one."
  }
],
"skillTypeMapping": {
  "7": [ "offensive" ]
},
"knowledgeExchanges": [
  {
    "key": "blueprints",
    "tagKey": "offensive",
    "cost": 100,
    "output": { "id": 501, "type": "i", "count": 1 }
  }
]
```

A skill type may map to several tags at once, in which case using it credits every one of them.

An output type is one of `i` for an item, `w` for a weapon, or `a` for an armor.

## Exchanging

The [exchange command](commands/exchange-knowledge.md) converts every whole unit the balance can afford, all at once.
Whatever is left over is smaller than the price of a unit, and it stays banked toward the next one.

The command says nothing and plays nothing. It writes what happened into a variable and a switch of your choosing, and
the event decides what to make of that - so the character handing the goods over speaks in their own voice rather than
this plugin's.

Leave either id at 0 to skip that output entirely. An output nobody asked for is left alone rather than cleared.