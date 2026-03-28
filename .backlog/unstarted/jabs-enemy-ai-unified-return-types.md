---
status: open
area: architecture
---

# `JABS_EnemyAI` unified return types

## Source

- `src/plugins/abs/core/__models/JABS_EnemyAI.js`

## Context

Some decision paths return a single skill id (`number`, `0`, or `null`) while others imply collections. Call sites must handle inconsistent shapes.

## Work

Audit all `JABS_EnemyAI` decision methods; normalize to one convention (e.g. always a collection, possibly length 0 or 1); update every caller and JSDoc.
