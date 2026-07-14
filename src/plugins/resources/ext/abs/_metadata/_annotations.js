//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Damage-linked HP, MP, and TP resource effects.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-Resources
 * @base J-ABS
 * @orderAfter J-Base
 * @orderAfter J-Resources
 * @orderAfter J-ABS
 *
 * @param healChainDepth
 * @text Heal Chain Depth
 * @type number
 * @min 0
 * @max 20
 * @default 5
 * @desc Maximum number of cascade rounds a single heal event can trigger.
 * 0 disables all cascades. Higher values allow deeper empathy-bond chains.
 *
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
 * STEAL RATES (LST / MST / TST)
 * Have you ever wanted a weapon that siphons life with every strike, or a
 * vampiric state that converts damage dealt into mana? Well now you can! By
 * applying the appropriate tag(s) across the database, a battler can recover
 * HP, MP, or TP equal to a percentage of the HP damage they deal, on every
 * hit.
 *
 * NOTE:
 * These are battler-wide percent-point stats, not per-skill tags- they're
 * summed from every note source on the battler (actor, class, weapons,
 * armors, states) and combined with any SDP panel bonus for the same
 * parameter key.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Weapons
 * - Armors
 * - Enemies
 * - States
 *
 * TAG FORMAT:
 *  <lst:VALUE>
 *    Lifesteal- VALUE percent of HP damage dealt is recovered as HP.
 *
 *  <mst:VALUE>
 *    Manasteal- VALUE percent of HP damage dealt is recovered as MP.
 *
 *  <tst:VALUE>
 *    Techsteal- VALUE percent of HP damage dealt is recovered as TP.
 *
 * TAG EXAMPLES:
 *  <lst:10>
 *    This battler recovers 10% of all HP damage they deal as HP.
 *
 *  <mst:5>
 *  <tst:5>
 *    This battler recovers 5% of all HP damage they deal as both MP and TP
 *    simultaneously (the three steal rates are independent and can stack).
 *
 * ============================================================================
 * ============================================================================
 * HEAL EVENTS
 * When a battler receives positive HP, MP, or TP recovery, a cascade of
 * secondary heals can be triggered based on notetags placed on any traited
 * source (actor, class, equip, state, skill).
 *
 * Two families:
 *
 *   onSelf tags — when THIS battler's trigger resource is healed, also heal
 *   PERCENT% of the heal amount as the output resource. Self always receives
 *   it; if RANGE > 0, allies within RANGE tiles also receive it.
 *
 *   onAlly tags — when an ally within RANGE tiles has their trigger resource
 *   healed, this battler (the observer) receives PERCENT% of that heal amount
 *   as the output resource.
 *
 * Cascades are limited by the healChainDepth plugin parameter (default 5).
 * Secondary heals themselves fire onHeal again, so chains of empathy bonds and
 * jelly transfusions can propagate naturally up to the depth limit.
 *
 * TAG USAGE:
 * - Actors, Enemies, Classes, Equips, States, Skills
 *
 * TAG FORMAT (onSelf):
 *  <onSelf{Trigger}Heal{Output}:[PERCENT, RANGE]>
 *  <onSelf{Trigger}Heal{Output}:[PERCENT, RANGE, MAX_DEPTH]>
 *    Trigger:   Hp | Mp | Tp | Any
 *    Output:    Hp | Mp | Tp
 *    PERCENT:   integer percentage of the heal amount to apply as secondary
 *    RANGE:     tile radius; 0 = self only, >0 includes allies within radius
 *    MAX_DEPTH: max cross-battler cascade hops (default: healChainDepth plugin param).
 *               The tag never echoes itself on the same battler regardless of this value.
 *
 * TAG FORMAT (onAlly):
 *  <onAlly{Trigger}Heal{Output}:[PERCENT, RANGE]>
 *  <onAlly{Trigger}Heal{Output}:[PERCENT, RANGE, MAX_DEPTH]>
 *    Trigger:   Hp | Mp | Tp | Any
 *    Output:    Hp | Mp | Tp
 *    PERCENT:   integer percentage of the ally's heal to apply to self
 *    RANGE:     tile radius; observer only reacts if healed ally is within range
 *    MAX_DEPTH: max cross-battler cascade hops (default: healChainDepth plugin param)
 *
 * TAG EXAMPLES:
 *  <onSelfHpHealMp:[50, 0]>
 *    When this battler receives HP healing, also recover 50% of that amount as
 *    MP. Self only (Jelly Mana Transfusion).
 *
 *  <onSelfHpHealHp:[25, 3]>
 *    When this battler is healed for HP, also heal self and allies within
 *    3 tiles for 25% of the same amount (Empathic Splash).
 *
 *  <onAllyHpHealHp:[30, 4]>
 *    Whenever an ally within 4 tiles receives HP healing, this battler also
 *    gains 30% of that heal amount as HP (Emotion Empathic Bond).
 *
 *  <onSelfAnyHealTp:[10, 0]>
 *    Any resource recovery on this battler also grants 10% as TP
 *    (Momentum from healing).
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.1.0
 *    Added HEAL EVENTS system with onSelf and onAlly resource cascade tags.
 *    24 notetag variants (4 triggers × 3 outputs × 2 families).
 *    New plugin parameter: healChainDepth (default 5) caps cascade depth.
 *    Fixed: Scene_Boot import was missing from entry.js, so parameter
 *    registration was never called. Now fixed.
 * - 1.0.0
 *    Initial release.
 *    Added on-attack HP/MP/TP gains via flat, percent, and formula skill tags.
 *    Added when-hit HP/MP/TP gains aggregated across all traited sources.
 * ============================================================================
 */
//endregion annotations