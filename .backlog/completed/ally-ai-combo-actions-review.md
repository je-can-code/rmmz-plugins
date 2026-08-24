# Review ally AI combo actions

## Source

- `src/plugins/abs/ext/allyai/managers/JABS_AiManager.js` (ally decision flow; line numbers drift)
- `src/plugins/abs/core/__models/JABS_SkillSlotManager.js` (combo / slot wiring; approximate)
- `src/plugins/abs/ext/juice/` (visibility — juice makes ally actions readable while controlling another actor)
- `src/plugins/abs/ext/juice/resolvers/JuiceProfileResolver.js` (only if investigation proves cooldown/skill mismatch vs overlay)

## Context

J-ABS-Juice overlays make it obvious what skill-shaped action an ally is executing. When the player is not controlling that ally, combo / follow-up selections can look wrong or wasteful in practice — worth an intentional pass over ally AI + combo queue behavior now that the feedback loop is clear.

**Observed:** ally weapon swing juice showed a **gauntlet** icon while, loadout-wise, the gauntlet lived in the **offhand** slot and the only mapped offhand skill was **guard**. Unclear whether (a) ally AI queued a non-guard offhand/mainhand action anyway, (b) guard is wired through the same visual/hook path as strikes, or (c) juice inferred the wrong slot / cooldown type for that `JABS_Action`. Ally guard competency (“do allies guard intelligently?”) belongs in the same review pass.

## Severity

**Low–medium** (polish / AI credibility); not usually blocking unless allies burn cooldowns or pick nonsense lines often.

## Gain

**Medium** for party combat clarity and trust in ally AI; may pair with tuning notes or guardrails on combo eligibility. **Possible juice correctness** if resolver assumptions fail for allies or guard-shaped actions.

## Work

- Reproduce while controlling a non-leading actor; log or observe which actions allies queue as combo follow-ups.
- Decide policy: valid weird behavior vs bugs (wrong slot, blocked skill, priority inversion).
- **Guard lane:** confirm whether allies execute guard as a map action with juice hooks; whether ally AI ever commits to guard vs always swinging.
- **Juice lane:** if swings mismatch equipped skills, trace `action.getCooldownType()` vs inferred gear for that frame (duplicate ally-specific bugs here vs close #juice).
- Adjust ally AI or combo fallback rules as needed; document any intentional “berserk” lines vs fixes.

## Notes

Juice did not create ally intent — it surfaced it — but bad inference would still be on juice. Keep strike vs support juice defaults in mind for healing-shaped slots when reviewing.
