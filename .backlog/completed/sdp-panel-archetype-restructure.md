# SDP panel archetype restructure — align panel identities with ally AI presets

## Problem

575 panels, 293 with actual params, 95 unique stat combos. Higher-tier panels within a family change which params they touch — a tier 1 Enchanter panel has a different stat fingerprint than a tier 5 Enchanter panel. After mastering a dozen panels, the player is swimming in stat soup with no legible build identity. This violates the "become the build you loot" fantasy and the weapon-led identity pillar.

## Proposal

Map every SDP panel to one of **ten archetypes** that mirror the existing **ally AI presets** (Berserker, Guardian, Vanguard, War Priest, Skirmisher, Generalist, Cleric, Artillery, Wizard, Medic). These presets already describe "how a combatant fights" and players learn them from the ally AI menu — the SDP system borrows that literacy for free.

### Archetype stat signatures

| Archetype | Fantasy | Core stats (per rank) | Consistent tradeoff |
|---|---|---|---|
| **Berserker** | All-in melee aggressor | ATK, crit amp, TP regen | −DEF, −MDF |
| **Guardian** | Absorbs punishment | DEF, MDF, HP, aggro | −ATK, −speed |
| **Vanguard** | Reliable frontliner | ATK + DEF balanced, endurance | Modest values, no spikes |
| **War Priest** | Fight and sustain | ATK, HP regen, heal amplify | −crit, −magic |
| **Skirmisher** | Speed kills | AGI, evasion, hit rate, TP regen | −HP, −DEF |
| **Generalist** | Bit of everything | Mixed flat stat boosts | No spikes, no troughs |
| **Cleric** | Keep everyone alive | MDF, MP regen, heal power | −ATK, −aggro |
| **Artillery** | One big shot from far | ATK or MAT, crit rate, crit amp | −HP, −DEF |
| **Wizard** | Magic damage | MAT, MMP, magic cost reduction | −HP, −physical |
| **Medic** | Pure support | MDF, HP regen, MP regen, heal+ | −ATK, −MAT |

### Rules

1. **All tiers of a family keep the same param IDs** — only values scale. Tier 1 and tier 10 of a Berserker panel touch the same stats; tier 10 just has bigger numbers.
2. **Optional +1 stat at tier 3 and tier 5** — these are secondary stats within the archetype's identity, not random additions.
3. **Tradeoffs are archetype-consistent** — every Berserker panel costs some defense. Every Wizard panel costs some HP. The player can reason about the tradeoff without reading each panel.
4. **Reward skills at max rank embody the archetype** — a Berserker panel might unlock a rage skill, a Medic panel might unlock a party heal.
5. **Trophy loop preserved** — each panel keeps its unique name, flavor text, icon, and monster association. The *identity* is the archetype; the *trophy* is the specific panel.

### Mapping enemies to archetypes

Each enemy family gets classified by archetype based on the monster's combat behavior and thematic identity:

- Ghosty → **Artillery** (fragile, magical, offensive from range)
- Bearcat → **Berserker** (aggressive melee charger)
- Wolftrap → **Guardian** (tanky plant, high DEF)
- Needler → **Skirmisher** (fast, darting attacks)
- Kappa → **Wizard** (magical attacker near water)
- Cave Bat → **Skirmisher** (fast, evasive)
- Minitaur → **Vanguard** (balanced physical fighter)
- Wraith → **Cleric** (magical defense, ghostly resilience)
- Dryad → **War Priest** (nature hybrid, offensive with sustain)
- etc.

Full classification TBD — requires reviewing all 50+ enemy families against the ten archetypes.

## Benefits

- **Build identity is legible** — "I have 3 Berserker panels and 2 Skirmisher panels" tells a story. "I have 12 panels with assorted stats" does not.
- **Tradeoffs are readable** — player knows Berserker = glass cannon, Guardian = slow tank, without memorizing per-panel debuffs.
- **Stat growth doesn't obscure weapons** — archetype-consistent scaling means SDP reinforces the weapon family identity instead of drowning it in random buffs.
- **Players already know the archetypes** — the ally AI menu teaches them for free.
- **Panel rarity still matters** — Common Berserker panels give small Berserker stats; Legendary Berserker panels give massive ones. The identity is the same, the investment level differs.

## Work

1. **Define the ten archetype stat signatures** — exact param IDs, per-rank values, tradeoff params, and reward skill slots. Document in a spreadsheet or config reference.
2. **Classify every enemy family** — assign one of ten archetypes to each of the ~50+ families.
3. **Restructure `config.sdp.json`** — normalize all 575 panels so tiers within a family share the same param IDs with scaling values. Start with tier 1 panels, then propagate.
4. **UI hint (optional)** — add archetype label or color-coding to the SDP scene so the player can see "this is a Berserker panel" at a glance without reading every stat line.
5. **Playtest pass** — verify early-game panel choices feel distinct and mid-game builds have coherent identity.

## Related

- Ally AI presets: `src/plugins/abs/ext/allyai/_models/JABS_AllyAI.js` — the ten presets that define the archetype vocabulary
- `weapon-tier-hardness-damage-balance.md` (cancelled and deleted 2026-08-23; in git history) — SDP growth vs weapon relevance; archetype-consistent scaling helps here
- [`design-contract.md`](../../../ca/docs/design-contract.md) — "weapon-led identity" and "trophy loop" pillars