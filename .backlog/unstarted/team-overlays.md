# Team overlays (temporary / contextual affiliations)

## Context

Teams 1.0 assumes a battler belongs to a single numeric team id at any given time.
This is sufficient for most faction layouts, but a number of common mechanics want temporary or contextual relationship
changes without permanently reassigning the underlying team id:

- **Charms**: temporarily treat a battler as allied with the caster (hard swap or time-bound swap).
- **Summons**: spawned battlers that inherit the summoner’s team (and possibly retain summon-specific behavior).
- **Auras / disguises / reputation**: “treated as friendly/opposed” under specific contexts (healing only, aggro only,
  guards only, etc.).

## Goals

- Keep the **primary** `teamId` as the stable “true” team (save-friendly, note/comment-driven, easy tooling).
- Introduce a **minimal overlay layer** that can alter relationship checks without converting every caller to “sets of
  teams”.
- Ensure relationship checks remain deterministic and easy to reason about.

## Work

### Approach A: hard override (simple, good for charms/summons)

- Add a runtime-only `teamIdOverride` (or similar) on `JABS_Battler`.
- `effectiveTeamId()` resolves override first, then primary.
- `JABS_TeamRules` adds overloads that accept battlers (or helpers in callers) and compare effective ids.

### Approach B: contextual exceptions (powerful, good for auras/disguises)

- Add a runtime-only “overlay rules” concept:
  - `treatAsFriendlyWithTeams` (array of team ids)
  - `treatAsOpposedToTeams` (array of team ids)
  - optional `contexts` scoping (ex: `damage`, `healing`, `aggro`, `targeting`, `alert`)
- `JABS_TeamRules` gains context-aware methods (or a single `relationship(source, target, context)` resolver).

### Acceptance

- Charm and summon mechanics can be implemented without changing the persisted primary team id.
- Existing team config (`data/config.jabs.json`) remains valid; overlays are optional and do not affect behavior unless
  set at runtime.
- No “team set explosion” in call sites; callers still ask `JABS_TeamRules` the relationship question.
