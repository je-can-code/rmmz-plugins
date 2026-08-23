# J-CMS — dynamic damage formula scaling breakdown

## Source

- `src/plugins/cms/ext/skill/windows/Window_SkillDetail.js` — `makeProjectedDamageParam` (eval whole formula → single **Raw Damage** vs `enemy(1)`)
- `ca/docs/weapons/` — weapon band formulas moving toward `(Σ a-side terms) − (Σ b-side terms)` (e.g. tome **MMP/MAT/MDF** scaling)
- Design discussion (2026-06): FFXIV potency / Persona tiers / Hades % — target **stat-transparent** scaling text derived from formula when possible

## Context

Player-facing skill detail today shows one **Raw Damage** number by evaluating the full RMMZ formula string. Authors write formulas like:

```text
((a.mmp * 0.05) + (a.mat * 1) + (a.mdf * 2)) - ((b.mdf * 1) + (b.mmp * 0.01))
```

**Want:** CMS (and later editor preview) to show readable lines such as:

- **Scaling:** 5% MMP · 100% MAT · 200% MDF  
- **Mitigation:** target MDF · target MMP (1%)  
- **Preview:** ~power − ~mitigation ≈ raw vs reference foe  

**Not** universal JS decompilation — only skills in an agreed **linear grammar**. Fallback stays today’s single projected number (or “n/a”).

**Does not block** weapon lot authoring (**141–150** tome, fist **151–180**); weapon docs should mark **CMS-scaling-compatible** formulas as they are locked.

## Work

1. **Convention doc** (short section in `.junie/guidelines.md` or `ca/docs/weapons/`): player-facing damage formulas use one top-level `-`, `a.*` offense sum, `b.*` defense sum, plain coefficients; exceptions use fallback display.
2. **`DamageFormulaBreakdown` utility** (J-Base or CMS-owned, hoisted global):
   - Parse restricted grammar (lightweight AST — not regex split on `-`).
   - Emit `{ power: [{ side:'a', param, coefficient, label }], defense: [...], flatTerms? }`.
   - Map `a.mmp` / `b.mdf` etc. to long-param / TextManager labels.
   - Eval each term with same `a, b, v, p` context as `makeProjectedDamageParam`.
   - Format coefficients as **% of stat** (`× 0.05` → **5% MMP**, `× 2` → **200% MDF**).
3. **J-CMS `Window_SkillDetail`:** replace or augment **Raw Damage** row with **Scaling** / **Mitigation** lines + optional preview; label defensive side **vs reference enemy** when using `$gameEnemies.enemy(1)`.
4. **Fallback:** unparseable formula → current **Raw Damage** only; no error spam in UI.
5. **Tests:** parser + formatter fixtures for weapon-band examples (tome baseline, simple ATK−DEF, flat `500 +`, failure cases with `Math.max`).
6. **Follow-up (optional):** `jmz-data-editor` skill board preview reuses same utility.

## Acceptance

- Tome-style formula displays **Scaling** and **Mitigation** coefficient lines in CMS skill detail for the viewing actor.
- Projected total still matches eval of full formula for the same `a, b, v, p`.
- Non-conforming formulas degrade gracefully to existing behavior.

## Notes

- Distinct from **J-ABS FormulaEffect** multi-formula packets — scope first pass: `skill.damage.formula` only.
- Proficiency term `p` in formula: show coefficient or “varies with proficiency” when present.
- Related: `ResourceCostManager` cost breakdown pattern in same CMS window (already splits flat / percent / formula).
