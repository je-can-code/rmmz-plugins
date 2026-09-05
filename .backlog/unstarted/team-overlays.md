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

## Definition of done

- [ ] an effective-team resolver exists on `JABS_Battler`, and every relationship question still goes
      through `JABS_TeamRules` — no caller compares raw numeric team ids to work around the overlay
- [ ] the overlay is runtime-only: set one, save, reload, and the battler is back on its true team.
      The whole design rests on the primary id staying the persisted truth, so a leak into the save
      is the failure that matters
- [ ] unit tests cover the resolver with an overlay on the source, an overlay on the target, and
      neither
- [ ] in-game: charm an enemy. Allies stop targeting it, it turns on its former teammates, and when
      the charm ends both flip back
- [ ] with no overlay set anywhere, behavior and `data/config.jabs.json` are unchanged — this has to
      be inert until used
