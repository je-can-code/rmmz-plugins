//region annotations
/* eslint-disable max-len */
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A J-HUD extension that displays each battle member's damage output.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-ABS-Dps
 * @base J-HUD
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-ABS-Dps
 * @orderAfter J-HUD
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin adds a damage readout to the map screen. It draws one row per
 * battle member and three columns of rates:
 *
 *   Now   - the rolling rate across the last few seconds of combat.
 *   Fight - the rate across the encounter in progress.
 *   Last  - the rate across the encounter before it.
 *
 * This plugin measures nothing itself. Every number on it is asked of the
 * tracker in J-ABS-Dps, which is where the rules about what counts and how it
 * is timed all live.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * IT IS OFF BY DEFAULT.
 * This is a tuning instrument, not part of the game's presentation. It stays
 * off until somebody is actually measuring something.
 *
 * THE FIGURES HOLD BETWEEN FIGHTS.
 * The clock behind them only runs while the party is in combat, so the table
 * does not bleed to zero on the walk to the next encounter. The Fight column
 * keeps showing the fight that just ended, and only moves down into Last when
 * the next one begins.
 *
 * A LOW NUMBER IS A READING, NOT A GAP.
 * Every member is measured against the same encounter clock. An ally who spent
 * the fight dead or idling divides what little they did by the whole fight and
 * reads low, which is the thing worth knowing.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 * PLUGIN PARAMETERS:
 * @param enabled
 * @type boolean
 * @text Show Readout
 * @desc Whether or not the damage readout is drawn. Off by default; this is an instrument rather than part of the game.
 * @default false
 *
 * @param windowX
 * @type number
 * @text Window X
 * @desc The x coordinate of the readout's top-left corner.
 * @default 0
 *
 * @param windowY
 * @type number
 * @text Window Y
 * @desc The y coordinate of the readout's top-left corner.
 * @default 0
 *
 * @param windowWidth
 * @type number
 * @text Window Width
 * @desc Width of the readout. Widen if long battler names clip in the leading column.
 * @default 360
 *
 * @param windowHeight
 * @type number
 * @text Window Height
 * @desc Height of the readout. Needs one row for the headings plus one per battle member; raise it if rows clip.
 * @default 160
 *
 * @param windowOpacity
 * @type number
 * @min 0
 * @max 255
 * @text Window Opacity
 * @desc Opacity of the windowskin frame and backdrop only (0 = invisible panel, 255 = opaque). The numbers stay fully visible.
 * @default 255
 */
//=================================================================================================
/* eslint-enable max-len */
//endregion annotations