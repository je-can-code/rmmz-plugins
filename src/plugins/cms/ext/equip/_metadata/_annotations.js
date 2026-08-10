//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A redesign of the equip menu.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-CMS
 * @orderAfter J-Base
 * @orderAfter J-CMS
 * @help
 * ============================================================================
 * This is a redesign of the equipment menu.
 * It includes the ability to see more parameters when changing equips.
 * You can also now press the square button (or equivalent of) to view the
 * detailed information relating to JABS (if applicable).
 * ============================================================================
 * NOTE ABOUT NOTETAGS:
 * This plugin has no notetags of its own- it is purely a scene/window
 * redesign of the native equip menu.
 * ============================================================================
 * CHANGELOG:
 * - 1.2.0
 *    The equipment list now orders by database id rather than by the datastore
 *    slot each row happens to occupy. A refined equip keeps the id of the thing
 *    it was refined from and only takes a new slot, so slot order stranded every
 *    refined copy in a block at the bottom of the list, far from the plain one it
 *    came from. Id order sits them together, plain one first, and puts two copies
 *    of the same equip next to each other. The empty row meaning "take this slot
 *    off" has no id and stays pinned last.
 * - 1.1.0
 *    Added a context action on the equip slot list to unequip the
 *    currently-selected slot directly, without opening the item list.
 *    Renamed slot-window handler symbols pagedown/pageup to
 *    actor-next/actor-prev.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 */