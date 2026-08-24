# `JABS_EnemyAI` unified return types

## Source

- `src/plugins/abs/core/__models/JABS_EnemyAI.js`
- `src/plugins/abs/ext/allyai/_models/JABS_AllyAI.js` (same `number[]` contract in the same change)

## Context

Some decision paths return a single skill id (`number`, `0`, or `null`) while others imply collections. Call sites must handle inconsistent shapes.

## Work

Audit all `JABS_EnemyAI` decision methods; normalize to one convention (e.g. always a collection, possibly length 0 or 1); update every caller and JSDoc.

## Notes

Shipped: `JABS_EnemyAI` and `JABS_AllyAI` both return `number[]` from `decideAction` and related decision helpers; core and ally `JABS_AiManager` phase-2 paths read `picks[0]`. `JABS_AI#decideAction` stub returns `[]`. `filterSkillsHealerPriority` final return normalized to an array.
