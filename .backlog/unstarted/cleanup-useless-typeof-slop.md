---
status: open
area: code-quality
---

# Cleanup useless `typeof` in plugin source

## Severity

**Medium** for correctness risk (duck-typing hides missing aliases / wrong plugin order until runtime). **Low** per individual call site, but the pattern is widespread (~30 files under `src/plugins/` as of 2026-06).

## Gain

**High** for codebase hygiene and author intent: mid-plugin code should assume known types, ship load order, and hydrated J-Base models — not blind runtime probes. Removes AI-era slop (`typeof x === 'function'`, redundant primitive checks), makes optional-extension boundaries explicit (`@orderAfter`, `J.*` gates, or real APIs), and **adds a build gate so new violations cannot ship**.

## Source

Grep snapshot (`typeof` under `src/plugins/`, 2026-06):

- **Function duck-typing (priority delete):** `Game_CharacterBase.js`, `JABS_Battler.js` (×4), `Game_Event.js` (pixel ext, ×4), `JABS_Engine.js`, `Spriteset_Map.js`, `RPGManager.js`, `Game_Character.js` (regions), `JABS_Battler.js` (pixel ext), `Game_CharacterBase.js` (pixel ext), etc.
- **Primitive / shape probes (review, usually replace):** `juiceConfigValidation.js` (×8), `JaftingSalvageLedger.js`, `Input.js`, SDP panel models, `JABS_HitstopData.js`, `resources/Game_Battler.js`, …
- **Allowlist candidate:** `src/plugins/_base/_utilities/JsonMapper.js` — blind JSON → typed values is the legitimate use case.

`src/build-tools/**` may keep `typeof` for tooling; out of scope unless we want a separate policy.

## Context

`typeof` in plugin ships is almost entirely historical AI output, not author style. Most usages do not defend against real unknowns: dependencies are declared in plugin headers, prototypes are aliased in known order, and `$data*` rows are hydrated classes.

Worst offenders:

- `typeof this.someMethod === 'function'` before calling a method that **must** exist when the owning plugin loaded (`getJabsBattler`, diagonal helpers, etc.).
- `typeof x === 'number' | 'object' | 'string'` on values that already came from parsers, plugin params, or internal models.

Exception: **JsonMapper** and similar boundary utilities that intentionally accept untyped JSON.

## Work

1. **Policy** — Document in `.junie/guidelines.md` (or workspace rules): no `typeof` in `src/plugins/**` except an explicit allowlist (start with `JsonMapper.js`; add others only with justification in the backlog item or PR).
2. **Build gate (required)** — Add enforcement so violations **cannot** get built. Wire into `bun run hotfix` (same tier as `verify:ships` / `oxlint`): ban `UnaryExpression[operator='typeof']` via Oxlint (`jsPlugins` + `no-restricted-syntax`) **or** a dedicated `verify:no-typeof-in-plugins` script with the same allowlist. Native Oxlint has no built-in rule; whichever path we pick must **fail the build** on any unallowlisted `typeof` under `src/plugins/**`.
3. **Sweep `src/plugins/`** in reviewable chunks (suggest: J-Base/utilities → ABS core → Pixel bridges → ext/*):
   - **Delete** `typeof … === 'function'` / `!== 'function'`; call the API or guard on `J.*` / plugin presence / battler registration instead.
   - **Replace** primitive `typeof` checks with explicit shape checks (`Number.isFinite`, `Array.isArray`, `instanceof` hydrated row types) only where input is genuinely external; prefer trusting hydrated models when the value is already internal.
   - **Leave** allowlisted JsonMapper (and any other approved boundary files).
4. **Regression** — `bun run hotfix` + targeted playtests where behavior touched map movement, optional ext bridges, or config loaders.

## Acceptance

- Zero `typeof` under `src/plugins/**` except documented allowlist.
- **Enforcement rule is live in the hotfix chain** — unallowlisted `typeof` in plugin source fails `bun run hotfix` (lint and/or `verify:*`); violations **cannot** be built or copied to `project/` / CA.
- No new `typeof … === 'function'` anywhere in plugin ships.

## Notes

- Related vent/context: passive conditional `move` tile credit originally used `typeof` guards on `getJabsBattler`; real bug was `Game_Player#onStep` shadowing `Game_CharacterBase` (fixed via `updatePixelStepping` hook).
- Do **not** drive-by this in feature PRs; dedicated sweep(s) like [`boolean-notetag-regex-audit.md`](../completed/boolean-notetag-regex-audit.md).
- `typeof J !== 'undefined'` global probes (e.g. `Window_SkillEquipDetail.js`) should become explicit `J.SKS` / namespace checks per J namespace bootstrap conventions.
- **Cross-plugin extension hook anti-pattern (2026-06-10):** `passive/ext/affix/windows/Window_PassiveDetail.js` used `typeof AutoApplyStateDisplay === 'undefined'` and `typeof RemoveStateOnMoveDisplay === 'undefined'` to guard display logic that belonged in `passive/ext/conditional` — not in Affix at all. This implicitly bound two unrelated extensions together and used `typeof` to paper over the wrong ownership. Fix: move the draw methods and alias into Conditional's own `windows/Window_PassiveDetail.js`; replace the guard with a `J.PASSIVE.EXT.CONDITIONAL` namespace check at the one legitimate boundary. The sweep should watch for this flavor specifically: `typeof SomeClass === 'undefined'` inside a window/scene is almost always a sign the code is in the wrong extension.
