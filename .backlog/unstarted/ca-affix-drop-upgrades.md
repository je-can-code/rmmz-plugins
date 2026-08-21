---
status: open
area: gameplay
---

# Affix-driven drop upgrades, and flux drives that scale affix appearance

## Severity

**None** — nothing is broken. This is an unbuilt connection between three systems that already ship
independently and have never been introduced to each other.

## Gain

**High.** It gives the difficulty system a motive that isn't self-imposed challenge, gives the affix
system a payout that differs from an ordinary kill, and turns an affixed enemy's name into a reward
preview the player learns to read. It is also the only proposal that engages a completionist player
without asking them to open a menu.

## Source

- `src/plugins/diff/**` — `DifficultyLayer`, `DifficultyBonusEffects`, `Scene_Difficulty`
- `ca/chef-adventure/data/config.difficulty.json` — 17 layers
- `ca/chef-adventure/data/States.json` — affixes at 301-400
- `ca/chef-adventure/data/Armors.json` — material ladders at 346/356/361/366/371/376/386/391/396/401/421
- `ca/chef-adventure/data/CommonEvents.json` — common event 37, "scan for new drives"

## Context

Three shipped systems, none of which reference the others.

**The affixes** (`States.json` 301-400) grade an enemy the way a chef grades an ingredient:

```
301-305   positive quality prefixes    Origin / Vintage / Prime / Grand / Elysian   (tiers 1-5)
311-320   negative prefixes            one per element
351-400   elemental suffixes           ten groups of five: four positive tiers, then a negative
```

Element is carried by the icon index — 912 cut, 913 poke, 914 blunt, 915 heat, 916 liquid, 917 air,
918 ground, 919 energy, 920 void, 921 typeless. A given enemy may carry a prefix, a suffix, both or
neither, and either slot may be the negative one: *Vintage Ghosty of Jus*, *Fractured Wolftrap of
Smoke*, *Tepid Wet Mousse of Drip*.

**The material ladders** (`Armors.json`) are five contiguous rungs whose names already escalate in
quality — Cracked / Intact / Sharp / Offensive / **Live** Stinger; Flimsy / Bone / Double / Powerful /
**Razor** Fangs; Dense / Wisp / Bright / ? / **Flowing** Pelt.

**The flux drives** (`config.difficulty.json` 011-016) are not difficulty at all. Unlike the easy/hard
rungs, every drive applies symmetrically to actors *and* enemies — Glass House makes everyone fragile,
Limitless Energy makes everyone's skills free. They are world mutators, collected as items 133-138 and
installed at the Difficulty Lord via common event 37. Their costs (2-8 layer points) are already an
ordering by how disruptive each one is.

The gap: an affix currently multiplies drop **rate** via `rewardMultiplier`, so an Elysian Bearcat
drops the same Dense Pelt, just more often. Nothing anywhere makes a *better* material appear.

## Work

### 1. Drop upgrade tags

Two tags, deliberately sharing a stem so a reader knows they belong to one system. The `Id` suffix
marks a pointer, matching `skillId` / `offhandSkillId` / `enemyId`; the bare form is a quantity,
matching `speedBoost` / `thisCri`.

```
<dropUpgrade:2>       on a state or on equipment - how many rungs to promote a drop
<dropUpgradeId:307>   on an item/weapon/armor    - the row this one promotes into
```

The pointer's meaning is scoped to the table it sits in, so an item can only ever promote into an
item. Cross-stream upgrades are structurally impossible and need no validation.

### 2. Resolution rules

- **Walk the chain, decrementing per hop, and clamp at the end.** `<dropUpgrade:8>` against a
  four-link chain simply lands on the top rung; over-upgrading is not an error.
- **Negative affixes carry a negative count and walk the chain downward.** Do not author a second
  reverse tag — build the inverse map once at boot by scanning every `dropUpgradeId`. The forward
  links already contain the backward links, and deriving them means the two can never disagree.
- **Sum the enemy's affixes and the killer's equipment; do not pick a winner.** Affixes are read off
  `allStates()`. A player-side upgrade item that silently does nothing because the target happened to
  carry a prefix reads as broken. Summing is self-limiting because the chain length is the real cap.
- **Apply the promotion after the drop roll resolves, never during it.** `rewardMultiplier` already
  owns rate. Rolling against an upgraded table would collapse both effects onto one axis, which is the
  exact thing this item exists to fix. Roll normally, then promote what came out.

### 3. Flux drives scale affix appearance

Key off the **summed cost of enabled drives only** — the easy/hard layers must contribute nothing.
Turning enemy ATK to 120% is a knob; rewriting what a skill costs is a distortion, and the fiction is
explicit that anomalies come from *"manipulating time and space"*. Both effects apply as the sum
climbs:

- more enemies carry an affix at all
- the `affix-weight` distribution flattens, so the rarer tiers stop being rare

`DifficultyBonusEffects` is the right home for the multiplier. Note that its existing `encounters`
field is not reusable here — it is read only by `Game_Map.encounterStep`, which governs vanilla random
encounters and is inert under JABS.

### 4. Player-side upgrade gear

Once the tag is read from equipment, an accessory or weapon bearing `<dropUpgrade:N>` becomes a
harvesting tool. Reserve at least one for the crafting tree; the vocabulary writes itself in a game
whose affixes are already cuts of meat.

## Notes

- The design conversation that produced this ran on 2026-08-19 and settled several **adjacent** things
  that are out of scope here but should not be lost:
  - **Anomalies should be present until killed**, not rolled on map transfer. The Hunting Lord's own
    dialogue says the board lists what he has *detected*, and the `anomaly * dead` switches (241-252)
    already model a one-time kill. The existing `var 13` roll should govern the post-kill **echoes**,
    which the dialogue explicitly establishes as harmless and farmable.
  - **Veterans are a separate idea from anomalies** and should never touch the Lords' system. An
    anomaly has no history by definition; a veteran is nothing but history. The bearcat cull in Ch1 is
    a mandatory quest about bearcats being a problem and is the natural host for the first one.
  - **Day/night enemy variation wants one global rule**, not a per-zone table — the dead and the flying
    at night, things that photosynthesize or graze by day. The bestiary already splits cleanly along
    that line, so it costs no per-map authoring.
  - **Drive-gated rooms**: content that only opens while a specific drive is active, clustered by
    drive rather than by dungeon so one trip to the Difficulty Lord creates a route. Save sigils were
    considered and ruled out as flux terminals — `Map238` establishes in shipped text that the
    protagonists cannot operate flux technology themselves.
- Two related copy-paste defects were fixed on 2026-08-19 and are not part of this item: the six flux
  drive item descriptions named the wrong layers, and common event 37's royal branch announced
  `\Item[137]` while checking for 138.
- Absent drop sources on the upper ladder rungs are **unbuilt content**, not a gap this item repairs.
  The enemies that will drop them arrive with the maps that hold them.
