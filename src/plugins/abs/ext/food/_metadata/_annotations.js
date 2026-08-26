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
 * FOOD CHAIN BAR COLOR:
 * Tag any phase state in a food chain arc with a hex color to control how its
 * segment renders in the food chain HUD bar:
 *    <foodGroupColor:#RRGGBB>
 *  Where #RRGGBB is a six-digit hex color string.
 *
 * Example:
 *    <foodGroupColor:#44cc44>
 *
 * A phase state with no color tag renders as a neutral grey segment instead.
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
 * CHANGELOG:
 * - 1.0.3
 *    Routed the missing-duration authoring warning through J-Base's new
 *    Diagnostics, so it names J-ABS-Food in the console rather than the
 *    J-ABS-FOOD spelling this ship never actually shipped under.
 * - 1.0.2
 *    Repointed the last-item-consumed log at J-Log's new $mapLogs registry.
 *    The $lootLogManager global this called is gone. Requires J-Log 3.0.0
 *    when J-Log is installed at all.
 * - 1.0.1
 *    Corrected PLUGIN_NAME from J-ABS-FOOD to J-ABS-Food, matching the name the
 *    ship has always been built and shipped under.
 * - 1.0.0
 *    Initial release.
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