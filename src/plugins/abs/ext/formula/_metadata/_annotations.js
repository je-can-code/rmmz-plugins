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
 *   <on-HH:to-AA:by-formula:for-RR:[FORMULA]>
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
 *       <on-hit:to-target:by-formula:for-hp:[a.atk * 2 - b.def]>
 *
 *   - On use, grant self 25 TP immediately:
 *       <on-use:to-self:by-formula:for-tp:[25]>
 *
 *   - On hit, heal allies for 10% of the user’s max HP (negative = heal):
 *       <on-hit:to-allies:by-formula:for-hp:[-(a.mhp * 0.10)]>
 *
 *   - On use, drain 5 MP from all enemies (positive = loss):
 *       <on-use:to-enemies:by-formula:for-mp:[5]>
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
 *   <on-HH:to-AA:by-skill:[SKILL_ID]>
 *
 * Where:
 *   - HH (trigger): hit | use
 *   - AA (affect): self | target | allies | enemies | all
 *   - SKILL_ID: the database ID of the skill to execute
 *
 * Examples:
 *   - On hit, also fire skill 123 at the original target:
 *       <on-hit:to-target:by-skill:[123]>
 *
 *   - On use, cast an aura skill 77 centered on self:
 *       <on-use:to-self:by-skill:[77]>
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
 *   <on-(hit|use):to-(self|target|allies|enemies|all):by-formula:for-(hp|mp|tp):[FORMULA]>
 *
 * BY-SKILL:
 *   <on-(hit|use):to-(self|target|allies|enemies|all):by-skill:[SKILL_ID]>
 *
 * Formula variables:
 *   a = user/subject, b = recipient, v = $gameVariables._data, i = RPG_Skill
 * Result sign:
 *   + => damage/loss, - => heal/gain
 *
 * ============================================================================
 * CHANGELOG
 * ----------------------------------------------------------------------------
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