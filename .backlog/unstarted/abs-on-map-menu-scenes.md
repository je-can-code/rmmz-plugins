---
status: open
area: architecture
---

# JABS: on-map menu suite (party / status / equip / skills parity)

## Severity

**High** scope (many scenes/windows), **medium–high** player-visible inconsistency until done: quick menu stays map-attached while “full menu” still pushes `Scene_Menu` off the map.

## Gain

**High** consistency for JABS: one mental model (“menus are semi-paused on the map”), fewer surprises when closing menus (RNG-driven common events re-firing, window refresh/popup quirks, etc.).

## Source

- JABS quick menu / Start interception (map-attached, actors frozen, states still tick).
- Vanilla `Scene_Menu` stack and children (`Scene_Item`, `Scene_Equip`, `Scene_Skill`, `Scene_Status`, party/command flows) — today entered via quick menu → “full menu.”

## Context

Today there are two tiers:

1. **Quick menu** — opened from Start while JABS is active; intercepted so play stays **on the map** (semi-pause: player/enemies freeze; states and timers can still advance). Feels coherent with ABS combat on the same scene.

2. **Full menu** — typically reached through quick menu’s “full menu” / command; enters **`Scene_Menu`**, which takes the player **off the map**. Returning can expose odd behavior (e.g. RNG-based common events behaving as if re-entered, windows refreshing or popping).

The goal is **not** to duplicate vanilla polish for its own sake, but to **bring the full menu subtree onto the map** the same way the quick menu already is: party, status, equip, skills, and related flows should have **on-map** equivalents (custom scenes/windows or layered map UI), so JABS stays consistent end-to-end.

This is intentionally a **large lift** and may pair with future inventory/menu rework; track dependencies rather than blocking salvage/JAFTING work.

## Work

1. **Inventory current flows** — document entry points from quick menu → `Scene_Menu` and which child scenes must be replicated or wrapped (party, status, equip, skills; extend list as needed).
2. **Target architecture** — choose pattern: map-overlay scenes that never pop `Scene_Map`, shared chrome with quick menu, input routing, and compatibility with JABS freeze/semi-pause rules.
3. **Implement incrementally** — ship high-traffic screens first (equip/skills/status often cited); keep fallback to vanilla menu behind parameter until parity is acceptable.
4. **Regression pass** — verify map return no longer triggers the worst CE/RNG/menu quirks; document any engine limits.

## Notes

- Coordinate with any planned replacement of vanilla `Scene_Item` / inventory (separate initiative).
- Related vibe: `cross-plugin-prototype-hook-surface.md` may touch `Scene_Map` / menu hooks when audited.
