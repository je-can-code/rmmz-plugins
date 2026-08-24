# J-OneTimeItemBoost rewrite

## Severity

**Low** until OTIB is in active use; **high** inside any game relying on current behavior (rewrite implies migration).

## Gain

**High once executed** (clean design + tests + visible player fantasy). **Negative gain** from patching legacy code before rewrite — defer small fixes unless blocking.

## Motivation

Hold new automated tests and non-trivial fixes for J-OTIB until this plugin is rewritten from scratch. The current One-Time Item Boost implementation is slated for a full redesign; investing in deep regression coverage or patching legacy behavior is deferred.

The legacy plugin applies **silent** bonuses by patching `param` / `xparam` / `sparam` / `maxTp`, so upgrades read as “+3 somewhere” next to heavier systems (SDP, NATURAL, etc.) and lack any UI receipt. The rewrite should make unlocks **legible** (states + screens + optional messaging), not another invisible stat layer.

## Target plan (agreed direction)

### Architecture: J-Passive core + extensions; OTIB first ext

- Promote **J-Passive** to a **core + ext** layout (same pattern as other JMZ plugins).
- **OTIB** ships as the first passive extension (e.g. `src/plugins/passive/ext/otib/`), namespace **`J.PASSIVE.EXT.OTIB`**, built and loaded **after** passive core. Document `@base` / `@orderAfter` so actor hooks compose correctly.
- **Mechanics:** drop OTIB-specific param middleware. Unlocks grant **database states** whose traits carry the real effects. Feed them through **J.PASSIVE’s pipeline**: synthetic entries in `getPassiveStateSources()` (or equivalent) so `refreshPassiveStates()` picks them up; call **`refreshPassiveStates()`** after a qualifying item consume. Do **not** duplicate passive collection logic inside OTIB.

### Player feedback

- **J-Log (DiaLog):** optional integration for the unlock beat — short, line-based, face-capable copy when an OTIB fires (`J.LOG` absent → fallback such as `$gameMessage` or SE-only). Keep messaging consistent with the state’s database name/description so the popup matches the status UI.

### UI

- **J-Passive (core):** passive states currently have no dedicated visibility. Add a **status (or menu) affordance** — e.g. a **tab** — that lists **all** passives currently contributing via the passive pipeline (equipment, class, skills, states-on-actor, party passives, **and** OTIB once wired).
- **J-Passive.EXT.OTIB:** add a **collection / “earned from items”** view (or sub-list) driven by **save-backed unlock data** (item ↔ state ↔ unlocked), so players see milestones separately from the generic passive inventory.

### Serialization / registry

- Consider **`jsonex-j-register-serialization-registry.md`** if the new design keeps custom save models; prefer **JSON-safe** actor fields where possible.

## Scope when tackled

- Restructure **`src/plugins/passive/`** into core + ext; implement **`src/plugins/passive/ext/otib/`** (or agreed path) and remove or replace legacy **`src/plugins/otib/`** param-based implementation.
- Rebuild shipped output via **`bun run hotfix`** (all affected plugins).
- Add tests after the design stabilizes — e.g. **`test/plugins/passive/`** (and ext/otib as needed): metadata, VM behavior, unlock → `refreshPassiveStates` → passive id present.
- Migration note: games using **old OTIB save shape** need a defined upgrade path or documented breakage.
