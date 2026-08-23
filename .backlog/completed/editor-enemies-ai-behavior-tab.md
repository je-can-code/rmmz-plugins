# Editor: Enemies "AI Behavior" tab (archetypes + decision pipeline)

## Source

- `jmz-data-editor/app/src/presentation/boards/enemies/EnemiesBoard.tsx` — host board; this work adds a third right-column tab alongside the existing Editor / Note tabs.
- `jmz-data-editor/app/src/presentation/boards/enemies/EnemyJabsAiTraits.tsx` — current chip grid for the 8 skill-choice traits. Kept; moved behind a "Show raw flags" reveal in the new tab.
- `jmz-data-editor/app/src/presentation/boards/enemies/EnemyJabsBattlerRoles.tsx` — current segmented controls for the 6 coordination roles. Same treatment as above.
- `jmz-data-editor/app/src/core/domain/valueObjects/jabs-ai-traits.ts` — `JabsAiTraits`, `JabsAttackTraits`, `JabsSupportTraits`, `JabsAiTraitDescriptions`.
- `jmz-data-editor/app/src/core/domain/valueObjects/jabs-battler-roles.ts` — `JabsBattlerRoles`, coordination / protection axis enums, `JabsBattlerRoleDescriptions`.
- `rmmz-plugins/src/plugins/abs/core/__models/JABS_EnemyAI.js` — **authoritative source for the pipeline ordering**: `decideAction` (lines ~109–164) runs support layer (cleanser → healer → buffer) → berserker check → attack layer (careful / executor / reckless / tactical) → generic random fallback. The pipeline-card copy must mirror this order verbatim or it lies to the author.
- `rmmz-plugins/src/plugins/abs/core/managers/JABS_AiManager.js` — leader / follower fan-out lives here (`decideActionsForFollowers`), not in the AI traits object. Pipeline copy should reflect that coordination decisions happen one frame **before** `decideAction`.

## Context

The flat chip grid we shipped (8 trait chips split into Attack / Support rows + 6 role chips on three axes) is fine **for surgery on a single enemy**, but it breaks down at scale and conveys nothing about runtime behavior:

1. **Authoring scale.** Chef Adventure currently has ~300 enemies. Hand-toggling 14 chips per row is busywork — and the busywork compounds when an entire enemy family (Reborn, Wisp, Skelly pairs) should all act like "Berserker Pack" or "Sniper" but each member has to be configured one row at a time. There is no preset, no copy-from-row, no family inheritance — just per-record manual clicks.
2. **No behavioral preview.** A row that shows `[Healer] [Cleanser] [Careful]` ON does not tell the author **what that combination does at runtime**, in what order it does it, or what happens when the support layer returns nothing and falls through to the attack layer. The author has to mentally simulate `decideAction` against the current chip state. With three layers and short-circuit early-exits, that's not realistic for non-plugin-author teammates.
3. **No diff / no archetype awareness.** There's no notion of "this enemy diverges from its family preset" — every record looks identical in shape regardless of whether it follows a curated archetype or is a one-off.
4. **The chip grid is the only view.** Power users may genuinely want the matrix-style flag panel; non-author teammates (writers, level designers tweaking encounters) almost certainly do not. There's no escape hatch in either direction today.

The chip grid is good as a **diff editor**. It is bad as a **default starting surface** for someone authoring a brand-new enemy from scratch or fitting an enemy into a family pattern. This work item builds the missing higher-level surface and demotes the chip grid to its correct role (power-user override view).

## Severity

**Low–medium today** — the chip grid technically works. **Medium ongoing** — every new enemy that goes in over the next year passes through this surface, so authoring throughput per record is what's at stake.

## Gain

**High over the campaign's content lifetime.** Three concrete wins:

1. Archetype picker turns "configure AI from scratch" into a single dropdown click for the ~80% of enemies that follow a curated pattern.
2. Pipeline cards give the author a **live readout** of "this is the order this enemy will consider its options at runtime" — turns the chip grid from arcana into something a non-author teammate can reason about.
3. The "Custom (was: Sniper)" affordance makes family inheritance + per-enemy deviation legible at a glance.

## Work

Four phases. Phases 1–3 ship together as a meaningful release (the full text-only AI Behavior tab). Phase 4 is a visual-polish backlog item against the same tab and can be deferred indefinitely without losing functional value.

### Phase 1 — Archetype picker

New file: `jmz-data-editor/app/src/presentation/boards/enemies/EnemyAiArchetypes.ts`.

Curated, **hand-authored** preset list. Not auto-classified from existing data. Each preset names a trait/role combination Jeremy intends to reuse across enemy families, with a one-sentence description:

| Slug | Traits | Roles | One-liner |
|------|--------|-------|-----------|
| `brute` | reckless, executor | — | Straight-up melee. Picks the strongest hit; never holds back. |
| `sniper` | careful, tactical | — | Picks high-damage low-cost skills; consults memory; avoids elementally-ineffective skills. |
| `mage-healer` | healer, cleanser, careful | — | Heals self / allies; removes ailments; otherwise plays defensively. |
| `berserker-pack` | berserker, executor | follower | High-damage all-in; group-aware; lieutenants of a leader. |
| `bodyguard` | careful | guardian | Defensive escort; soaks for an assigned ward. |
| `lone-wolf` | reckless | solo | Opts out of coordination entirely; pure 1v1 logic. |
| `buff-bot` | buffer, tactical | — | Sets up allies before the fight reaches them. |
| `sentinel-tank` | careful | sentinel, guardian | Holds position; defends a ward; high-survival skill picks. |
| `field-leader` | tactical, executor | leader | Coordinates followers; pulls high-value targets. |

The list is curated, not exhaustive — additions land via new rows here, not via a UI. The current set covers the patterns visible across CA's existing 300 enemies plus a couple of obvious unfilled slots (`field-leader`, `buff-bot`).

UI: a `Select` (or `Autocomplete`) above the trait/role surfaces with options:

- `Custom` (sentinel; default when nothing matches)
- One option per archetype slug, labeled by `displayName`, with the one-liner as MUI helper text or a hover tooltip via `JabsChipContent`-style wrapper

Behavior:

- Selecting an archetype: clears all trait / role flags on the enemy, then applies the preset's flags. **Single mutation**, single undo entry — important for keyboard-only authoring.
- After applying, the author can layer overrides freely via the (still-available) chip grid.
- "Divergence detection" runs on every render: compare current flag state to the last-applied archetype's preset. If they differ, the dropdown label shifts to `Custom (was: Sniper)` with a small "revert" icon button next to it that re-applies the original preset.
- If the flag state happens to **exactly match** another archetype, label switches to that archetype's name (no false "Custom" labeling when the author lands on a known pattern by hand).

Notetag persistence: **none**. The archetype slug is **derived** from the flag state; it does **not** get stamped onto the enemy note. That keeps the source of truth on the flags (where `JABS_EnemyAI` already lives) and avoids a second persisted field that can drift from its computed value.

### Phase 2 — Decision pipeline (text-only)

New file: `jmz-data-editor/app/src/presentation/boards/enemies/EnemyAiPipeline.tsx`.

Vertical stack of "decision cards" rendered as MUI `Card`s, one per pipeline step. Cards render conditionally based on the current flag state — inactive steps either don't render at all, or render greyed-out with "skipped (flag off)" copy. (Pick one and stay consistent; greyed-out + reason gives the author more learning signal, so prefer that.)

Card sequence, mirroring `JABS_EnemyAI.decideAction`:

| # | Card title | Active when | Copy template |
|---|-----------|-------------|---------------|
| 0 | **Coordination** | always | "This enemy {leads followers / follows the team leader / acts independently}. {Solo: ignores coordination entirely.}" |
| 1 | **Skill filter** | always | "Available skills are filtered for usability (cost, cooldown, valid targets)." |
| 2 | **Cleanser pass** | cleanser | "If any ally is afflicted with a negative state, picks the highest-priority cleansing skill and stops." |
| 3 | **Healer pass** | healer | "If self or any ally is below the healing threshold {wider when reckless}, picks the best healing skill and stops." |
| 4 | **Buffer pass** | buffer | "If allies are missing buffs this enemy can apply, casts the buff and stops." |
| 5 | **Berserker override** | berserker | "When this enemy drops below the berserker HP threshold, abandons strategy and uses the strongest skill in range." |
| 6 | **Attack layer** | careful ∨ executor ∨ reckless ∨ tactical | Composite copy describing which combination is active (see below). |
| 7 | **Generic fallback** | none of careful/executor/reckless/tactical | "No attack traits set — picks a usable skill at random." |

Attack-layer composite copy assembles a single paragraph from the active flags:

- `careful`: "filters elementally ineffective skills using memory"
- `executor`: "prefers the most elementally effective skill"
- `reckless`: "always uses a skill; never falls back to a basic attack"
- `tactical`: "prefers status-inflicting skills against unstatused targets"

So `[careful, tactical] ON` renders as: *"Filters elementally ineffective skills using memory, and prefers status-inflicting skills against unstatused targets."*

All copy generators live in a single `enemyAiPipelineCopy.ts` helper, pure functions taking `(traits, roles) => string`. Exhaustively unit-testable — no React, no MUI, no DOM.

### Phase 3 — "Show raw flags" reveal + tab integration

- Add a third tab to `EnemiesBoard.tsx`'s right-column `Tabs` strip: `AI Behavior`. (Confirm naming with Jeremy at implementation time — could also be `AI` or `Behavior`.)
- The new tab renders, top to bottom:
  1. Archetype picker (Phase 1)
  2. Pipeline card stack (Phase 2)
  3. A small `Switch` labeled "Show raw flags" — off by default
  4. When the switch is on, the existing `<EnemyJabsAiTraits>` + `<EnemyJabsBattlerRoles>` components render below the pipeline
- The chip grid stays **physically present in the source tree** — Phase 3 just moves where it's rendered.
- The Editor tab (where the chip grid currently lives) keeps everything else (stats, parameters, drops, etc.) but drops the AI section, since it has its own tab now. Confirm with Jeremy whether to also leave a "summary chip strip" on the Editor tab pointing to the AI Behavior tab.

### Phase 4 — Pipeline visual polish (deferred / optional)

This is the "real flowchart" version of Phase 2 and is **not blocking** for the rest of this work.

- Replace the vertical card stack with a 2D flowchart (ReactFlow or hand-rolled SVG) showing arrows between steps.
- Animate transitions when the author toggles a flag — affected cards slide / fade.
- "What changed" diff banner at the top of the tab after a toggle: *"Cleanser turned on. New step inserted before Healer pass."*
- Optional sidebar mini-map for boards that show this on small viewports.

Phase 4 is mostly **graphic polish**. The functional pipeline visualization is already complete after Phase 2; Phase 4 is the version that wins design-review screenshots.

## Tests

- **`enemyAiPipelineCopy.test.ts`** — pure-function copy generators. Cover every flag combination that appears in the curated archetypes plus an empty-flags case. Assert exact string output (paragraph composition is brittle and worth pinning).
- **`EnemyAiArchetypes.test.ts`** — round-trip: applying each preset and reading the resulting flag state matches the preset definition; divergence detection flips to `Custom` when one flag is changed; falls back to the matching archetype when the flag is changed back.
- **Component-light integration test** — render the AI Behavior tab with a fixture enemy, assert pipeline copy mentions the expected layers. Skip if Vitest + jsdom adds more friction than it pays back; pure-function tests cover the copy logic, which is the part most likely to regress.

## Maintenance note (deliberate, not a TODO)

**The pipeline-card copy is duplicated logic against `JABS_EnemyAI.decideAction`.** If Jeremy changes the pipeline order in the plugin (e.g. moves buffer ahead of cleanser, or inserts a new "elementalist" pass), the editor copy goes stale silently — the chips will still set the right flags, but the pipeline cards will describe an order that no longer matches runtime.

Mitigations considered:

1. **Extract a JSON descriptor in `rmmz-plugins`** that both projects consume. Doable, but adds a build artifact and a coupling between two repos. Probably overkill for a 7-step pipeline that changes maybe once a year.
2. **Shared test fixture** — a `pipeline-order.fixture.json` shipped in `rmmz-plugins/test/plugins/abs/fixtures/` that both projects test against. Cheaper than option 1; flags drift via a failing test rather than a stale visual.
3. **Just document it** — keep a comment in `JABS_EnemyAI.decideAction` reading "**if you reorder this, update `enemyAiPipelineCopy.ts` in `jmz-data-editor`.**"

Pick option 2 or 3 at implementation time. Option 1 is overengineering for the change cadence.

## Out of scope

- **Auto-classifying existing enemies** into archetypes ("which preset does Reborn 3 most resemble?"). Curated archetypes are an authoring shortcut, not a classifier.
- **Saving custom / user-defined archetypes** per project. The Phase 1 list is hand-authored. Project-local archetypes are a plausible follow-up but not required for the v1 ship.
- **Live runtime preview** ("show me this enemy fighting a target dummy with current flags"). Would require wiring the editor to a running JABS simulator. Not happening here.
- **Family-level inheritance** ("all Reborn enemies inherit the Brute archetype; deviations stamp at the row level"). Conceptually compelling, but adds a second persistence layer and a parent/child relationship to the data model. Worth its own backlog item if the archetype picker proves out and Jeremy wants to push further.
- **The visual flowchart polish (Phase 4)** — listed in this item for context but explicitly deferred. Ship Phases 1–3 and stop.

## Estimate

| Phase | Time |
|-------|------|
| 1 — Archetype picker (presets, dropdown, divergence detection) | ~3h |
| 2 — Pipeline cards + copy generators + unit tests | ~5h |
| 3 — Tab integration + "Show raw flags" reveal | ~1h |
| **Subtotal (text-only ship)** | **~9h** |
| 4 — Visual polish (flowchart, animation, diff banner) | ~6–12h |
| **Total if Phase 4 included** | **~15–21h** |

## Notes

- This work is a direct outgrowth of the JABS AI Traits / Roles section polish that landed in (TBD PR). The chip grid in its current form is **good enough** to ship and stays in place as the underlying surface; this item builds the higher-level skin on top.
- Coordination roles (leader / follower / guardian / ward / solo / sentinel) are owned by `JABS_BattlerRole` and **not** part of `decideAction`. The Coordination card in Phase 2 describes them but separately, since they fire at a different point in the AI loop (`JABS_AiManager.decideActionsForFollowers`).
- The archetype names listed above are first-draft suggestions; finalize with Jeremy at implementation time. Some plausible additions: `assassin` (executor + tactical + reckless), `summoner` (buffer + tactical), `support-priest` (healer + cleanser + buffer; pure-support no attack layer).