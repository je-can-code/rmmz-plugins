---
status: open
area: feature
---

# Statistipedia — player records screen in the Omnipedia

## Summary

Extract the stat-tracking logic currently buried in `src/plugins/__ca-mods/core/` into a proper plugin (or Omnipedia extension) and surface it as a **Statistipedia** tab inside the Omnipedia. The data is already being silently accumulated in game variables — it just needs a UI and expanded coverage.

## Current state (ca-mods tracking)

17 variables tracked in `J.CAMods.Tracking` (see `src/plugins/__ca-mods/core/_metadata/initialization.js`, variables 101–117):

### Offensive
- Enemies Defeated (101)
- Destructibles Destroyed (102)
- Total Damage Dealt (103)
- Highest Damage Dealt (104)
- Number of Crits Dealt (105)
- Biggest Crit Dealt (106)

### Defensive
- Total Damage Taken (109)
- Highest Damage Taken (110)
- Number of Crits Taken (111)
- Biggest Crit Taken (112)
- Number of Parries (107)
- Number of Precise Parries (108)

### Activity
- Mainhand Skill Usage (113)
- Offhand Skill Usage (114)
- Assigned Skill Usage (115)
- Dodge Skill Usage (116) — variable allocated but increment not yet wired
- Number of Deaths (117)

Tracking hooks live in `JABS_Engine` overrides: `handleDefeatedEnemy`, `handleDefeatedPlayer`, `postExecuteSkillEffects`, `executeMapAction`.

## Proposed new metrics

### Combat
- Times guarded (split from offhand usage when guard-type)
- Highest combo chain (consecutive hits without taking damage)
- Enemies defeated by family (per-family counters, e.g. "Bearcats Slain: 847")
- Named enemies defeated (! prefix enemies)

### Progression
- Nodes ranked up (total rank-ups across all panels)
- Total SDP points earned (lifetime)
- Total SDP points spent
- Highest panel rank achieved
- Levels gained

### Crafting / JAFTING
- Total recipes crafted
- Unique recipes discovered
- Items refined
- Highest refinement tier reached
- Crafts by category (food / weapons / armor)

### Exploration
- Unique maps visited
- Steps taken (engine already tracks via `$gameParty`)
- Chests opened
- Quests completed (main vs side)

### Economy
- Total gold earned (lifetime)
- Total gold spent
- Items purchased / sold
- Most expensive single purchase

### Derived stats (calculated at display time, not stored)
- Kill/Death ratio
- Crit rate (crits dealt / mainhand+skill uses)
- Parry rate (parries / damage-taken events)
- Average damage per hit

### Flavor / fun (optional, low priority)
- Times rested at the inn
- Trees vs rocks vs crates destroyed (split destructibles)
- Party cycles
- Longest deathless streak

## Architecture

1. **Extract from ca-mods** — the tracking hooks and variable definitions should move into their own plugin (e.g. `J-Statistipedia` or `J-Omni-EXT-Stats`) so they're reusable beyond CA.
2. **Omnipedia tab** — add a `Statistipedia` entry to the Omnipedia tab list. The scene/window structure follows the existing `-pedia` pattern (tab header → category list → detail view).
3. **Categories in the UI** — group stats into sections (Combat, Progression, Crafting, Exploration, Economy, Fun) with a left-side category list and right-side stat detail.
4. **Variable-backed storage** — continue using game variables for serialization (they save/load for free via `$gameVariables`). New metrics just need new variable IDs and one-line `modVariable` calls at the right hooks.

## Design notes

- The name **Statistipedia** fits the Omnipedia `-pedia` naming convention and CA's comedy tone.
- This feeds the **trophy loop** design pillar — seeing lifetime stats is its own reward.
- Some stats double as subtle tutorials: a player who sees "Parries: 0" might wonder what parrying is.
- The flavor stats ("Trees Chopped: 2,847") are screenshot bait — players share these.

## Related

- [`ca-mods-boundary.md`](ca-mods-boundary.md) — broader effort to extract CA-specific logic into proper plugins
- Omnipedia core: `src/plugins/omni/core/`
- Monsterpedia pattern: `src/plugins/omni/ext/monster/`
- Questopedia pattern: `src/plugins/omni/ext/quest/`