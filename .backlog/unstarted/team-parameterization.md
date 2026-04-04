---
status: open
area: architecture
---

# Team parameterization (opposing / friendly)

## Source

- `src/plugins/abs/core/__models/JABS_Battler/_reference.js` (team-related constants; line numbers drift)

## Context

Opposing and friendly teams are hardcoded. Custom team layouts need a data-driven definition.

## Severity

**Medium** for projects needing non-binary factions; **low** for standard ally/enemy setups.

## Gain

**High** for extensibility; **medium effort** — many call sites in `JABS_Battler` reference and AI.

## Work

Move team definitions into plugin parameters or a registry; update every team-check call site to use the configurable source.
