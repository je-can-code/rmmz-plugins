---
status: open
area: feature
---

# Ally dodge-skill AI

## Source

- `src/plugins/abs/ext/allyai/managers/JABS_AiManager.js` (ally AI dodge hook; line numbers drift)

## Context

Allies do not use dodge skills today. The AI should decide when dodging is appropriate (e.g. low HP, readable incoming threat).

## Work

Add dodge-skill evaluation to the ally decision flow; exercise edge cases around timing and skill availability.
