//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A JABS extension enabling food group chain states and a dedicated R2 food slot.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-ABS-InputManager
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-ABS-InputManager
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin adds food group chain states, a dedicated R2 food slot, and an
 * ABS quick-menu Equip Food screen. It depends on J-ABS core for the general
 * <applyStateOnExpire> state-chaining mechanic.
 *
 * ============================================================================
 * FOOD ITEMS:
 * Tag any item with <food:TYPE> to designate it as a food item.
 * TYPE is the lowercase chain group key (e.g. protein, vegetable, fruit).
 * Food items are routed to the R2 food slot and excluded from the tool slot.
 *
 *    <food:TYPE>
 *
 * Example:
 *    <food:protein>
 *
 * ============================================================================
 * FOOD CHAIN STATES:
 * Tag every state that belongs to a food arc with the group name:
 *    <foodChain:TYPE>
 *  Where TYPE is a lower-case string (protein, vegetable, fruit, grain,
 *  dairy, confection, overstuffed, etc.). All states in one arc share TYPE.
 *
 * Chain progression is authored entirely via <applyStateOnExpire> (J-ABS
 * core). The Well Fed entry state expires into the peak, the peak expires
 * into the tail, and the tail has no expire link (natural end of chain).
 *
 * DURATION (required for arcs longer than ~2.8 minutes):
 * Use J-ABS core {@code <stateDuration:FRAMES>} on each phase state (see J-ABS
 * annotations). Chef Adventure targets: ca/docs/food/food-chain-durations.md
 *
 * Example three-phase Protein chain:
 *   State "Well Fed (Protein)"  → <foodChain:protein>  <applyStateOnExpire:[PUMPED_ID, 100]>
 *   State "Pumped"              → <foodChain:protein>  <applyStateOnExpire:[HANGRY_ID, 100]>
 *   State "Hangry"              → <foodChain:protein>  (no expire link — chain ends)
 *
 * ============================================================================
 * OVERSTUFFED IMMUNITY (FIELD MEDIC):
 * Any battler whose getAllNotes() sources include the following tag is treated
 * as having Field Medic mastery. This tag may appear on any passive state,
 * accessory, class, or other note-bearing database object.
 *
 *    <overstuffedImpervious>
 *
 * With this tag active on the leader, re-feeding during any phase (including
 * Well Fed and peak) snaps to the new Well Fed instead of triggering the
 * Overstuffed chain. Tail-phase behaviour is unchanged (always rescues).
 *
 * ============================================================================
 * PLUGIN PARAMETERS:
 * @param equipFoodText
 * @type string
 * @text Equip Food Label
 * @desc The label shown in the JABS quick-menu for the Equip Food command.
 * @default Equip Food
 */
//=================================================================================================
/* eslint-enable max-len */
//endregion annotations