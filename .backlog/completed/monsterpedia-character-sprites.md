---
completed: 2026-11-09
ship: J-OMNI-Monsters 3.0.0, J-Base 4.3.0 and J-CMS 1.2.2
---

# Monsterpedia: draw each enemy's character sprite, and place the breakables

## Gain

The Monsterpedia shows every enemy the way it looks on the map. Today it draws battler images, and across Chef
Adventure's roster of 270 enemies that comes to 91 distinct pictures: 193 enemies share one with someone else,
and 29 named slots have none at all (measured 2026-11-04). Every enemy has its own character sprite, so drawing that
instead gives each one a picture of its own.

## Source

- `src/plugins/omni/ext/monster/windows/Window_MonsterpediaDetail.js`: `getOrCreateEnemySprite`, carrying
  `// TODO: replace this with a non-battle version of the sprite.`
- `ca/chef-adventure/data/Map361.json` "_FullEnemyMap": one event per enemy, wearing its character sprite. Jeremy
  built it so every enemy's sprite has one known place to be read from.
- `ca/docs/enemies/main.md`, `ca/docs/enemies/drop-sources.md`, `ca/docs/enemies/harvest-nodes.md`

## Context

Jeremy, 2026-11-04: "yes, I do actually need to implement that- start rendering the character sprite, but I needed
things normalized (hence, this _FullEnemyMap map)."

Rows 1-100 are the breakables. Whether they show up in the Monsterpedia at all is open, "possibly a different
category", and gets decided together with the sprite work.

The enemy docs went stale through the enemy passes. `docs/enemies/main.md` predates the five-tier recut, so it holds
none of the tier names from passes 2 and 3 (Rapture, Morningstar, Hraesvelgr, !Failsafe and the rest).
`drop-sources.md` and `harvest-nodes.md` still say the back half of the level ladder has no maps, which pass 4 made
false. Refreshing them belongs to this work, since this is where the roster gets looked at whole again.

## Work

1. Decide where an enemy's character sprite comes from at runtime: read off its `_FullEnemyMap` event, or carried on
   the enemy row. Then build the sprite from that character sheet's front-facing frame.
2. `getOrCreateEnemySprite` draws the character sprite, at a size that suits the detail window, for every row that
   has one.
3. Decide whether rows 1-100 show, and where: their own category, or not at all.
4. Refresh `docs/enemies/main.md`, cutting the copied roster rather than re-copying it, and correct the "no maps"
   claims in `drop-sources.md` and `harvest-nodes.md`.

## Definition of done

- [x] `bun run hotfix` green, `Window_MonsterpediaDetail.js` no longer carries the sprite TODO
- [x] in-game: open the Monsterpedia on Rapture, then on Morningstar; each shows its own map sprite
- [x] in-game: the breakables appear where it was decided they should, or nowhere
- [x] `ca/docs/enemies/main.md` names the five-tier enemies, so a search for Morningstar finds it
- [x] `ca/docs/enemies/drop-sources.md` and `harvest-nodes.md` no longer say the back half of the ladder has no maps

## Notes

Parked during the Chef Adventure enemy pass and filed 2026-11-08.

The sprite is read off J-ABS's roster map, the event whose id matches the enemy's, so who wears what is recorded in
one place. The breakables got a page of their own: `data/config.omni.json` authors the Monsterpedia's pages, Chef
Adventure's second page is the Destructapedia, and rows 1-100 carry `<monsterType:destructible>` to land on it. That
page leaves out its entries' stats.
