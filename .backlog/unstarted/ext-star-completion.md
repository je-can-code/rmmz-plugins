---
status: open
area: ext-star
---

# `ext/star` completion

## Source

- Star extension plugin sources under `src/plugins/abs/ext/star/`
- `Game_Map.generateStarEnemy` (broken `_events` assignment called out in prior triage)
- DataManager load path when enemy map is missing

## Context

Dynamic enemy generation via a separate enemy map is only partly implemented.

## Work

- Fix `Game_Map.generateStarEnemy` event registration (no invalid `$gameMap._events[index]` assignment).
- Throw or otherwise fail clearly in DataManager when the required enemy map is absent.
- Finish any remaining star-flow gaps as a dedicated PR.
