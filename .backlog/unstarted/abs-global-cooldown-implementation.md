---
status: open
area: feature
---

# ABS: implement global cooldown slot behavior (block other skills / fan-out)

## Severity

**Low** until designers rely on the slot; **medium** confusion if the key exists but does nothing.

## Gain

**Medium–high** for combat pacing: completes documented behavior on `J.ABS.Globals.GlobalCooldownKey`.

## Source

- `src/plugins/abs/core/_metadata/initialization.js` — `J.ABS.Globals.GlobalCooldownKey` JSDoc with TODOs (~365–375)
- Cooldown update paths: `JABS_SkillSlotManager`, `JABS_Battler` readiness / cooldown helpers

## Context

Documentation states a global cooldown slot for exceptional events that should block other skills. The two TODO options are: (1) global blocks other cooldowns, or (2) applying global cooldown hits all slots.

## Work

1. Pick semantics with design intent; document in `_annotations` / help.
2. Implement in slot update / skill execution gating.
3. Add regression scenario (skill A sets global → skill B blocked until expired).

## Notes

- Distinct from per-slot cooldown keys; touch tests if ABS harness covers slots.
