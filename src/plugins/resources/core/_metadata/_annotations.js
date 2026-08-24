//region annotations
/*:
 * @target MZ
 * @plugindesc [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Extends skill cost/gain system to include HP, MP, and TP.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @orderAfter J-Base-Save
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin extends the skill cost and gain system to support HP, MP, and TP
 * costs and gains defined entirely through notetags.
 *
 * Integrates with others of mine plugins:
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
 * HP cost reduction is registered in the parameter catalog as `hcr`.
 *
 * ============================================================================
 * HP COST
 * Have you ever wanted your skills to cost HP in addition to (or instead of)
 * MP and TP? Well now you can! By applying the appropriate tag(s) to a skill,
 * that skill will cost HP to execute. HP costs support flat amounts,
 * percentages of max HP, and formula expressions.
 *
 * NOTE:
 * By default, a battler cannot cast a skill if its HP cost would kill them.
 * Add the <hp-cost-can-kill> tag to allow casting even when it would be lethal.
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
 *  <hp-cost-can-kill>
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
 *  <hp-cost-can-kill>
 *    This skill can be cast even if it would reduce the caster to 0 HP.
 *
 * ============================================================================
 * HP COST REDUCTION (HCR)
 * Have you ever wanted to mitigate how much HP your skills cost, the same
 * way MCR and TCR work for MP and TP? Well now you can! By applying the
 * appropriate tag(s) to your database objects, you can reduce HP skill costs
 * across the board- because lets face it, raw HP costs can add up fast.
 *
 * NOTE:
 * Unlike MCR/TCR which are multipliers, HCR is additive subtraction from 100.
 * A tag of <hcr:[5]> means "reduce HP costs by 5 percentage points", making it
 * easy to read at-a-glance what each piece of equipment contributes.
 *
 * NOTE ABOUT THE FORMULA CONTEXT:
 * Unlike most formula tags in these plugins, this one is evaluated per note
 * source directly (not per-battler), so there is no `a` battler reference
 * available- only literal numeric expressions are safe here (e.g. `[5]`,
 * `[10 - 2]`). Referencing a battler property will throw.
 *
 * TAG USAGE:
 * - Actors
 * - Enemies
 * - Classes
 * - Equips (weapons, armors)
 * - States
 *
 * TAG FORMAT:
 *  <hcr:[VALUE]>
 *    Where VALUE is the integer percentage to reduce HP costs by.
 *
 * TAG EXAMPLES:
 *  <hcr:[5]>
 *    Reduces all HP skill costs by 5%.
 *
 * ============================================================================
 * HP GAIN
 * Have you ever wanted a skill that restores HP to the caster upon use,
 * separate from damage formulas? Well now you can! By applying the appropriate
 * tag(s) to a skill, the caster will recover HP when the skill is executed.
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
 * Have you ever wanted more expressive MP and TP costs than the single integer
 * the editor provides? Well now you can! The same flat/percent/formula tag
 * system is available for MP and TP, layered on top of the editor's native
 * cost fields so you don't lose anything you've already set up.
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
 * STACK COST / ITEM COST
 * Have you ever wanted a skill that costs something other than hp/mp/tp- like
 * charges banked up from an earlier proc, or literal ammo out of the party's
 * inventory? Well now you can! These feed directly into canPaySkillCost/
 * paySkillCost, so an unaffordable skill is refused to fire exactly like
 * insufficient MP already is- no separate UI wiring needed.
 *
 * NOTE:
 * Both tags live on the skill only (not on states/equips/etc.)- costs are
 * inherent to the skill. If more than one of the same tag is authored on one
 * note, only the last one found wins (same convention as flat/percent costs).
 *
 * TAG USAGE:
 * - Skills
 *
 * TAG FORMAT (stack cost):
 *  <stackCost:[STATE_ID,COUNT]>
 *    Requires J-ABS. The caster must hold at least COUNT stacks of STATE_ID
 *    to cast; COUNT stacks are consumed via decrementStateStacks on pay.
 *    Leave the state's own <stackMax:VAL> high/unset for an uncapped pool.
 *
 * TAG FORMAT (item cost):
 *  <itemCost:[ITEM_ID,COUNT]>
 *    ITEM_ID resolves against $dataItems only (not weapons/armors). The party
 *    must hold at least COUNT of the item to cast; COUNT are removed from
 *    the party's inventory via $gameParty.loseItem on pay.
 *
 * TAG EXAMPLES:
 *  <stackCost:[7,3]>
 * Costs 3 stacks of state 7 to cast; refuses to fire below that.
 *
 *  <itemCost:[12,2]>
 * Costs 2 of item 12 to cast; refuses to fire without them in stock.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.1.0
 *    Routed the _resources namespace into its own save section, so resource
 *    state lands in systems/resources.json rather than in the system blob.
 * - 1.0.0
 *    Initial release.
 *    Added HP/MP/TP costs and gains via flat, percent, and formula notetags.
 *    Added HCR (HP Cost Reduction) as an additive stat sourced from traits.
 *    Added <hp-cost-can-kill> tag to allow lethal HP costs.
 *    Registered {@code hcr} (HP Cost Reduction) in the parameter catalog.
 *    Added <stackCost:[STATE_ID,COUNT]> (requires J-ABS) and
 *    <itemCost:[ITEM_ID,COUNT]> skill costs, feeding directly into
 *    canPaySkillCost/paySkillCost alongside hp/mp/tp.
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