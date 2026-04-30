---
status: done
area: feature
---

# ABS: global cooldown (GCD) implemented

## Summary

The battler-wide global cooldown system is implemented and wired end-to-end (config, stamping, and gating).

## References (implementation)

- `src/plugins/abs/core/__models/JABS_GlobalCooldown.js` — core logic (system enable, whitelist, exemptions, overrides).
- `src/plugins/abs/core/_metadata/initialization.js` — `J.ABS.Globals.GlobalCooldownKey` + plugin parameters + notetag regexes.
- `src/plugins/abs/core/__models/JABS_InputAdapter.js` — input gating for GCD-subject skills.
- `src/plugins/abs/core/__models/JABS_Battler/readiness.js` — AI/readiness gating.
- `src/plugins/abs/core/managers/JABS_Engine.js` — stamps GCD timer on execution when applicable.
- `src/plugins/abs/core/_metadata/pluginCommands.js` — plugin command to apply/clear GCD on a party actor on-map.

## Notes

- Backlog file moved from `unstarted/` to `completed/` after confirming the above wiring exists.
