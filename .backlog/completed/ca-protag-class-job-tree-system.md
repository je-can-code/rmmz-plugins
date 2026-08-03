---
status: done
area: architecture
---

> **Brainstorm complete (2026-06-13):** Class trees for both protagonists fully sketched.
> Design doc: [`ca/docs/classes/main.md`](../../ca/docs/classes/main.md)

# Chef Adventure — protag class / job tree system (SD3-style)

## Source

- `ca/docs/sdp/archetype-mapping.md` — ten combat archetypes, build = weapon × panel investment, mastery model
- `ca/docs/weapons/families.md` — six weapon families on **Jerald and Rupert only**; elementals use exclusive weapon types + separate kits
- `.backlog/unstarted/sdp-panel-archetype-restructure.md` — panel stat signatures per archetype
- Weapon skill-lot planning (`ca/docs/weapons/skill-lots.md`) — **1–180** = combat grammar only; not role verbs (heal, shield, etc.)

## Context

SDP panels map enemies to **ten archetypes** (Berserker, Medic, Cleric, Wizard, …) with stat tradeoffs and subgroup masteries. **Weapons** (18 subgroups, in progress) define **how** Jerald/Rupert fight in ABS — overwhelmingly **kill** grammar.

**Gap:** Without a separate **role / class** layer, cross-archetype panel investment is mostly stat salad:

- **Jerald** (bruiser, self-buff killer) + **Medic** panels → no medic verbs from weapon kit; "why would I?"
- **Rupert** (backline boom mage) + **Berserker** panels → ATK/LST stats on MAT body unless something else provides the fantasy
- Same for **4 elementals**: only **1/6** naturally reads as support; **5/6** party members have no reason to invest **Medic / Cleric / …** provider panels if panels never unlock **role skills**

**Not** proposing archetype skills on **weapon rows**. The missing piece is an **independent system** — likely leveraging **RMMZ native `Class` / class-change** (or equivalent) — that teaches **role skill sets** per job.

**Direction (design discussion, 2026-06):** **Seiken Densetsu 3 / Trials of Mana**-style **per-character job trees**, not "pick any of 10 archetypes freely on every actor":

- **Jerald** starts **Swordsman** (frontliner default) → fork **offense vs protection** (e.g. Mercenary ↔ Myrmidon) → tier-3 specials (e.g. Berserker / Paladin / convergent **Hero**)
- **Rupert** starts **Mage** (backliner default) → fork **Wizard ↔ Cleric** → tier-3 (e.g. Summoner / War Priest / convergent **Sorcerer**)
- **Respec** allowed (cost / criteria TBD)
- Branching may widen later (not strictly 1→2→2)
- **Elementals:** separate class trees or fixed role kits — support lives here **and** on support-class paths for protags

**Timing:** **Not** blocking immediate **weapon lot** migration (**1–180**). **Is a strict ship blocker** for coherent SDP + party build identity: P4-1 **`%`-only panels** assume actors can **change base params** via class/job (Jerald Vanguard → Paladin/Sorcerer, Rupert Mage → Cleric/Wizard forks, elementals TBD). Without this, off-archetype panel investment is stat salad with no pivot path.

## Work

1. **Design doc** (in `ca/docs/`, cross-linked from `archetype-mapping.md`):
   - **Three axes:** Class (role verbs) × Weapon (ABS grammar) × SDP (enemy-flavored stats / mastery on-path or with off-path tradeoffs — TBD)
   - ASCII trees for **Jerald** and **Rupert**; placeholder tree policy for **elementals**
   - Convergence classes, respec rules, unlock **criteria** (level, story, SDP spend, boss, quest — pick primary)
   - Explicit: **starting class ≠ identity lock**; **weapon family ≠ class** (Swordsman is not wtype 1-only)
2. **Map ten SDP archetypes → class branches** (which panels/masteries are on-path per job; off-path policy)
3. **Skill ID bands** — class skills vs weapon **1–180** vs character kit (**201+** / relocate Jerald **101–144** per weapon migration plan); no overlap
4. **RMMZ data:** `Classes.json`, `Actors.json` class-change flow, skill learning, equip rules (can Medic Jerald still equip axe wtype?)
5. **Runtime integration:** JABS menu (class vs weapon skills), proficiency policy for class skills, CMS copy, tutorial beat at first fork
6. **jmz-data-editor** (if needed): class/skill authoring surfaces — defer until data shape is stable
7. **Acceptance:** A player on **Myrmidon → Paladin** (or Rupert **Cleric** branch) has **skills that do medic/cleric things**; Medic SDP panels on that build have **verbs to amplify**, not vibes alone

## Prerequisites

- **Weapon families migration** (`weapon-families-migration.md`) must complete first. The current Jerald/Rupert exclusive skills occupying IDs 101–199 are **not being relocated** — they are being deleted entirely to make room for axe (91–120) and wand (121–150) weapon lots. Class-specific skills will be authored from scratch as part of this item, likely bearing little resemblance to what exists today.

## Notes

- Weapon redesign receipt continues under `ca/docs/weapons/` — **staff / wand / tome** = protag **kill / sustain-cast** mindsets; **not** primary heal delivery
- Related: [`sdp-panel-archetype-restructure.md`](sdp-panel-archetype-restructure.md) (panel stat normalization); [`ca-food-recipes-crafting-redo.md`](ca-food-recipes-crafting-redo.md) (Cleric **PHA** / Kobold **Field Medic** food rhythm); [`ca/docs/sdp/panel-parameters-cheatsheet.md`](../../ca/docs/sdp/panel-parameters-cheatsheet.md) §11 (**%-only panels** — this item is the required base-growth counterpart)
- Party size: 6 (2 protags + 4 elementals) — class system must address **all six**, not only Jerald/Rupert
- Open: 1:1 **ten archetypes = ten classes**, or fewer playable jobs with archetypes as panel flavor inside branches
