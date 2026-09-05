---
completed: 2026-08-24
ship: J-Log 3.0.0
---

# Map log channel registry (one global, three managers)

## Source

- `src/plugins/log/core/managers/DataManager.js` (`createGameObjects` — three `$` globals)
- `src/plugins/log/core/_metadata/initialization.js` (`globalThis.$actionLogManager`, `$diaLogManager`, `$lootLogManager`)
- `src/plugins/log/core/scenes/Scene_Map.js` (windows bound per manager)
- Consumers across ABS, SDP, Aptitude, Omni quest, etc. (`$actionLogManager.addLog`, …)

## Context

J-Log correctly uses **three instances** of `MapLogManager` — action combat feed, dialog/quest feed, loot feed — each with its own max count and window. That is instancing done right.

What is awkward is **three top-level `$` globals** and three `globalThis` bootstrap slots for the same conceptual service. Verify currently grandfather lists all three in `LEGACY_GLOBAL_THIS_PROPERTIES`.

## Recommendation

Introduce **one global owner** that constructs and exposes the three channel managers. Name is flexible (`MapLogRegistry`, `MapLogChannels`, `$mapLogs`, … — not married to “bundle”):

```javascript
class MapLogRegistry
{
  constructor()
  {
    this.action = new MapLogManager();
    this.action.setMaxLogCount(30);
    this.dialog = new MapLogManager();
    this.dialog.setMaxLogCount(10);
    this.loot = new MapLogManager();
    this.loot.setMaxLogCount(100);
  }
}

// createGameObjects:
$mapLogs = new MapLogRegistry();

// consumers:
$mapLogs.action.addLog(log);
$mapLogs.dialog.addLog(log);
$mapLogs.loot.addLog(log);
```

Optional migration aliases on the registry (`get actionLog()`) or a short deprecation shim if renaming every call site in one PR is too wide.

## Work

- Add registry class (or equivalent) in J-Log core; single bootstrap in `DataManager.createGameObjects`.
- Repoint `Scene_Map` windows and all `addLog` / plugin-command call sites.
- Remove three `globalThis.*LogManager` bootstraps; shrink verify legacy allowlist.
- Plugin commands may keep user-facing names (“Action Log”) — only internal wiring changes.

## Notes

- Does not merge the three feeds into one manager — channels stay separate instances.
- Pairs with `$` singleton / verify cleanup in guidelines **J namespace bootstrap**.

## Definition of done

- [ ] `src/plugins/log/core/managers/MapLogRegistry.js` exists and owns all three channels
- [ ] `grep -rn 'actionLogManager\|diaLogManager\|lootLogManager' src/plugins/ --include=*.js`
      returns nothing outside `_metadata/_annotations.js` changelog text
- [ ] `LEGACY_GLOBAL_THIS_PROPERTIES` in `src/build-tools/verify-ships.js` lists `$mapLogs` and none
      of the three old names
- [ ] in-game: take a hit, read a dialog line, pick up a drop — all three feeds still render on the map

## Resolution

Landed 2026-08-24 in "Replace the three map log globals with one registry" (#82), as a breaking J-Log
3.0.0 change. Every consuming ship's `_annotations.js` carries the matching changelog line naming the
globals that went away.
