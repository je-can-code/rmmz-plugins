# Team parameterization (opposing / friendly)

## Source

- `src/plugins/abs/core/__models/JABS_Battler/_reference.js` (team-related helpers)

## Context

Opposing and friendly teams were hardcoded with a mostly-binary assumption (ally vs enemy with a neutral special case).
Projects needing 3+ factions required a data-driven definition of team hostility.

## Work

### Implemented (teams 1.0)

- **External config required**: `data/config.jabs.json` (consumer project).
  - Loaded via `ExternalJsonConfigLoader` inside `J.ABS.Helpers.loadExternalConfig()`.
  - Root blob must be an object with a `teams` array.
  - Parsed blob is assigned to:
    - `J.ABS.Metadata.ExternalConfig`
    - `J.ABS.Metadata.Teams`
- **Centralized rules API**: `JABS_TeamRules` static class.
  - `isFriendly(teamA, teamB)` (legacy: same team only).
  - `isOpposed(teamA, teamB)` (driven by the per-team `opposes` list).
- **Call sites migrated**: team checks funnel through `JABS_TeamRules` (targeting scope, AI filters, aggro/alert/retaliation guards, and battler helper methods).

### Acceptance

- Default gameplay behavior is preserved with the default `config.jabs.json` team layout.
- Missing or invalid `data/config.jabs.json` fails fast with an actionable error message.

## Notes

- Follow-up work item: `unstarted/team-overlays.md` for auras/charms/summons style temporary or contextual affiliation changes.
