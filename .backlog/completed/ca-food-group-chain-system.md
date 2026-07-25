---
status: done
area: completed
completed: 2026-06-09
---

# Chef Adventure: food group chain system

> **Progress (2026-06-02):** Plugin work **1–4 shipped** (`J-ABS` expire chains + `<stateDuration>`,
> `J-ABS-FOOD`, `J-HUD-FOOD`, `<overstuffedImpervious>`). CA chain **states** 251–278, 281–282 ✅.
> **Remaining (content):** recipe/crafting/unlock redo — see
> [ca-food-recipes-crafting-redo](ca-food-recipes-crafting-redo.md) (family recipe books, ingredient
> lanes, crafting list). Interim `<food:TYPE>` + playtest still tracked as **P4-0** in
> `ca/docs/sdp/work-items.md`. Authoring tables: `ca/docs/food/food-chain-durations.md`.
> Group keys in CA data: `carb`, `sweet` (not grain/confection).

## Severity

**High** design debt — current food system (heal numbers + 7 RNG dice, dominant outcome is a
debuff state) actively undermines CA's identity as a game about cooking and crafting.
Food is the primary active healing source for ~5 hours of play and should feel strategic.

## Gain

**High** on all fronts: player-facing identity, crafting relevance, dungeon preparation depth,
and lore coherence. Unlocks a coherent Kobold "Field Medic" SDP mastery design (previously
P3-11, was blocked by the food system being undefined).

## Source

- `ca/chef-adventure/data/Items.json` — food items id 151–182
- `ca/chef-adventure/data/States.json` — Well Fed (81), food states 82–88
- J-ABS state processing (state expiry hooks, state application pipeline)
- J-ABS input system (`JABS_Button`, skill slot assignment, cooldown tracking)
- `J-HUD-InputFrame` — current input slot rendering extension

## Context

The current food model applies "Well Fed" (10-second trailing regen) plus a random roll
against 7 food states simultaneously. State 87 "Wanting" (a debuff: ATK ×0.75, MMP ×0.75)
has the highest chance on most recipes. Net result: eating food usually gives a debuff.
The food-specific states (82–88) have no recipe identity — every dish rolls against all 7.
States all expire after 600 frames (10 seconds), which is too short to matter strategically.

Additionally, food and tools (hookshot, bombs, etc.) share the same "tool" slot (Triangle).
Swapping between them mid-dungeon requires opening the menu, which is disruptive and
actively discourages the strategic food timing the chain system depends on.

Desired model: each recipe belongs to a food group. Eating triggers a deterministic
multi-phase state chain for that group. The chain encodes a natural "energy arc" (well fed →
peak → tail → clear) that is readable at a glance via a dedicated HUD element.
Food gets its own dedicated button (R2), separate from tools (Triangle).

## Design

### Food group chains

| Group | Well Fed (~) | Peak (~) | Tail (~) |
|---|---|---|---|
| Protein | Well Fed (Protein) 3 min | Pumped 1 min | Hangry 2 min |
| Vegetable | Well Fed (Veggie) 2 min | Refreshed 2 min | Lightheaded 2 min |
| Fruit | Well Fed (Fruit) 1 min | Energized 4 min | Crashing 1 min |
| Carb | Well Fed (Carb) 3 min | Fortified 5 min | Carb Coma 1 min |
| Dairy | Well Fed (Dairy) 3 min | Focused 3 min | Foggy 3 min |
| Sweet | Well Fed (Sweet) 30 s | Hyper 2 min | Gassy 1 min | ← intentionally short (sugar rush) |

Eating mid-chain (any group): triggers **Overstuffed** chain instead.
Overstuffed chain: Overstuffed 5 min → Bloated 3 min → clear.
Eating again WHILE Overstuffed: refreshes the Overstuffed duration; may also stack
(increasing severity or duration further — tune during implementation).

Only ONE food chain state is active at a time.

### Tail state philosophy

Tail states are thematically coherent, not purely negative. Each maps to a real-world food
experience ("Hangry", "Sugar Crash", "Food Coma") so the state name is self-documenting at
the menu level. Some builds may deliberately surf tail states (e.g. a berserker riding
Hangry: high ATK, lower DEF). Tails are "the meal is wearing off" — not punishment.

### Food slot vs tool slot

Food items and tools (hookshot, bombs, etc.) are categorically different use cases:
- **Tool (Triangle)**: situational/contextual — you pick the right tool for the room.
- **Food (R2)**: dungeon maintenance rhythm — always available, always relevant.

R2 gets a new `JABS_Button` binding, its own cooldown slot, and independent input tracking.
`itypeId` is fixed by RMMZ and determines scene tab placement only — it cannot be used to
distinguish food from tools at runtime. **Item categorization uses a notetag instead:**
- `<food>` on any item → routes to the food slot (R2).
- Items without `<food>` remain tools routed to Triangle as before.

### HUD: dedicated food chain bar (`J.HUD.EXT.FOOD`)

A new HUD extension, separate from `J.HUD.EXT.INPUT`, owns all food-related display:
- **Food item icon** — what is currently loaded in the R2 food slot.
- **Segmented chain bar** — a single bar divided into three proportional segments
  representing the Well Fed / peak / tail durations of the active food chain.

The bar drains in real time. Segment proportions encode the food group's energy curve
visually — Fruit has a tiny Well Fed sliver then a huge Energized block; Protein has a
dominant Well Fed front that tapers into a smaller Hangry tail. The shape IS the identity:

```
Protein  [████████████████  ████  ████████████]  (3m / 1m / 2m)
Fruit    [█  ████████████████████████████  ████]  (0.5m / 4m / 1m)
```

Each segment uses the food group's color tone (warm red for Protein, green for Veggie,
gold for Fruit, etc.) so the active group is readable at a glance without text.
Bar is empty when no food chain is active.

`J.HUD.EXT.INPUT` does NOT need to know about R2 — `J.HUD.EXT.FOOD` owns it entirely.
Candidate screen position: top-left (currently empty).

### Kobold Field Medic SDP mastery (replaces P3-11 "item-use splash")

All food items are already scoped to all allies — the mastery cannot add "sharing" since
food heals and states already apply to everyone. The mastery instead operates on
**food chain timing and resilience**:

- **Overstuffed immunity** — eating food while mid-chain does NOT trigger the Overstuffed
  chain. The Field Medic knows how to pace meals and can re-feed the party freely.
- **Tail state rescue** — eating food while in a tail state (Hangry, Crashing, etc.)
  snaps the party back to Well Fed for the new food group, instead of stacking Overstuffed.
  "The Field Medic knows *when* to re-feed."

Together these give the Field Medic mastery a clear loop identity: managing the party's
food chain timing, preventing the worst self-inflicted outcome, and extending dungeon
endurance through strategic re-feeding. The R2 dedicated food button makes this loop
tactile — it is a rhythm the player actively manages.

### Existing states mapping

Agitated (82) → Protein tail (Hangry; rename/retune in place or new id).
Refreshed (85) → Vegetable peak (keep, retune duration).
Gassy (84) → Confection chaos (keep, reposition in chain).
Overstuffed (83) → Overstuffed chain anchor (keep concept, retune).
States 86 (Satisfied), 87 (Wanting), 88 (Leaky) → retire or repurpose.
All food states should be relocated to a contiguous block in the DB for readability.

## Work

1. **~~`<applyStateOnExpire:[STATE_ID, CHANCE]>`~~** — ✅ shipped in J-ABS core.
   by J-ABS. When the state expires via natural frame-counter expiry (new `onExpire` hook),
   apply STATE_ID at CHANCE%. Does NOT fire on forced removal (dispel, KO, etc.) — only on
   natural expiry. General-purpose: useful beyond food (burn → ash debuff on expiry, etc.).
   This is the mechanical backbone of the entire chain system.
   Add a cookbook entry to `_annotations.js` once shipped.

2. **~~New `<food:TYPE>` notetag + R2 food slot~~** — ✅ shipped. Remaining: add `<food:TYPE>` on each item 151–182.
   new food slot. Wire R2 as a new `JABS_Button` with its own cooldown, input tracking,
   and skill slot assignment. Update item use dispatch to respect slot routing.
   R2 is already a bindable button in the remap system — just needs a proper display
   label (e.g. "Use Food") so it appears correctly in the remap UI.

3. **~~`J.HUD.EXT.FOOD` extension~~** — ✅ shipped (vertical strip, phase labels, segmented bar).
   side of the screen. From top to bottom:
   - Food item icon (what is loaded in R2).
   - Name of the food last eaten.
   - Three state labels listed vertically (Well Fed / $PEAK / $TAIL), with the currently
     active phase bolded, highlighted, or arrow-marked so it is readable at a glance.
   - Segmented chain bar that gradually depletes, proportional to each phase's duration.
   Both the text labels and the bar provide the same information — players can read either.
   The Overstuffed chain renders as a two-segment bar in a distinct sickly color so it is
   visually distinct from a normal food chain at a glance.
   **Chain metadata preloading:** when a Well Fed state is applied, the HUD reads the full
   chain definition (phase state IDs, durations, group color) from tags on the Well Fed
   state itself. This preloads everything into memory upfront so the HUD always has the
   complete chain picture without re-reading notetags on every frame.
   Consider tags like `<foodChainPeak:STATE_ID>`, `<foodChainTail:STATE_ID>`,
   `<foodGroupColor:HEX_OR_KEY>` on each Well Fed variant state.
   `J.HUD.EXT.INPUT` unchanged; it does not render the food slot.

4. **~~Kobold Field Medic plugin hook~~** — ✅ `<overstuffedImpervious>`. Mastery **state** = P4-2 content.
   rescue as tag-driven behaviors (exact tag form TBD; likely passive state on the mastery
   skill that modifies how food application resolves mid-chain).

5. **~~Retune/add food chain states in DB~~** — ✅ states 251–278, 281–282 with `<stateDuration>`, `<foodChain>`, traits.
   all chain phases not yet present: Well Fed variants ×6, Pumped, Energized, Fortified,
   Focused, Hyper, Hangry, Lightheaded, Crashing, Food Coma, Foggy, Bloated.
   Relocate all food states to a contiguous block for DB readability.

6. **Retune all food items (151–182)** — ⏳ superseded in scope by
   [ca-food-recipes-crafting-redo](ca-food-recipes-crafting-redo.md) (full crafting + unlock redo).
   Interim: `<food:TYPE>` on items; drop 7-dice RNG (mostly done).

7. **Recipe identity audit** — ⏳ same; family-first audit lives in redo backlog item.

## Notes

- `<applyStateOnExpire>` is the gate for the entire chain system. Design the DB states first
  so their ids are stable before wiring the tag.
- R2 food slot and `J.HUD.EXT.FOOD` are tightly coupled — implement together.
- The Field Medic mastery (work item 4) is P4-2 content authoring once the plugin hooks
  from items 1–4 exist. The mastery state will carry whatever tag expresses immunity/rescue.
- Food group icon strategy: each group uses a consistent color tone across its chain icons
  so the active group is readable at HUD icon size from color alone.
- `J.HUD.EXT.INPUT` does not render R2 — food slot display belongs entirely to `J.HUD.EXT.FOOD`.
- **Ingredient scarcity audit** — food is currently too plentiful (ingredients are easy to
  obtain). A 6–10 minute chain commitment needs to feel earned. Ingredients should be
  meaningfully scarce so players think carefully about which food to craft and when to eat.
  This is content tuning, not plugin work, but it is a prerequisite for the chain system
  to feel impactful at all.
