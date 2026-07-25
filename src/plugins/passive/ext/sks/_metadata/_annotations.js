//region annotations
/*:
 * @target MZ
 * @plugindesc [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Gates passive state application by SKS equip state.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-Passive
 * @base J-SkillSlots
 * @orderAfter J-Base
 * @orderAfter J-Passive
 * @orderAfter J-SkillSlots
 * @help
 * ============================================================================
 * OVERVIEW
 * Without this extension, a learned skill contributes its <passive:[...]>
 * effect the instant it is known, regardless of whether it is equipped into
 * an SKS slot.
 *
 * This extension narrows an actor's passive-state-sourced skills down to only
 * those currently equipped via SKS, alongside any skill exempt from slotting
 * entirely (tagged <unslotted>, or ineligible for slotting by skill type).
 * Exempt skills behave exactly as they do without this extension- always
 * contributing their passive effect once known. Enemies are unaffected, since
 * SKS's equip state only exists for actors.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 */
//endregion annotations
