---
status: open
area: architecture
---

# Generalize skill transforms across notes and equipped-slot resolution

## Severity

**Medium-high.** The feature is compelling for CA content authoring, but it cuts across equipped-skill resolution, HUD/menu presentation, and any runtime path that reads raw slot ids directly.

## Gain

**High** design flexibility and long-term content leverage. Enables note-driven upgrades like ring/state/actor affinity transforms (`fireball -> super fireball`, `pistol shot -> empowered shot`) without duplicating skillslots or authoring special-case slot logic per feature.

## Source

- `src/plugins/abs/core/objects/Game_Battler.js`
- `src/plugins/abs/core/objects/Game_Actor.js`
- `src/plugins/abs/core/__models/JABS_SkillSlot.js`
- `src/plugins/abs/core/windows/Window_AbsMenuSelect.js`
- Runtime consumers of equipped skills via `Game_Battler#getEquippedSkillId()`
- Broad note-source collectors such as `getAllNotes()` / actor/class/equips/states note aggregation

## Context

Offhand selection work exposed a broader design opportunity: note-bearing sources should be able to temporarily or passively transform one equipped skill into another.

Examples discussed:

- equip a fire ring and `fireball` becomes `super fireball`
- gain a short-lived state and `pistol shot` becomes `super pistol shot`
- an actor/class affinity causes `waterstrike` to resolve as `super waterstrike`

The key observation is that this is **bigger than offhand**. JABS currently stores raw equipped skill ids on slots and many systems consume those ids directly. A generic transform system therefore needs a clean notion of:

1. **base equipped skill id** — what the player actually has equipped.
2. **resolved/transformed skill id** — what executes right now after note-driven transforms.

This must be designed carefully so transforms do not accidentally corrupt slot bookkeeping, skill-learning checks, upgrade logic, HUD/menu rendering, or cooldown/combo behavior.

## Work

1. Add and document a generic transform tag shape, currently expected to be:
   - `<skillTransform:[BASE, OVERRIDE]>`
2. Decide eligible note sources:
   - actor
   - class
   - equips
   - states
   - any other `getAllNotes()` contributors that should participate
3. Implement a centralized resolver that maps a base equipped skill id to a transformed skill id without mutating the slot's stored base id.
4. Audit equipped-skill consumers and decide which should read:
   - base skill id only
   - resolved/transformed skill id
5. Decide UI policy:
   - execution-only transforms
   - or execution + HUD/menu/icon/name presentation updates
6. Define precedence when multiple sources transform the same base skill.
7. Verify interactions with:
   - offhand pin/default resolution
   - guard / dodge / combat slots
   - combo id checks
   - cooldown routing
   - AI skill use
   - quick menu / input frame presentation

## Notes

- This should be implemented as a **generic equipped-skill resolution layer**, not as an offhand-only special case.
- Offhand work may seed some of the helpers, but the full generic rollout should be treated as its own focused pass.
- Related current discussion: offhand source-based eligibility and temporary state-driven upgrades for pistol/gun family behavior in CA.
