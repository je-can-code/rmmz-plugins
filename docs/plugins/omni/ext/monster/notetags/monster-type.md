---
type: notetag
title: Monster Type
description: The tag naming the kind of entry an enemy is, which decides the page of the Monsterpedia it is listed on.
tags: [omni-monster, tag, enemy, monsterpedia, page]
---

# Monster Type

## Description

The Monsterpedia is one scene with several pages, and each page lists one kind of entry: the ordinary monsters on one,
the crates and trees and ore on another, and whatever else you author. This tag names which kind an enemy is, and so
which page it is listed on. An enemy without the tag is an `enemy`, an ordinary monster.

## NOTE ABOUT THE PAGES

The kinds themselves live in `data/config.omni.json`, authored with the data editor's Omnipedia board. Each kind has
a key, which is what this tag names, plus the name and icon its page shows in the strip above the list, and whether
the entries on its page show their stats. L2/R2 flips between the pages in the order they are authored, and the
Monsterpedia opens on the first of them.

`<hideFromMonsterpedia>` from the [Monsterpedia Entry Tags](monsterpedia-entry-tags.md) still keeps an enemy off every
page, whatever its type.

## TAG USAGE

- Enemies

## TAG FORMAT

`<monsterType:KEY>`
Where KEY is the key of one of the kinds authored in `data/config.omni.json`.

## TAG EXAMPLES

`<monsterType:destructible>`
This enemy is listed on the destructibles' page rather than among the ordinary monsters.