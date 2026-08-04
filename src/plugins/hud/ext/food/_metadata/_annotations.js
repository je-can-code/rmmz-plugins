//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A J-HUD extension that displays the current food chain status on screen.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-ABS-Food
 * @base J-HUD
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-ABS-Food
 * @orderAfter J-HUD
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin adds a food chain HUD frame to the screen.
 * It reads the leader's current food chain plan from JABS_Engine and renders
 * a vertical strip with a state icon, a segmented duration bar colored per
 * phase, and a label list highlighting the currently active phase.
 *
 * This plugin does NOT parse food notetags or register the R2 button.
 * Those responsibilities belong to J-ABS-Food.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.1
 *    The food frame no longer declares private members. A window's constructor
 *    reaches initialize, and through it the drawing hooks, before a derived
 *    class installs its own members- so anything private was being touched on
 *    an object that did not yet have it.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 * PLUGIN PARAMETERS:
 * @param windowX
 * @type number
 * @text Window X
 * @desc The x coordinate of the food chain window's top-left corner.
 * @default 0
 *
 * @param windowY
 * @type number
 * @text Window Y
 * @desc The y coordinate of the food chain window's top-left corner.
 * @default 70
 *
 * @param windowWidth
 * @type number
 * @text Window Width
 * @desc Width of the food chain strip. Widen if long state names (e.g. Well Fed (protein)) clip horizontally.
 * @default 200
 *
 * @param windowHeight
 * @type number
 * @text Window Height
 * @desc Total window height. Only grows the chain-state label list; icon and bar size stay fixed. Every chain phase is drawn at full row height — raise this if a longer chain clips.
 * @default 478
 *
 * @param windowOpacity
 * @type number
 * @min 0
 * @max 255
 * @text Window Opacity
 * @desc Opacity of the windowskin frame and backdrop only (0 = invisible panel, 255 = opaque). Food icons, bar, and labels stay fully visible.
 * @default 255
 */
//=================================================================================================
/* eslint-enable max-len */
//endregion annotations