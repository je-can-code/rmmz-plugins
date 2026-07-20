//region annoations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] An extension for JABS that allows multiple damage formulas.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @help
 * ============================================================================
 * OVERVIEW
 * ----------------------------------------------------------------------------
 * This extension enables a single skill to apply additional effects using one
 * or more "formula packets" or "child-skill packets". Each packet can:
 *   - Fire at a specific time (on use or on hit)
 *   - Affect a particular set of recipients (self, allies, target, enemies, all)
 *   - Either:
 *       1) Apply an inline formula to HP/MP/TP, or
 *       2) Execute another authored skill as a child
 *
 * Packets are defined via note tags on skills. Multiple packets can be declared
 * on the same skill by placing multiple tags on the skill’s note box.
 *
 * Requirements:
 *   - J-Base (required by all of my plugins)
 *   - J-ABS (Action Battle System)
 *
 * Scope:
 *   - These tags are read from Skills only.
 *   - Items are currently not parsed by this extension.
 *
 * ============================================================================
 * TAGS: BY-FORMULA PACKETS
 * ----------------------------------------------------------------------------
 * Use this to apply an inline formula result to a resource for one or more
 * recipients when the packet triggers.
 *
 * Tag format:
 *   <onApplyFormula:[HH, AA, RR, FORMULA]>
 *
 * Where:
 *   - HH (trigger):
 *       hit  -> triggers after the parent skill successfully hits a target
 *       use  -> triggers immediately when the parent skill is used (even if it misses)
 *   - AA (affect):
 *       self     -> the user of the skill
 *       target   -> the primary target of the parent skill (falls back to self if none)
 *       allies   -> all allies of the user on the map
 *       enemies  -> all enemies of the user on the map
 *       all      -> all battlers on the map (living and animate only)
 *   - RR (resource):
 *       hp, mp, tp
 *   - FORMULA: A JavaScript expression evaluated with these variables in scope:
 *       a = source (the user/subject)
 *       b = recipient (the current entity being affected)
 *       v = $gameVariables._data (array-style access: v[10], etc.)
 *       i = the parent RPG_Skill (useful for metadata lookups)
 *     The formula may use standard JS math (e.g., Math.max, Math.floor).
 *
 * Semantics of the formula result:
 *   - Positive result => loss (damage to HP/MP/TP)
 *   - Negative result => gain (healing HP, or granting MP/TP)
 *   - Zero => no effect
 *
 * Battle pipeline adjustments (applied automatically):
 *   Damage path (positive results):
 *     - Element rate (from the parent skill)
 *     - Critical (on-hit packets only, mirrors the parent action’s crit)
 *     - Physical/Magical damage rate (based on parent skill’s phys/mag type)
 *     - Native guard
 *     - Variance
 *     - JABS guard/parry reductions
 *   Healing path (negative results turned positive internally):
 *     - Element rate
 *     - Physical/Magical damage rate (treats as the parent’s type)
 *     - Variance
 *     - REC (recovery) on the recipient, and HAR (healing rate) on the caster
 *
 * Visuals and logs:
 *   - Popups (J-POPUPS): shows resource-specific damage/heal popups
 *   - Logs (J-LOG): writes action-log entries attributed to the parent skill
 *
 * Examples:
 *   - On hit, damage the original target’s HP for the user’s ATK x2 minus target DEF:
 *       <onApplyFormula:[hit, target, hp, a.atk * 2 - b.def]>
 *
 *   - On use, grant self 25 TP immediately:
 *       <onApplyFormula:[use, self, tp, 25]>
 *
 *   - On hit, heal allies for 10% of the user’s max HP (negative = heal):
 *       <onApplyFormula:[hit, allies, hp, -(a.mhp * 0.10)]>
 *
 *   - On use, drain 5 MP from all enemies (positive = loss):
 *       <onApplyFormula:[use, enemies, mp, 5]>
 *
 * NOTE: the formula segment may not contain a comma (the tuple is parsed by
 * splitting on commas), so multi-argument function calls like Math.max(a, b)
 * cannot be used inline. Keep formulas to operators only (+ - * / ( ) and
 * whitespace); wrap complex logic in a Game_Action-registered context helper
 * instead (see registerFormulaContext).
 *
 * ============================================================================
 * TAGS: BY-SKILL (CHILD SKILL) PACKETS
 * ----------------------------------------------------------------------------
 * Use this to execute another authored skill as a child of the parent action.
 * Child skill executions:
 *   - Do not consume cost, do not apply cooldown, and do not run common events.
 *   - Execute immediately as a JABS action (animations/effects/collisions/logs/threat apply).
 *   - Do not cascade further FORMULA/skill packets (one level only).
 *   - For on-hit packets, child damage can mirror the parent crit state when appropriate.
 *
 * Tag format:
 *   <onApplySkill:[HH, AA, SKILL_ID]>
 *
 * Where:
 *   - HH (trigger): hit | use
 *   - AA (affect): self | target | allies | enemies | all
 *   - SKILL_ID: the database ID of the skill to execute
 *
 * Examples:
 *   - On hit, also fire skill 123 at the original target:
 *       <onApplySkill:[hit, target, 123]>
 *
 *   - On use, cast an aura skill 77 centered on self:
 *       <onApplySkill:[use, self, 77]>
 *
 * Notes:
 *   - For target/allies/enemies/all, position bias uses the recipient’s current
 *     location when available, which is useful for ground-targeted child skills.
 *   - Child skill execution is compute/force-only (no costs/cooldowns/casts).
 *
 * ============================================================================
 * EXECUTION ORDER AND TIMING
 * ----------------------------------------------------------------------------
 * - on-use packets are applied immediately when the parent skill is used.
 * - on-hit packets are applied after the parent skill resolves hit/miss and damage.
 * - Multiple packets of the same timing are applied in the order they appear in notes.
 *
 * ============================================================================
 * VALIDATION AND SAFETY
 * ----------------------------------------------------------------------------
 * - Invalid tags (unknown trigger/affect/resource/mode) are ignored.
 * - Skills only: tags on other database objects are ignored by this extension.
 * - Recipients must be alive and animate (dead/inanimate are filtered out).
 * - If a child skill id does not exist, the packet is ignored.
 * - Inline formulas run under JS eval; keep them simple and deterministic.
 *
 * ============================================================================
 * COMPATIBILITY
 * ----------------------------------------------------------------------------
 * - J-Base: required; used for note parsing helpers.
 * - J-ABS: required; this is an ABS extension and depends on JABS context.
 * - J-POPUPS (optional): enables damage/heal popups for packets.
 * - J-LOG (optional): enables action-log entries for packets.
 *
 * ============================================================================
 * QUICK REFERENCE
 * ----------------------------------------------------------------------------
 * BY-FORMULA:
 *   <onApplyFormula:[hit|use, self|target|allies|enemies|all, hp|mp|tp, FORMULA]>
 *
 * BY-SKILL:
 *   <onApplySkill:[hit|use, self|target|allies|enemies|all, SKILL_ID]>
 *
 * Formula variables:
 *   a = user/subject, b = recipient, v = $gameVariables._data, i = RPG_Skill
 * Result sign:
 *   + => damage/loss, - => heal/gain
 *
 * ============================================================================
 * CHANGELOG
 * ----------------------------------------------------------------------------
 * - 1.1.0
 *   Changed <on-HH:to-AA:by-formula:for-RR:[FORMULA]> to
 *   <onApplyFormula:[HH, AA, RR, FORMULA]>, and <on-HH:to-AA:by-skill:[SKILL_ID]>
 *   to <onApplySkill:[HH, AA, SKILL_ID]>. The old tag-name-encoded-enum shape
 *   required a bespoke, ad-hoc multi-capture-group reader
 *   (RPGManager.getAllCapturesFromNoteByRegex) instead of the standardized
 *   bracket-array family used by every other multi-value tag; the new single
 *   bracket form reads through getArraysFromNotesByRegex like the rest. No
 *   existing Chef Adventure data used these tags, so no migration was needed.
 * - 1.0.4
 *   Healing path now also applies HAR (healing rate) on the caster, alongside
 *   the existing REC (recovery) on the recipient. Requires J-Base 3.5.0+.
 * - 1.0.2
 *   Raised minimum J-ABS version requirement to 4.7.0.
 * - 1.0.1
 *   Raised minimum J-ABS version requirement to 4.6.0.
 * - 1.0.0
 *   Initial release.
 * ============================================================================
 */
//endregion annotations