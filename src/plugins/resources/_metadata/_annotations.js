//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 RESOURCES] Extends skill cost/gain system to include HP, MP, and TP.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin extends the skill cost and gain system to support HP, MP, and TP
 * costs and gains defined entirely through notetags.
 *
 * Integrates with other plugins:
 * - J-ABS; JABS will use these costs/gains when executing skills.
 * - J-CMS-Skill; the skill detail window will display HP costs.
 * - J-HUD-InputFrame; the input frame will display HP costs on skill slots.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * By default, RMMZ supports MP and TP costs on skills via the editor.
 * This plugin adds HP cost and gain support, as well as tag-based flat,
 * percentage, and formula costs for MP and TP as well.
 *
 * longParam ID 34 is reserved by this plugin for the HP cost parameter.
 *
 * ============================================================================
 * HP COST
 * By applying the appropriate notetag to a skill, that skill will cost HP
 * to execute. HP costs can be flat, percentage, or formula-based.
 *
 * NOTE: By default, a battler cannot cast a skill if its HP cost would kill
 * them. Add the sacrifice tag to allow casting even when it would be lethal.
 *
 * TAG USAGE:
 * - Skills
 *
 * TAG FORMAT (flat):
 *  <hp-cost:FLAT>
 *    Where FLAT is the flat amount of HP to deduct.
 *
 * TAG FORMAT (percentage):
 *  <hp-cost:PERCENT%>
 *    Where PERCENT is the percentage of max HP to deduct.
 *
 * TAG FORMAT (formula):
 *  <hp-cost:[FORMULA]>
 *    Where FORMULA is an eval'd expression with access to `a` (the battler).
 *
 * TAG FORMAT (lethal / sacrifice):
 *  <hp-cost-sacrifice>
 *    Allows casting even when the HP cost would reduce HP to 0.
 *
 * TAG EXAMPLES:
 *  <hp-cost:50>
 *    Costs exactly 50 HP.
 *
 *  <hp-cost:10%>
 *    Costs 10% of max HP.
 *
 *  <hp-cost:[a.mhp / 4]>
 *    Costs 25% of max HP via formula.
 *
 *  <hp-cost-sacrifice>
 *    This skill can be cast even if it would reduce the caster to 0 HP.
 *
 * ============================================================================
 * HP COST REDUCTION (HCR)
 * Mirroring MCR (MP Cost Rate) and TCR (TP Cost Rate), HCR reduces the total
 * HP cost of skills. Unlike MCR/TCR which are multipliers, HCR is additive
 * subtraction from 100 — a tag of <hcr:5> means "reduce HP costs by 5%".
 *
 * TAG USAGE:
 * - Actors
 * - Enemies
 * - Classes
 * - Equips (weapons, armors)
 * - States
 *
 * TAG FORMAT:
 *  <hcr:VALUE>
 *    Where VALUE is the integer percentage to reduce HP costs by.
 *
 * TAG EXAMPLES:
 *  <hcr:5>
 *    Reduces all HP skill costs by 5%.
 *
 * ============================================================================
 * HP GAIN
 * By applying the appropriate notetag to a skill, that skill will restore HP
 * upon being cast. HP gains can be flat, percentage, or formula-based.
 *
 * TAG USAGE:
 * - Skills
 *
 * TAG FORMAT (flat):
 *  <hp-gain:FLAT>
 *
 * TAG FORMAT (percentage):
 *  <hp-gain:PERCENT%>
 *
 * TAG FORMAT (formula):
 *  <hp-gain:[FORMULA]>
 *
 * ============================================================================
 * EXTRA MP / TP COSTS AND GAINS
 * The same flat/percent/formula tags are also available for MP and TP,
 * layered on top of the editor's native MP/TP cost fields.
 *
 * TAG USAGE:
 * - Skills
 *
 * TAG FORMAT:
 *  <mp-cost:VALUE>  <mp-cost:PERCENT%>  <mp-cost:[FORMULA]>
 *  <tp-cost:VALUE>  <tp-cost:PERCENT%>  <tp-cost:[FORMULA]>
 *  <mp-gain:VALUE>  <mp-gain:PERCENT%>  <mp-gain:[FORMULA]>
 *  <tp-gain:VALUE>  <tp-gain:PERCENT%>  <tp-gain:[FORMULA]>
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    Initial release.
 *    Added HP/MP/TP costs and gains via flat, percent, and formula notetags.
 *    Added HCR (HP Cost Reduction) as an additive stat sourced from traits.
 *    Added sacrifice tag to allow lethal HP costs.
 *    Registered longParam ID 34 for Life Cost.
 * ============================================================================
 *
 * @param parentConfig
 * @text SETUP
 *
 * @param menu-switch
 * @parent parentConfig
 * @type switch
 * @text Menu Switch ID
 * @desc When this switch is ON, then this command is visible in the menu.
 * @default 101
 *
 */
//endregion annotations