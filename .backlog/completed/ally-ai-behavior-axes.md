---
status: done
area: feature
---

# Ally AI: behavior axes (toggles) vs exclusive modes (playbooks)

## Source

- `src/plugins/abs/ext/allyai/_models/JABS_AllyAI.js` — `JABS_AllyAI.modes` and ally `decideAction` (today: discrete mode keys).
- `src/plugins/abs/ext/allyai/managers/JABS_AiManager.js` — phase flow for allies vs leaders/followers.
- `src/plugins/abs/core/__models/JABS_EnemyAI.js` — enemy traits remain **skill-choice** semantics (not a substitute for ally posture).
- `src/plugins/abs/core/__models/JABS_BattlerRole.js` / `<aiRole:…>` — coordination roles (leader/follower/guardian/ward/etc.); orthogonal to mode-vs-axis discussion but relevant for **where** an ally stands vs **what** they cast.

## Context

Historically, ally behavior started as a single implicit profile (“support when needed, offense otherwise”). That later became **`JABS_AllyAI.modes`**: a **small closed set of string keys** (`do-nothing`, `basic-attack`, `variety`, `full-force`, `support`) that mainly drive **which skill** gets chosen in phase 2. That works as a compact player-facing menu, but it does **not** decompose the real degrees of freedom (risk posture, support priority, spacing / formation appetite). Expanding “personality” by adding more **exclusive** modes tends toward either an **exploded enum** (`support-aggressive`, …) or **hidden multi-axis** semantics baked into one label.

Design discussion (thread): move toward **orthogonal axes** implemented as **toggles, sliders, or paired poles** instead of one playbook selector. Illustrative axes called out in conversation:

- **Reckless ↔ careful** — appetite for trading hits vs preserving HP; natural hook for defensive interrupts (dodge/guard tuning) **without** overloading enemy **`JABS_EnemyAI`** `careful`/`reckless` (those names mean **element/memory skill choice** on enemies, not map posture; ally-side naming may want distinct labels to avoid author confusion).
- **Support ↔ offense** — weight on cleanse/heal/buff branches vs damage lines (closest to the old “hybrid” fantasy).
- **Backline ↔ frontline** — follow distance, leash, willingness to body-block or kite — primarily **movement / formation**, decoupled from skill-picker logic.

**Composable axes** allow combinations (for example support-heavy **and** frontline guardian-like play) without minting a new mode string per fantasy. Optional **named presets** (“Guardian”, “Artillery”) can still **snap** axes to defaults for authors who prefer a short label.

**Enemy AI traits** and **structural roles** remain imperfect homes for dodge/guard tuning by themselves: traits are skill-centric; roles handle targeting/coordination. Defense posture should stay a **parallel layer** with its own data or profile knobs, optionally **scaled** by axis values rather than encoded inside `full-force` vs `support` alone.

## Severity

**Medium** — touches player-facing ally configuration, save/plugin compatibility, and documentation; behavior-preserving migration path matters.

## Gain

**High** for long-term authoring clarity and reducing mode explosion; clearer mapping from designer intent to skill selection **and** spacing/defensive behavior.

## Work

- Capture target axis set (minimum viable list — e.g. risk, support weight, spacing; plus any missing pole such as **follow leader vs roam** if needed).
- For each axis, assign **owning subsystem**: skill decision (`JABS_AllyAI` / `JABS_AI`), movement/formation (`JABS_AiManager` / ally formation), defensive interrupts (readiness/dodge/guard parameters), so responsibilities stay explicit.
- Define **migration**: map each legacy `JABS_AllyAI.modes` key to **default positions** on the axes (and/or ship presets that reproduce today’s modes exactly).
- Update actor/class tags or plugin parameters UI story (string mode vs multi-field config); document naming collision policy vs **`JABS_EnemyAI`** trait vocabulary.
- Optional: ship **named presets** as sugar on top of axes (not replacements for the data model).

## Notes

- Ally dodge-skill AI shipped (`../completed/ally-dodge-skill-ai.md`); still coordinate defensive-layer follow-ups when axes inform interrupt weights.
- Keeps enemy **`JABS_EnemyAI`** trait model skill-centric; ally “personality” lives in ally-specific configuration unless we deliberately unify vocabulary later.
