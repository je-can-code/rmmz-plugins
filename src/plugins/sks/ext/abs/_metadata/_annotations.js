//region annotations
/*:
 * @target MZ
 * @plugindesc [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Makes JABS's combat/dodge/offhand quick menus respect SKS-equipped skills.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-SkillSlots
 * @base J-ABS
 * @orderAfter J-Base
 * @orderAfter J-SkillSlots
 * @orderAfter J-ABS
 * @help
 * ============================================================================
 * OVERVIEW
 * Without this extension, SKS's equip scene and JABS's combat/dodge/offhand
 * quick menus are unaware of each other: a skill sitting in an SKS slot has no
 * effect on what JABS considers assignable, and every learned, menu-eligible
 * skill remains selectable regardless of whether it is actually equipped.
 *
 * This extension narrows JABS's combat, dodge, and offhand candidate pools
 * down to only the skills an actor currently has equipped via SKS, alongside
 * any skill exempt from slotting entirely (tagged <unslotted>, or ineligible
 * for slotting by skill type). It also keeps JABS's own quick-menu slots in
 * sync when a skill is unequipped from SKS- if that skill was actively pinned
 * to a combat, dodge, or offhand button, that button is cleared automatically
 * rather than being left pointing at a skill the actor can no longer use.
 *
 * The mainhand-provided offhand skill (granted by the equipped weapon, not
 * learned or chosen by the player) is always exempt from this filter, since
 * it was never meant to compete for an SKS slot in the first place.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 */
//endregion annotations
