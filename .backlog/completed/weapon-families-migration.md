# Weapon families migration — 18 lots, IDs 1–180

## Source

- Design docs: [`/ca/docs/weapons/`](../../../ca/docs/weapons/) — all 18 lots fully locked
- Skills data: `ca/chef-adventure/data/Skills.json`
- Weapon data: `ca/chef-adventure/data/Weapons.json`
- Proficiency config: `ca/chef-adventure/data/config/config.proficiency.json`

## Context

All 18 weapon subgroups across 6 families are fully designed and locked in `/ca/docs/weapons/`. This item is **pure execution** — no design decisions remain. The goal is to migrate the game data to match the planned 10-row skill lot schema (IDs 1–180) and wire up proficiency, weapon notetags, and the save layer.

**Six families, three subgroups each, 10 skill rows per subgroup = 180 skills in one contiguous weapon band.**

| Family | IDs | Subgroups |
|---|---|---|
| Blade | 1–30 | sharp (1–10) · beast (11–20) · twist (21–30) |
| Spear | 31–60 | pierce (31–40) · mortar (41–50) · rend (51–60) |
| Gun | 61–90 | gunfu (61–70) · conduit (71–80) · boomstick (81–90) |
| Axe | 91–120 | buffer (91–100) · cleave (101–110) · breaker (111–120) |
| Wand | 121–150 | aura (121–130) · saturation (131–140) · lexicon (141–150) |
| Fist | 151–180 | flow (151–160) · gore (161–170) · dirty (171–180) |

## Severity

**High** — the current skill IDs are scattered legacy assignments; the new lot schema is the foundation for proficiency depth, content authoring, and balanced weapon identity across the full game.

## Gain

**High** — players get coherent, distinct weapon identities with escalating prof ladders instead of the current patchwork. Authoring is finally predictable: ID band tells you which weapon and which row.

## Work (ordered — prerequisite first)

### 0. Relocate non-weapon skill bands ✅ pre-completed

Current weapon skills cloned to **701–780**; Jerald/Rupert exclusive skills cloned to **801–899**. The safety net is in place. Thread 1 will obliterate IDs 1–200 entirely and begin authoring blade lots from a clean slate — no partial migration, no legacy cruft.

### 1. Author open per-subgroup items

Each subgroup doc has deferred "Open (migration)" items — state IDs, damage formulas, CD values, exact hitbox parameters. Resolve these family-by-family before scripting. See individual docs under `ca/docs/weapons/families/`.

### 2. Rewrite `Skills.json`

180 skill rows in IDs 1–180 per the lot schemas. Each row needs: name, formula, hitbox tags, `<freeCombo>` / `<direct>` / connect semantics, `<skillId>` / `<offhandSkillId>` cross-references, `<skillExtend>` for prof rows, `hideFromJabsMenu` on prof rows.

### 3. Rewrite weapon notetags in `Weapons.json`

Every weapon entry gets `<skillId:N>` (row 1 starter) and `<offhandSkillId:N>` (row 4/5 offchain starter) per the lot docs. Named weapon drops in `main.md` drive content placement.

### 4. Rewrite `config.proficiency.json`

New `JR-*` keys per subgroup. Each lot has a main skill + subskills list, unlock thresholds in strict numeric row order (row 6 before 7 before 8…), and per-lot policy on whether secondary-only rows count offchain usage only.

### 5. Save migration / compat plan

Old prof keys and skill IDs in existing saves will be stale after the migration. Decide: wipe prof progress, remap keys, or gate behind a version flag. Document and execute.

### 6. Tutorial & CMS copy pass

Any tutorial or CMS text referencing weapon skill names or IDs needs updating after the rename.

## Notes

- Per-subgroup open items are tracked in the individual family docs — see `ca/docs/weapons/families/<family>/<subgroup>.md`.
- The design principle "viable ≠ forgiving" must hold through balance tuning — do not smooth out subgroup downsides to make them "safer."
- JAFTING socketing (`jafting-ext-socketing.md`) may add stat gems later — keep weapon skill formulas clean enough to stay coherent when socket bonuses land on top.
- The old `weapon-tier-hardness-damage-balance.md` backlog item (SDP % panels fixing weapon relevance structurally) is now closed — this item is the content/identity pass, not a balance patch.
