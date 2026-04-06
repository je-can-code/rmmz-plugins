//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 RESOURCES-ABS] Damage-linked HP, MP, and TP resource effects.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-Resources
 * @base J-ABS
 * @orderAfter J-Base
 * @orderAfter J-Resources
 * @orderAfter J-ABS
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is an extension of J-Resources, enabling resource mutations that
 * trigger during combat rather than at the moment a skill is cast.
 *
 * Integrates with others of mine plugins:
 * - J-Popups-Resources; on-attack and when-hit gains emit popups automatically.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * Two new families of notetags are provided by this plugin:
 *
 *   ON-ATTACK tags live on skills. Every time that skill lands a hit on-map,
 *   the caster is granted some amount of HP, MP, or TP.
 *
 *   WHEN-HIT tags live on actors, classes, equips, or states. Every time that
 *   battler takes HP damage on-map, gains from all tagged sources are summed
 *   and applied to them.
 *
 * ============================================================================
 * ON-ATTACK GAINS
 * Have you ever wanted a skill that siphons a little bit of HP each time it
 * connects, or a technique that refunds TP on every successful hit? Well now
 * you can! By applying the appropriate tag(s) to a skill, the caster will
 * receive HP, MP, or TP every time that skill lands.
 *
 * NOTE:
 * Gains are scaled by the caster's REC stat.
 *
 * TAG USAGE:
 * - Skills
 *
 * TAG FORMAT (flat):
 *  <on-attack-hp-gain:FLAT>
 *  <on-attack-mp-gain:FLAT>
 *  <on-attack-tp-gain:FLAT>
 *    Where FLAT is a fixed amount to restore on each hit.
 *
 * TAG FORMAT (percentage):
 *  <on-attack-hp-gain:PERCENT%>
 *  <on-attack-mp-gain:PERCENT%>
 *  <on-attack-tp-gain:PERCENT%>
 *    Where PERCENT is a percentage of the caster's maximum for that resource.
 *
 * TAG FORMAT (formula):
 *  <on-attack-hp-gain:[FORMULA]>
 *  <on-attack-mp-gain:[FORMULA]>
 *  <on-attack-tp-gain:[FORMULA]>
 *    Where FORMULA is an eval'd expression.
 *    `a` = the caster battler.
 *    `b` = flat + calculated-percent (the accumulated base before formula).
 *
 * TAG EXAMPLES:
 *  <on-attack-hp-gain:20>
 *    Restores 20 HP to the caster each time this skill lands.
 *
 *  <on-attack-mp-gain:5%>
 *    Restores 5% of the caster's max MP each time this skill lands.
 *
 *  <on-attack-tp-gain:[a.level / 10]>
 *    Restores TP equal to one-tenth the caster's level per hit.
 *
 * ============================================================================
 * WHEN-HIT GAINS
 * Have you ever wanted a battler that builds rage the more they get beaten
 * around, or an accessory that slowly replenishes MP for a stalwart defender?
 * Well now you can! By applying the appropriate tag(s) to the database object
 * in question, that battler will receive HP, MP, or TP each time they take HP
 * damage. All tagged sources are summed together automatically.
 *
 * NOTE:
 * Gains are scaled by the target's REC stat.
 *
 * NOTE:
 * In formula tags, `b` is the raw HP damage dealt rather than the accumulated
 * base value- this lets you write damage-proportional expressions like `b * 0.05`.
 *
 * TAG USAGE:
 * - Actors
 * - Enemies
 * - Classes
 * - Equips (weapons, armors)
 * - States
 *
 * TAG FORMAT (flat):
 *  <when-hit-hp-gain:FLAT>
 *  <when-hit-mp-gain:FLAT>
 *  <when-hit-tp-gain:FLAT>
 *
 * TAG FORMAT (percentage):
 *  <when-hit-hp-gain:PERCENT%>
 *  <when-hit-mp-gain:PERCENT%>
 *  <when-hit-tp-gain:PERCENT%>
 *    Where PERCENT is a percentage of the target's maximum for that resource.
 *
 * TAG FORMAT (formula):
 *  <when-hit-hp-gain:[FORMULA]>
 *  <when-hit-mp-gain:[FORMULA]>
 *  <when-hit-tp-gain:[FORMULA]>
 *    Where FORMULA is an eval'd expression.
 *    `a` = the target battler.
 *    `b` = the raw HP damage dealt by the hit.
 *
 * TAG EXAMPLES:
 *  <when-hit-tp-gain:5>
 *    Gain 5 TP each time this battler takes HP damage (great for a "Rage" state).
 *
 *  <when-hit-mp-gain:2%>
 *    Recover 2% of max MP each time this battler takes HP damage.
 *
 *  <when-hit-tp-gain:[b * 0.05]>
 *    Gain TP equal to 5% of the damage taken- scales with how hard the hit was.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    Initial release.
 *    Added on-attack HP/MP/TP gains via flat, percent, and formula skill tags.
 *    Added when-hit HP/MP/TP gains aggregated across all traited sources.
 * ============================================================================
 */
//endregion annotations
