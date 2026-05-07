---
status: open
area: feature
---

# JAFTING socketing extension (gem / rune slots on crafted or refined gear)

## Source

- [`src/plugins/jafting/ext/refine/`](src/plugins/jafting/ext/refine/) (equipment augmentation, `RPG_EquipItem` / trait flows)
- [`src/plugins/jafting/core/`](src/plugins/jafting/core/) (hub scenes, shared windows)
- Reference patterns: refinement session models under [`ext/refine/__models/`](src/plugins/jafting/ext/refine/__models/)

## Context

Refinement already pushes traits and math onto equipment. A **socketing** layer would let players attach modular modifiers (gems, runes, cores) to eligible pieces—often the natural companion to crafting (“make the sword” + “slot the gem”). Scope should stay **JAFTING-first**: sockets declared on recipes or refinement tiers, consumption rules, and UI that fits existing JAFTING scenes rather than inventing a parallel equipment editor.

## Severity

**Low–medium** as optional content; **medium–high** if Chef Adventure or another consumer plans socket-driven builds.

## Gain

**High** build variety and horizontal progression without exploding raw stat curves on every base item.

## Work

- Design **data model**: per-equip slot count, socket types, compatibility tags, stacking vs unique gems, persistence through save/load (`SerializableRegistry` for any new runtime classes).
- **Notetag / metadata** surface on items, recipes, or refinement outcomes declaring socket eligibility and caps.
- **Scene/window work**: socket management from JAFTING refine or a dedicated sub-scene; keep complexity within decomposition guidance in `jafting-heavy-scenes-decomposition.md`.
- **Interop**: avoid fighting J-SDP or vanilla param curves—socket bonuses should be explicit additive/multiplicative channels documented in plugin help.
- Vitest or fixtures for socket apply/remove and save round-trip.

## Notes

- If salvage (`jafting-ext-salvage.md`) lands first, define policy for whether sockets are destroyed, refunded, or preserved when salvaging.
