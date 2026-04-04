//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v2.0.0 POPUPS] Map text popups (J.POPUPS core).
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @orderAfter J-Base
 * @param disablePopups
 * @text Disable all map popups
 * @type boolean
 * @default false
 * @desc When true, addTextPop ignores new pops.
 * @help
 * ============================================================================
 * Core map text pops: {@link TextPopBuilder}, {@link Map_TextPop}, rings, and
 * {@link Sprite_Damage} presentation. Optional extensions (J-Popups-ABS, etc.)
 * supply game-specific builders.
 * ============================================================================
 * BASIC USAGE:
 * Build with TextPopBuilder (fluent .forEnemyDamageRing(), .forLootDownRing(),
 * etc.), then character.addTextPop(pop.build()); character.requestTextPop();
 * Invalid or hand-built Map_TextPop values are rejected with a console warning.
 * ============================================================================
 * POPUP EMITTER (optional observers):
 * J.POPUPS.Helpers.PopupEmitter — event names in J.POPUPS.EventNames.
 * Listeners must stay cheap (O(1), no heavy work per frame).
 * ============================================================================
 * CHANGELOG:
 * - 2.0.0
 *    Split from J-TextPops; plugin renamed J-Popups; layout rings + WeakMap
 *    stacking; addTextPop validation; J.POPUPS.EXT.* extensions for J-ABS /
 *    Aptitude / SDP pop builders; disablePopups parameter (no J-ABS required).
 * - 1.1.0
 *    PopupEmitter lifecycle; DisablePopups; layout constants; variance/motion
 *    fixes; textAccent.
 * - 1.0.0
 *    Initial release (as J-TextPops).
 * ============================================================================
 */
//endregion Introduction
